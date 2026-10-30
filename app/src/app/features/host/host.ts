import { NgTemplateOutlet } from '@angular/common';
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
import { chartsForGame, recapChartGroups } from '../../core/models/charts';
import { GAME_TITLES, HostSession, Person } from '../../core/models/session';
import { buildRecap, recapCsv } from '../../core/models/stats';
import { SessionApi } from '../../core/services/session-api';
import { RocheHeader } from '../../shared/components/roche-header';
import { PlotlyChart } from '../../shared/components/plotly-chart';

@Component({
  selector: 'app-host',
  imports: [RocheHeader, PlotlyChart, NgTemplateOutlet],
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
  protected readonly charts = computed(() => {
    const session = this.session();
    return session ? chartsForGame(session) : [];
  });
  protected readonly recapGroups = computed(() => {
    const session = this.session();
    return session?.game === 'done' ? recapChartGroups(session) : [];
  });
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
