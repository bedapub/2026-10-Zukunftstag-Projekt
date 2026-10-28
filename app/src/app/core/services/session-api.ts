import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ChocolateColor,
  FeedbackAnswer,
  GameSummary,
  HeightsAnswer,
  HostSession,
  MemoryAnswer,
  Person,
  PublicSession,
  StudyAnswer,
  Team,
  UmfangAnswer,
} from '../models/session';

@Injectable({ providedIn: 'root' })
export class SessionApi {
  private readonly http = inject(HttpClient);

  create(
    password: string,
    settings: { umfangTruth: number; studyDrugColor: ChocolateColor },
  ): Promise<HostSession> {
    return firstValueFrom(
      this.http.post<HostSession>('/api/sessions', { password, ...settings }),
    );
  }

  list(password: string): Promise<GameSummary[]> {
    const params = new HttpParams().set('password', password);
    return firstValueFrom(this.http.get<GameSummary[]>('/api/sessions', { params }));
  }

  remove(code: string, password: string): Promise<{ ok: boolean }> {
    const params = new HttpParams().set('password', password);
    return firstValueFrom(
      this.http.delete<{ ok: boolean }>(`/api/sessions/${code}`, { params }),
    );
  }

  get(code: string): Promise<PublicSession> {
    return firstValueFrom(this.http.get<PublicSession>(`/api/sessions/${code}`));
  }

  getHost(code: string, hostKey: string): Promise<HostSession> {
    const params = new HttpParams().set('hostKey', hostKey);
    return firstValueFrom(
      this.http.get<HostSession>(`/api/sessions/${code}/host`, { params }),
    );
  }

  join(
    code: string,
    payload: { teamName: string; people: { role: Person['role']; name: string }[] },
  ): Promise<{ team: Team; session: PublicSession }> {
    return firstValueFrom(
      this.http.post<{ team: Team; session: PublicSession }>(
        `/api/sessions/${code}/join`,
        payload,
      ),
    );
  }

  updateHost(code: string, hostKey: string, action: 'next' | 'back'): Promise<HostSession> {
    return firstValueFrom(
      this.http.patch<HostSession>(`/api/sessions/${code}`, { hostKey, action }),
    );
  }

  submitHeights(code: string, teamId: string, entries: HeightsAnswer['entries']) {
    return firstValueFrom(
      this.http.post<PublicSession>(`/api/sessions/${code}/heights`, { teamId, entries }),
    );
  }

  submitUmfang(code: string, teamId: string, entries: UmfangAnswer['entries']) {
    return firstValueFrom(
      this.http.post<PublicSession>(`/api/sessions/${code}/umfang`, { teamId, entries }),
    );
  }

  submitMemory(code: string, teamId: string, round: number, choice: MemoryAnswer['choice']) {
    return firstValueFrom(
      this.http.post<PublicSession>(`/api/sessions/${code}/memory`, {
        teamId,
        round,
        choice,
      }),
    );
  }

  submitStudy(code: string, teamId: string, entries: StudyAnswer['entries']) {
    return firstValueFrom(
      this.http.post<PublicSession>(`/api/sessions/${code}/study`, { teamId, entries }),
    );
  }

  submitFeedback(code: string, teamId: string, rating: number, comment: string) {
    return firstValueFrom(
      this.http.post<FeedbackAnswer & PublicSession>(`/api/sessions/${code}/feedback`, {
        teamId,
        rating,
        comment,
      }),
    );
  }
}
