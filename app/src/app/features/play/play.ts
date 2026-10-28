import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { interval } from 'rxjs';
import { moleculeImage, moleculeTransform } from '../../core/models/content';
import {
  ChocolateColor,
  MemoryChoice,
  PublicSession,
  Team,
} from '../../core/models/session';
import { SessionApi } from '../../core/services/session-api';
import { RocheHeader } from '../../shared/components/roche-header';

@Component({
  selector: 'app-play',
  imports: [RocheHeader],
  templateUrl: './play.html',
  styleUrl: './play.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayPage {
  private readonly api = inject(SessionApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly code = input('');

  protected readonly session = signal<PublicSession | null>(null);
  protected readonly teamId = signal('');
  protected readonly error = signal('');
  protected readonly saved = signal(false);
  protected readonly heights = signal<Record<string, number>>({});
  protected readonly guesses = signal<Record<string, number>>({});
  protected readonly study = signal<
    Record<string, { color?: ChocolateColor; before?: number; after?: number }>
  >({});
  protected readonly rating = signal(0);
  protected readonly comment = signal('');
  protected readonly stars = [1, 2, 3, 4, 5] as const;
  protected readonly painScale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
  protected readonly moleculeImage = moleculeImage;
  protected readonly moleculeTransform = moleculeTransform;
  private lastPayload = '';
  private lastPhase = '';

  constructor() {
    afterNextRender(() => {
      interval(1200)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => void this.refresh());
      void this.refresh(true);
    });
  }

  private sessionCode(): string {
    return this.code() || this.route.snapshot.paramMap.get('code') || '';
  }

  protected readonly team = computed<Team | null>(() => {
    const session = this.session();
    return session?.teams.find((item) => item.id === this.teamId()) ?? null;
  });
  protected readonly round = computed(
    () => this.session()?.memoryRounds[this.session()?.memoryRound ?? 0],
  );
  protected readonly myMemory = computed(() => {
    const session = this.session();
    const teamId = this.teamId();
    if (!session) return null;
    return (
      session.memory.find(
        (item) => item.teamId === teamId && item.round === session.memoryRound,
      ) ?? null
    );
  });

  protected setHeight(id: string, value: string): void {
    const cm = Number(value);
    if (Number.isNaN(cm)) return;
    this.heights.update((map) => ({ ...map, [id]: cm }));
  }

  protected setGuess(id: string, value: string): void {
    const meters = Number(value);
    if (Number.isNaN(meters)) return;
    this.guesses.update((map) => ({ ...map, [id]: meters }));
  }

  protected pickRating(value: number): void {
    this.rating.set(value);
    this.saved.set(false);
    this.error.set('');
  }

  protected goHome(): void {
    void this.router.navigate(['/']);
  }

  protected setStudy(
    id: string,
    patch: Partial<{ color: ChocolateColor; before: number; after: number }>,
  ): void {
    this.study.update((map) => ({
      ...map,
      [id]: {
        ...map[id],
        ...patch,
      },
    }));
  }

  protected async sendHeights(): Promise<void> {
    const people = this.team()?.people ?? [];
    await this.save(() =>
      this.api.submitHeights(
        this.sessionCode(),
        this.teamId(),
        people.map((person) => ({
          personId: person.id,
          cm: this.heights()[person.id],
        })),
      ),
    );
  }

  protected async sendUmfang(): Promise<void> {
    const people = this.team()?.people ?? [];
    await this.save(() =>
      this.api.submitUmfang(
        this.sessionCode(),
        this.teamId(),
        people.map((person) => ({
          personId: person.id,
          meters: this.guesses()[person.id],
        })),
      ),
    );
  }

  protected async sendMemory(choice: MemoryChoice): Promise<void> {
    const session = this.session();
    if (!session) return;
    await this.save(() =>
      this.api.submitMemory(this.sessionCode(), this.teamId(), session.memoryRound, choice),
    );
  }

  protected async sendStudy(): Promise<void> {
    const people = this.team()?.people ?? [];
    const entries = people.map((person) => this.study()[person.id]);
    if (
      entries.some(
        (entry) =>
          !entry?.color ||
          entry.before == null ||
          Number.isNaN(entry.before) ||
          entry.after == null ||
          Number.isNaN(entry.after),
      )
    ) {
      this.error.set('Bitte für jede Person Schokolade und Schmerz vorher/nachher angeben');
      return;
    }
    await this.save(() =>
      this.api.submitStudy(
        this.sessionCode(),
        this.teamId(),
        people.map((person) => {
          const entry = this.study()[person.id]!;
          return {
            personId: person.id,
            color: entry.color!,
            before: entry.before!,
            after: entry.after!,
          };
        }),
      ),
    );
  }

  protected async sendFeedback(): Promise<void> {
    if (!this.rating()) {
      this.error.set('Bitte eine Bewertung wählen');
      return;
    }
    await this.save(() =>
      this.api.submitFeedback(
        this.sessionCode(),
        this.teamId(),
        this.rating(),
        this.comment(),
      ),
    );
  }

  private async save(task: () => Promise<unknown>): Promise<void> {
    this.error.set('');
    try {
      await task();
      this.saved.set(true);
      this.lastPayload = '';
    } catch (error) {
      this.saved.set(false);
      this.error.set(
        error instanceof HttpErrorResponse
          ? error.error?.message || 'Senden fehlgeschlagen'
          : 'Senden fehlgeschlagen',
      );
    }
  }

  private async refresh(init = false): Promise<void> {
    try {
      const session = await this.api.get(this.sessionCode());
      const teamId = this.readTeamId();
      const payload = JSON.stringify({
        game: session.game,
        stage: session.stage,
        memoryRound: session.memoryRound,
        teams: session.teams,
        heights: session.heights,
        umfang: session.umfang,
        memory: session.memory,
        study: session.study,
        feedback: session.feedback,
      });
      const phase = `${session.game}:${session.stage}:${session.memoryRound}`;
      if (!init && payload === this.lastPayload) return;
      this.lastPayload = payload;
      this.teamId.set(teamId);
      this.session.set(session);
      if (this.lastPhase && this.lastPhase !== phase) this.saved.set(false);
      this.lastPhase = phase;
      if (init) this.hydrate(session, teamId);
      this.error.set('');
    } catch {
      this.error.set('Spiel nicht gefunden');
    }
  }

  private readTeamId(): string {
    try {
      return localStorage.getItem(`zukunftstag-team-${this.sessionCode()}`) ?? '';
    } catch {
      return '';
    }
  }

  private hydrate(session: PublicSession, teamId: string): void {
    const team = session.teams.find((item) => item.id === teamId);
    if (!team) return;
    const height = session.heights.find((item) => item.teamId === teamId);
    if (height) {
      this.heights.set(
        Object.fromEntries(height.entries.map((entry) => [entry.personId, entry.cm])),
      );
    }
    const umfang = session.umfang.find((item) => item.teamId === teamId);
    if (umfang) {
      this.guesses.set(
        Object.fromEntries(umfang.entries.map((entry) => [entry.personId, entry.meters])),
      );
    }
    const study = session.study.find((item) => item.teamId === teamId);
    if (study) {
      this.study.set(
        Object.fromEntries(
          study.entries.map((entry) => [
            entry.personId,
            { color: entry.color, before: entry.before, after: entry.after },
          ]),
        ),
      );
    }
    const feedback = session.feedback.find((item) => item.teamId === teamId);
    if (feedback) {
      this.rating.set(feedback.rating);
      this.comment.set(feedback.comment);
    }
  }
}
