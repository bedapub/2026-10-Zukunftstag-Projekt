import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ChocolateColor, GAME_TITLES, GameSummary } from '../../core/models/session';
import { SessionApi } from '../../core/services/session-api';
import { RocheHeader } from '../../shared/components/roche-header';

const PASSWORD_KEY = 'zukunftstag-moderator-password';

@Component({
  selector: 'app-host-overview',
  imports: [RocheHeader],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostOverviewPage {
  private readonly api = inject(SessionApi);
  private readonly router = inject(Router);
  protected readonly titles = GAME_TITLES;
  protected readonly password = signal(readPassword());
  protected readonly unlocked = signal(false);
  protected readonly games = signal<GameSummary[]>([]);
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly umfangTruth = signal(28);
  protected readonly studyDrugColor = signal<ChocolateColor>('black');

  constructor() {
    if (this.password()) void this.login();
  }

  protected logout(): void {
    writePassword('');
    this.password.set('');
    this.unlocked.set(false);
    this.games.set([]);
  }

  protected async startGame(): Promise<void> {
    const umfangTruth = Number(this.umfangTruth());
    if (!umfangTruth || umfangTruth <= 0) {
      this.error.set('Bitte Zimmerumfang eingeben');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const session = await this.api.create(this.password(), {
        umfangTruth,
        studyDrugColor: this.studyDrugColor(),
      });
      this.rememberHost(session.code, session.hostKey);
      await this.router.navigate(['/host', session.code]);
    } catch (error) {
      this.error.set(this.message(error, 'Spiel konnte nicht gestartet werden'));
    } finally {
      this.busy.set(false);
    }
  }

  protected openGame(game: GameSummary): void {
    this.rememberHost(game.code, game.hostKey);
    void this.router.navigate(['/host', game.code]);
  }

  protected async deleteGame(game: GameSummary): Promise<void> {
    if (!globalThis.confirm(`Spiel ${game.code} wirklich löschen?`)) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.remove(game.code, this.password());
      removeLocal(`zukunftstag-host-${game.code}`);
      this.games.update((games) => games.filter((item) => item.code !== game.code));
    } catch (error) {
      this.error.set(this.message(error, 'Spiel konnte nicht gelöscht werden'));
    } finally {
      this.busy.set(false);
    }
  }

  protected when(value: number): string {
    return new Date(value).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected async login(): Promise<void> {
    const password = this.password().trim();
    if (!password) {
      this.error.set('Bitte Passwort eingeben');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const games = await this.api.list(password);
      writePassword(password);
      this.unlocked.set(true);
      this.games.set(games);
    } catch (error) {
      writePassword('');
      this.unlocked.set(false);
      this.error.set(this.message(error, 'Anmeldung fehlgeschlagen'));
    } finally {
      this.busy.set(false);
    }
  }

  private rememberHost(code: string, hostKey: string): void {
    writeLocal(`zukunftstag-host-${code}`, hostKey);
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse
      ? error.error?.message || fallback
      : fallback;
  }
}

function readPassword(): string {
  try {
    return sessionStorage.getItem(PASSWORD_KEY) ?? '';
  } catch {
    return '';
  }
}

function writePassword(value: string): void {
  try {
    if (value) sessionStorage.setItem(PASSWORD_KEY, value);
    else sessionStorage.removeItem(PASSWORD_KEY);
  } catch {
    return;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function removeLocal(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
}
