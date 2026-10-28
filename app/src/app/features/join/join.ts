import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ROCHE_TEAMS } from '../../core/models/content';
import { PersonRole } from '../../core/models/session';
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
  readonly code = input('');

  protected readonly teams = ROCHE_TEAMS;
  protected readonly pin = signal('');
  protected readonly teamName = signal('');
  protected readonly parents = signal<NameRow[]>([{ id: 1, value: '' }]);
  protected readonly children = signal<NameRow[]>([{ id: 1, value: '' }]);
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  private nextId = 2;

  protected readonly resolvedCode = computed(() => this.code() || this.pin());

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

  protected async submit(): Promise<void> {
    const code = this.resolvedCode().replace(/\s/g, '');
    if (!code) {
      this.error.set('PIN fehlt');
      return;
    }
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
      });
      writeLocal(`zukunftstag-team-${code}`, result.team.id);
      await this.router.navigate(['/play', code]);
    } catch (error) {
      this.error.set(
        error instanceof HttpErrorResponse
          ? error.error?.message || 'Beitritt fehlgeschlagen'
          : 'Beitritt fehlgeschlagen',
      );
    } finally {
      this.busy.set(false);
    }
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}
