import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { I18n } from '../../core/i18n/i18n';
import { ROCHE_TEAMS } from '../../core/models/content';
import { PersonRole, PublicSession, Team } from '../../core/models/session';
import { getDeviceId } from '../../core/services/device-id';
import { SessionApi } from '../../core/services/session-api';
import { RocheHeader } from '../../shared/components/roche-header';

interface NameRow {
  id: number;
  value: string;
}

@Component({
  selector: 'app-join',
  imports: [RocheHeader],
  templateUrl: './join.html',
  styleUrl: './join.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinPage {
  private readonly api = inject(SessionApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly i18n = inject(I18n);
  readonly code = input('');

  protected readonly pin = signal('');
  protected readonly teamName = signal('');
  protected readonly parents = signal<NameRow[]>([{ id: 1, value: '' }]);
  protected readonly children = signal<NameRow[]>([{ id: 1, value: '' }]);
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly session = signal<PublicSession | null>(null);
  protected readonly creatingNew = signal(false);
  private nextId = 2;
  private pollStarted = false;

  protected readonly resolvedCode = computed(() => this.code() || this.pin());
  protected readonly mode = computed<'register' | 'rejoin'>(() => {
    const session = this.session();
    if (!session || session.game === 'lobby' || this.creatingNew()) return 'register';
    return 'rejoin';
  });
  protected readonly freeTeams = computed(() => {
    const session = this.session();
    if (!session) return [] as Team[];
    const occupied = new Set(session.occupiedTeamIds ?? []);
    return session.teams.filter((team) => !occupied.has(team.id));
  });
  protected readonly rocheTeams = computed(() => {
    const en = this.i18n.lang() === 'en';
    return ROCHE_TEAMS.map((team) => ({
      name: team.name,
      indication: en ? team.indicationEn : team.indication,
    }));
  });

  constructor() {
    afterNextRender(() => {
      void this.reloadSession();
    });
    effect(() => {
      const code = this.code();
      if (code) void this.reloadSession();
    });
  }

  protected peopleLabel(team: Team): string {
    return team.people.map((person) => person.name).join(', ');
  }

  protected async reloadSession(): Promise<void> {
    const code = this.resolvedCode().replace(/\s/g, '');
    if (!code) return;
    try {
      const session = await this.api.get(code);
      this.i18n.useGameLang(session.lang);
      this.session.set(session);
      this.error.set('');
      this.ensurePoll();
    } catch {
      this.session.set(null);
    }
  }

  private ensurePoll(): void {
    if (this.pollStarted) return;
    this.pollStarted = true;
    interval(2500)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.mode() === 'rejoin') void this.reloadSession();
      });
  }

  protected add(role: PersonRole): void {
    const row = { id: this.nextId++, value: '' };
    if (role === 'parent') this.parents.update((rows) => [...rows, row]);
    else this.children.update((rows) => [...rows, row]);
  }

  protected remove(role: PersonRole, id: number): void {
    const update = (rows: NameRow[]) =>
      rows.length > 1 ? rows.filter((row) => row.id !== id) : rows;
    if (role === 'parent') this.parents.update(update);
    else this.children.update(update);
  }

  protected setName(role: PersonRole, id: number, value: string): void {
    const update = (rows: NameRow[]) =>
      rows.map((row) => (row.id === id ? { ...row, value } : row));
    if (role === 'parent') this.parents.update(update);
    else this.children.update(update);
  }

  protected startCreateNew(): void {
    this.creatingNew.set(true);
    this.error.set('');
  }

  protected backToRejoin(): void {
    this.creatingNew.set(false);
    this.error.set('');
    void this.reloadSession();
  }

  protected async rejoin(teamId: string): Promise<void> {
    const code = this.resolvedCode().replace(/\s/g, '');
    if (!code) {
      this.error.set(this.i18n.m().joinPinMissing);
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.claimSeat(code, {
        teamId,
        deviceId: getDeviceId(),
      });
      this.i18n.useGameLang(result.session.lang);
      writeLocal(`zukunftstag-team-${code}`, result.team.id);
      await this.router.navigate(['/play', code]);
    } catch (error) {
      this.error.set(this.message(error, this.i18n.m().joinTeamBusy));
      void this.reloadSession();
    } finally {
      this.busy.set(false);
    }
  }

  protected async submit(): Promise<void> {
    const code = this.resolvedCode().replace(/\s/g, '');
    if (!code) {
      this.error.set(this.i18n.m().joinPinMissing);
      return;
    }
    await this.reloadSession();
    if (this.mode() === 'rejoin') return;

    const people = [
      ...this.parents()
        .map((row) => ({ role: 'parent' as const, name: row.value.trim() }))
        .filter((person) => person.name),
      ...this.children()
        .map((row) => ({ role: 'child' as const, name: row.value.trim() }))
        .filter((person) => person.name),
    ];
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.join(code, {
        teamName: this.teamName(),
        people,
        deviceId: getDeviceId(),
      });
      this.i18n.useGameLang(result.session.lang);
      this.creatingNew.set(false);
      writeLocal(`zukunftstag-team-${code}`, result.team.id);
      await this.router.navigate(['/play', code]);
    } catch (error) {
      this.error.set(this.message(error, this.i18n.m().joinFailed));
      void this.reloadSession();
    } finally {
      this.busy.set(false);
    }
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse
      ? error.error?.message || fallback
      : fallback;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}
