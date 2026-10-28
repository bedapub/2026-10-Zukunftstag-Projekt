import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SessionApi } from '../../core/services/session-api';
import { RocheHeader } from '../../shared/components/roche-header';

@Component({
  selector: 'app-home',
  imports: [RocheHeader],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly api = inject(SessionApi);
  private readonly router = inject(Router);
  protected readonly pin = signal('');
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  protected async join(): Promise<void> {
    const code = this.pin().replace(/\s/g, '');
    if (code.length < 4) {
      this.error.set('Bitte PIN eingeben');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.get(code);
      let teamId = '';
      try {
        teamId = localStorage.getItem(`zukunftstag-team-${code}`) ?? '';
      } catch {
        teamId = '';
      }
      await this.router.navigate(teamId ? ['/play', code] : ['/join', code]);
    } catch {
      this.error.set('Kein Spiel mit diesem PIN');
    } finally {
      this.busy.set(false);
    }
  }

  protected goHost(): void {
    void this.router.navigate(['/host']);
  }
}
