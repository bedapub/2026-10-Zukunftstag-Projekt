import { Injectable, computed, signal } from '@angular/core';
import { GameId, GameLang } from '../models/session';
import { Lang, MESSAGES, Messages } from './messages';

@Injectable({ providedIn: 'root' })
export class I18n {
  /** Active game language (set by the host when creating the session). */
  private readonly active = signal<Lang>('de');

  readonly lang = this.active.asReadonly();

  readonly m = computed<Messages>(() => MESSAGES[this.active()]);

  readonly de = MESSAGES.de;
  readonly en = MESSAGES.en;

  /** Use the language configured for the current game. */
  useGameLang(lang: GameLang | string | null | undefined): void {
    const next: Lang = lang === 'en' ? 'en' : 'de';
    this.active.set(next);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
  }

  gameTitle(game: GameId): string {
    return this.m().game[game];
  }

  /** Bilingual label for pre-game screens: "Deutsch / English". */
  both(key: keyof Messages): string {
    const de = this.de[key];
    const en = this.en[key];
    if (typeof de !== 'string' || typeof en !== 'string') return String(de);
    return de === en ? de : `${de} / ${en}`;
  }
}
