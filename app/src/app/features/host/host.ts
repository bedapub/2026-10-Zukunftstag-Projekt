import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { interval } from 'rxjs';
import { moleculeImage, moleculeTransform } from '../../core/models/content';
import { GAME_TITLES, HostSession, Person } from '../../core/models/session';
import {
  buildRecap,
  closestUmfang,
  heightValues,
  histogram,
  median,
  memoryScores,
  memoryVotes,
  recapCsv,
  round1,
  studyDeltas,
  umfangValues,
} from '../../core/models/stats';
import { SessionApi } from '../../core/services/session-api';
import { RocheHeader } from '../../shared/components/roche-header';
import { BarList, BoxPlot, HistogramChart, StripPlot } from '../../shared/components/viz';

@Component({
  selector: 'app-host',
  imports: [RocheHeader, HistogramChart, BarList, BoxPlot, StripPlot],
  templateUrl: './host.html',
  styleUrl: './host.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostPage {
  private readonly api = inject(SessionApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly code = input('');

  protected readonly session = signal<HostSession | null>(null);
  protected readonly error = signal('');
  protected readonly origin = signal('');
  protected readonly titles = GAME_TITLES;
  protected readonly moleculeImage = moleculeImage;
  protected readonly moleculeTransform = moleculeTransform;
  private showTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => {
      this.origin.set(globalThis.location?.origin ?? '');
      interval(1200)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => void this.refresh());
      void this.refresh();
    });
  }

  protected sessionCode(): string {
    return this.code() || this.route.snapshot.paramMap.get('code') || '';
  }

  protected readonly joinUrl = computed(
    () => `${this.origin()}/join/${this.sessionCode()}`,
  );
  protected readonly qrSrc = computed(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=800x800&color=0b41cd&bgcolor=ffffff&data=${encodeURIComponent(this.joinUrl())}`,
  );
  protected readonly heights = computed(() =>
    this.session() ? heightValues(this.session()!) : [],
  );
  protected readonly umfang = computed(() =>
    this.session() ? umfangValues(this.session()!) : [],
  );
  protected readonly heightBins = computed(() => histogram(this.heights(), 5));
  protected readonly heightMedian = computed(() => median(this.heights().map((v) => v.value)));
  protected readonly heightChildMedian = computed(() =>
    median(this.heights().filter((item) => item.role === 'child').map((item) => item.value)),
  );
  protected readonly heightParentMedian = computed(() =>
    median(this.heights().filter((item) => item.role === 'parent').map((item) => item.value)),
  );
  protected readonly heightCompareRows = computed(() => {
    const child = this.heightChildMedian();
    const parent = this.heightParentMedian();
    return [
      ...(child == null ? [] : [{ label: 'Kinder', value: round1(child), tone: 'gold' }]),
      ...(parent == null ? [] : [{ label: 'Eltern', value: round1(parent) }]),
    ];
  });
  protected readonly umfangMedian = computed(() => median(this.umfang().map((v) => v.value)));
  protected readonly winners = computed(() => {
    const session = this.session();
    if (!session) return [];
    return closestUmfang(this.umfang(), session.umfangTruth, 3).map((row) => ({
      ...row,
      delta: round1(Math.abs(row.value - session.umfangTruth)),
    }));
  });
  protected readonly memoryVoteRows = computed(() => {
    const session = this.session();
    if (!session) return [];
    const votes = memoryVotes(session.memory, session.memoryRound);
    return Object.entries(votes).map(([label, value]) => ({ label, value }));
  });
  protected readonly memoryScoreRows = computed(() => {
    const session = this.session();
    if (!session) return [];
    return memoryScores(session).map((row) => ({
      label: `${row.teamName} (${row.correct})`,
      value: row.correct,
      tone: 'gold',
    }));
  });
  protected readonly feedbackRows = computed(() => {
    const feedback = this.session()?.feedback ?? [];
    return [1, 2, 3, 4, 5].map((n) => ({
      label: `${n} Sterne`,
      value: feedback.filter((item) => item.rating === n).length,
      tone: 'gold',
    }));
  });
  protected readonly studyBoxes = computed(() => {
    const session = this.session();
    if (!session) return [];
    return studyDeltas(session.study, session.studyDrugColor);
  });
  protected readonly hasStudyPlot = computed(() =>
    this.studyBoxes().some((box) => box.values.length > 0),
  );
  protected readonly currentRound = computed(() => {
    const session = this.session();
    return session?.memoryRounds[session.memoryRound];
  });
  protected readonly submitted = computed(() => this.submittedCount());
  protected readonly recap = computed(() => {
    const session = this.session();
    return session ? buildRecap(session) : null;
  });

  protected namesOf(teamPeople: Person[]): string {
    return teamPeople.map((person) => person.name).join(', ');
  }

  protected async next(): Promise<void> {
    if (this.session()?.game === 'done') {
      await this.router.navigate(['/host']);
      return;
    }
    await this.patch('next');
  }

  protected async back(): Promise<void> {
    await this.patch('back');
  }

  private hostKey(): string | null {
    try {
      return localStorage.getItem(`zukunftstag-host-${this.sessionCode()}`);
    } catch {
      return null;
    }
  }

  private async patch(action: 'next' | 'back'): Promise<void> {
    const hostKey = this.hostKey();
    if (!hostKey) {
      this.error.set('Kein Moderator-Schlüssel in diesem Browser.');
      return;
    }
    try {
      this.session.set(await this.api.updateHost(this.sessionCode(), hostKey, action));
      this.error.set('');
    } catch {
      this.error.set('Aktion fehlgeschlagen');
    }
  }

  private async refresh(): Promise<void> {
    const hostKey = this.hostKey();
    if (!hostKey) {
      this.error.set('Kein Moderator-Schlüssel. Bitte das Spiel hier starten.');
      return;
    }
    try {
      const session = await this.api.getHost(this.sessionCode(), hostKey);
      this.session.set(session);
      this.scheduleMemoryShow(session);
      this.error.set('');
    } catch {
      this.error.set('Spiel nicht gefunden');
    }
  }

  private scheduleMemoryShow(session: HostSession): void {
    if (this.showTimer) clearTimeout(this.showTimer);
    if (session.game !== 'memory' || session.stage !== 'show') return;
    const round = session.memoryRound;
    this.showTimer = setTimeout(() => {
      const current = this.session();
      if (
        current?.game === 'memory' &&
        current.stage === 'show' &&
        current.memoryRound === round
      ) {
        void this.next();
      }
    }, 6500);
  }

  private submittedCount(): string {
    const session = this.session();
    if (!session) return '0 / 0';
    const total = session.teams.length;
    const counts: Record<string, number> = {
      heights: session.heights.length,
      circumference: session.umfang.length,
      memory: session.memory.filter((item) => item.round === session.memoryRound).length,
      study: session.study.length,
      feedback: session.feedback.length,
    };
    return `${counts[session.game] ?? total} / ${total}`;
  }

  protected fmt(value: number | null): string {
    return value == null ? '–' : String(round1(value));
  }

  protected exportCsv(): void {
    const session = this.session();
    if (!session) return;
    this.download(
      recapCsv(session),
      `zukunftstag-${session.code}-auswertung.csv`,
      'text/csv;charset=utf-8',
    );
  }

  protected exportJson(): void {
    const recap = this.recap();
    if (!recap) return;
    this.download(
      JSON.stringify(recap, null, 2),
      `zukunftstag-${recap.code}-auswertung.json`,
      'application/json',
    );
  }

  private download(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
