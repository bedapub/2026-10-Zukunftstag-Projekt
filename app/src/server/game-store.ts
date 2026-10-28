import { randomInt, randomUUID } from 'node:crypto';
import { MEMORY_LABELS, MEMORY_ROUNDS } from '../app/core/models/content';
import {
  ChocolateColor,
  FeedbackAnswer,
  GAME_ORDER,
  GameId,
  GameStage,
  GameSummary,
  HeightsAnswer,
  HostSession,
  MemoryAnswer,
  MemoryRoundPublic,
  Person,
  PublicSession,
  StudyAnswer,
  Team,
  UmfangAnswer,
} from '../app/core/models/session';
import { codeExists, deleteGame, listGames, loadSession, saveSession, serialize } from './db';

export interface SessionRecord {
  code: string;
  hostKey: string;
  createdAt: number;
  game: GameId;
  stage: GameStage;
  memoryRound: number;
  umfangTruth: number;
  studyUnblinded: boolean;
  studyDrugColor: ChocolateColor;
  memoryRounds: MemoryRoundPublic[];
  teams: Team[];
  heights: HeightsAnswer[];
  umfang: UmfangAnswer[];
  memory: MemoryAnswer[];
  study: StudyAnswer[];
  feedback: FeedbackAnswer[];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function makeCode(): Promise<string> {
  for (let i = 0; i < 20; i += 1) {
    const code = String(randomInt(100000, 1000000));
    if (!(await codeExists(code))) return code;
  }
  throw new Error('Kein PIN frei');
}

function buildMemoryRounds(): MemoryRoundPublic[] {
  return MEMORY_ROUNDS.map((round, index) => {
    const molecules = shuffle([round.correct, ...round.decoys]);
    const options = molecules.map((molecule, optionIndex) => ({
      label: MEMORY_LABELS[optionIndex],
      cid: molecule.cid,
      name: molecule.name,
    }));
    const correct = options.find((option) => option.cid === round.correct.cid);
    return {
      index,
      name: round.name,
      options,
      promptCid: round.correct.cid,
      correctLabel: correct?.label,
    };
  });
}

async function requireSession(code: string): Promise<SessionRecord> {
  const session = await loadSession(code);
  if (!session) {
    throw httpError('Spiel nicht gefunden', 404);
  }
  return session;
}

function requireHost(session: SessionRecord, hostKey: string): void {
  if (session.hostKey !== hostKey) {
    throw httpError('Keine Moderator-Berechtigung', 403);
  }
}

function publicMemoryRounds(session: SessionRecord): MemoryRoundPublic[] {
  const later = session.game === 'study' || session.game === 'feedback' || session.game === 'done';
  const reveal =
    session.game === 'memory' && session.stage === 'results'
      ? session.memoryRound
      : later
        ? Infinity
        : -1;
  return session.memoryRounds.map((round) => ({
    ...round,
    correctLabel: round.index <= reveal ? round.correctLabel : undefined,
    options: round.options.map((option) => ({
      ...option,
      name: round.index <= reveal ? option.name : `Molekül ${option.label}`,
    })),
  }));
}

export function toPublic(session: SessionRecord): PublicSession {
  return {
    code: session.code,
    game: session.game,
    stage: session.stage,
    memoryRound: session.memoryRound,
    umfangTruth: session.umfangTruth,
    studyUnblinded: session.studyUnblinded,
    studyDrugColor: session.studyUnblinded ? session.studyDrugColor : undefined,
    memoryRounds: publicMemoryRounds(session),
    teams: session.teams,
    heights: session.heights,
    umfang: session.umfang,
    memory: session.memory,
    study: session.study,
    feedback: session.feedback,
  };
}

export function toHost(session: SessionRecord): HostSession {
  return {
    ...toPublic(session),
    hostKey: session.hostKey,
    studyDrugColor: session.studyDrugColor,
    studyUnblinded: session.studyUnblinded,
    memoryRounds: session.memoryRounds,
  };
}

const HOST_PASSWORD = process.env['HOST_PASSWORD'] || 'Roche26';

function requirePassword(password: string): void {
  if (password !== HOST_PASSWORD) {
    throw httpError('Falsches Passwort', 401);
  }
}

export async function listSessions(password: string): Promise<GameSummary[]> {
  requirePassword(password);
  return listGames();
}

export async function deleteSession(code: string, password: string): Promise<void> {
  requirePassword(password);
  const removed = await deleteGame(code);
  if (!removed) throw httpError('Spiel nicht gefunden', 404);
}

export async function createSession(
  password: string,
  settings?: { umfangTruth?: number; studyDrugColor?: ChocolateColor },
): Promise<HostSession> {
  requirePassword(password);
  const umfangTruth =
    typeof settings?.umfangTruth === 'number' && settings.umfangTruth > 0
      ? settings.umfangTruth
      : 28;
  const studyDrugColor =
    settings?.studyDrugColor === 'red' || settings?.studyDrugColor === 'black'
      ? settings.studyDrugColor
      : 'black';
  return serialize('__create__', async () => {
    const session: SessionRecord = {
      code: await makeCode(),
      hostKey: randomUUID(),
      createdAt: Date.now(),
      game: 'lobby',
      stage: 'play',
      memoryRound: 0,
      umfangTruth,
      studyUnblinded: false,
      studyDrugColor,
      memoryRounds: buildMemoryRounds(),
      teams: [],
      heights: [],
      umfang: [],
      memory: [],
      study: [],
      feedback: [],
    };
    await saveSession(session);
    return toHost(session);
  });
}

export async function getPublic(code: string): Promise<PublicSession> {
  return toPublic(await requireSession(code));
}

export async function getHost(code: string, hostKey: string): Promise<HostSession> {
  const session = await requireSession(code);
  requireHost(session, hostKey);
  return toHost(session);
}

export async function joinTeam(
  code: string,
  payload: { teamName: string; people: { role: Person['role']; name: string }[] },
): Promise<{ team: Team; session: PublicSession }> {
  return serialize(code, async () => {
    const session = await requireSession(code);
    if (session.game !== 'lobby') {
      throw httpError('Beitritt nur in der Lobby', 409);
    }
    const teamName = payload.teamName.trim();
    if (!teamName) throw badRequest('Teamname fehlt');
    if (session.teams.some((team) => team.name.toLowerCase() === teamName.toLowerCase())) {
      throw badRequest('Dieser Teamname ist schon vergeben');
    }
    const people = payload.people
      .map((person) => ({
        id: randomUUID(),
        role: person.role,
        name: person.name.trim(),
      }))
      .filter((person) => person.name);
    if (!people.length) throw badRequest('Mindestens ein Name');
    if (!people.some((person) => person.role === 'parent')) {
      throw badRequest('Mindestens ein Elternteil');
    }
    if (!people.some((person) => person.role === 'child')) {
      throw badRequest('Mindestens ein Kind');
    }
    if (session.teams.length >= 30) throw badRequest('Maximal 30 Teams');
    const team: Team = {
      id: randomUUID(),
      name: teamName,
      people,
      joinedAt: Date.now(),
    };
    session.teams.push(team);
    session.teams.sort((a, b) => a.name.localeCompare(b.name));
    await saveSession(session);
    return { team, session: toPublic(session) };
  });
}

export async function updateHost(
  code: string,
  hostKey: string,
  action?: 'next' | 'back',
): Promise<HostSession> {
  return serialize(code, async () => {
    const session = await requireSession(code);
    requireHost(session, hostKey);
    if (action === 'next') advance(session);
    else if (action === 'back') rewind(session);
    await saveSession(session);
    return toHost(session);
  });
}

function advance(session: SessionRecord): void {
  if (session.game === 'lobby') {
    session.game = 'heights';
    session.stage = 'play';
    return;
  }
  if (session.stage === 'show') {
    session.stage = 'play';
    return;
  }
  if (session.stage === 'play') {
    if (session.game === 'feedback') {
      session.game = 'done';
      session.stage = 'results';
      return;
    }
    session.stage = 'results';
    if (session.game === 'study') session.studyUnblinded = true;
    return;
  }
  if (session.game === 'memory' && session.memoryRound < MEMORY_ROUNDS.length - 1) {
    session.memoryRound += 1;
    session.stage = 'show';
    return;
  }
  const next = GAME_ORDER[GAME_ORDER.indexOf(session.game) + 1] ?? 'done';
  session.game = next;
  session.stage = next === 'memory' ? 'show' : next === 'done' ? 'results' : 'play';
  if (next === 'memory') session.memoryRound = 0;
}

function rewind(session: SessionRecord): void {
  if (session.game === 'lobby') return;
  if (session.game === 'memory' && session.stage === 'play') {
    session.stage = 'show';
    return;
  }
  if (session.stage === 'results' && session.game !== 'done') {
    session.stage = 'play';
    return;
  }
  if (session.game === 'memory' && session.memoryRound > 0 && session.stage === 'show') {
    session.memoryRound -= 1;
    session.stage = 'results';
    return;
  }
  const prev = GAME_ORDER[Math.max(0, GAME_ORDER.indexOf(session.game) - 1)];
  session.game = prev;
  session.stage =
    prev === 'lobby' || prev === 'feedback' ? 'play' : 'results';
  if (prev === 'memory') session.memoryRound = MEMORY_ROUNDS.length - 1;
  if (prev === 'study') session.studyUnblinded = true;
}

export async function submitHeights(
  code: string,
  teamId: string,
  entries: HeightsAnswer['entries'],
): Promise<PublicSession> {
  return serialize(code, async () => {
    const session = await requireSession(code);
    assertTeam(session, teamId);
    session.heights = upsert(session.heights, { teamId, entries });
    await saveSession(session);
    return toPublic(session);
  });
}

export async function submitUmfang(
  code: string,
  teamId: string,
  entries: UmfangAnswer['entries'],
): Promise<PublicSession> {
  return serialize(code, async () => {
    const session = await requireSession(code);
    assertTeam(session, teamId);
    session.umfang = upsert(session.umfang, { teamId, entries });
    await saveSession(session);
    return toPublic(session);
  });
}

export async function submitMemory(
  code: string,
  teamId: string,
  round: number,
  choice: MemoryAnswer['choice'],
): Promise<PublicSession> {
  return serialize(code, async () => {
    const session = await requireSession(code);
    assertTeam(session, teamId);
    session.memory = session.memory.filter(
      (item) => !(item.teamId === teamId && item.round === round),
    );
    session.memory.push({ teamId, round, choice });
    await saveSession(session);
    return toPublic(session);
  });
}

export async function submitStudy(
  code: string,
  teamId: string,
  entries: StudyAnswer['entries'],
): Promise<PublicSession> {
  return serialize(code, async () => {
    const session = await requireSession(code);
    assertTeam(session, teamId);
    session.study = upsert(session.study, { teamId, entries });
    await saveSession(session);
    return toPublic(session);
  });
}

export async function submitFeedback(
  code: string,
  teamId: string,
  rating: number,
  comment: string,
): Promise<PublicSession> {
  return serialize(code, async () => {
    const session = await requireSession(code);
    assertTeam(session, teamId);
    session.feedback = upsert(session.feedback, { teamId, rating, comment });
    await saveSession(session);
    return toPublic(session);
  });
}

function upsert<T extends { teamId: string }>(list: T[], item: T): T[] {
  return [...list.filter((entry) => entry.teamId !== item.teamId), item];
}

function assertTeam(session: SessionRecord, teamId: string): Team {
  const team = session.teams.find((item) => item.id === teamId);
  if (!team) throw badRequest('Team unbekannt');
  return team;
}

function badRequest(message: string): Error {
  return httpError(message, 400);
}

function httpError(message: string, status: number): Error {
  const error = new Error(message);
  (error as Error & { status: number }).status = status;
  return error;
}
