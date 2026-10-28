import postgres from 'postgres';
import type { GameSummary } from '../app/core/models/session';
import type { SessionRecord } from './game-store';

const databaseUrl = process.env['DATABASE_URL'] ?? '';
const memory = new Map<string, SessionRecord>();
const queues = new Map<string, Promise<unknown>>();

let sql: ReturnType<typeof postgres> | undefined;
let schemaReady = false;

export async function initDatabase(): Promise<void> {
  if (!databaseUrl || schemaReady) return;
  sql = postgres(databaseUrl, {
    max: 8,
    idle_timeout: 20,
    connect_timeout: 15,
    onnotice: () => undefined,
  });
  await sql`
    CREATE TABLE IF NOT EXISTS games (
      code TEXT PRIMARY KEY,
      host_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      finished_at TIMESTAMPTZ,
      phase TEXT NOT NULL,
      data JSONB NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS games_created_at_idx ON games (created_at DESC)`;
  schemaReady = true;
  console.log('Spiele werden in Postgres gespeichert.');
}

export function serialize<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = queues.get(key) ?? Promise.resolve();
  const current = previous.then(work, work);
  queues.set(
    key,
    current.then(
      () => undefined,
      () => undefined,
    ),
  );
  return current;
}

export async function loadSession(code: string): Promise<SessionRecord | undefined> {
  await initDatabase();
  if (!sql) return memory.get(code);
  const rows = await sql<{ data: SessionRecord }[]>`
    SELECT data FROM games WHERE code = ${code} LIMIT 1
  `;
  return rows[0]?.data;
}

export async function codeExists(code: string): Promise<boolean> {
  await initDatabase();
  if (!sql) return memory.has(code);
  const rows = await sql`SELECT 1 FROM games WHERE code = ${code} LIMIT 1`;
  return rows.length > 0;
}

function toSummary(session: SessionRecord): GameSummary {
  return {
    code: session.code,
    hostKey: session.hostKey,
    createdAt: session.createdAt,
    game: session.game,
    teamCount: session.teams.length,
    finished: session.game === 'done',
  };
}

export async function listGames(): Promise<GameSummary[]> {
  await initDatabase();
  if (!sql) {
    return [...memory.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(toSummary);
  }
  const rows = await sql<{ data: SessionRecord }[]>`
    SELECT data FROM games ORDER BY created_at DESC
  `;
  return rows.map((row) => toSummary(row.data));
}

export async function deleteGame(code: string): Promise<boolean> {
  await initDatabase();
  if (!sql) return memory.delete(code);
  const rows = await sql`
    DELETE FROM games WHERE code = ${code} RETURNING code
  `;
  return rows.length > 0;
}

export async function saveSession(session: SessionRecord): Promise<void> {
  await initDatabase();
  if (!sql) {
    memory.set(session.code, session);
    return;
  }
  const payload = JSON.parse(JSON.stringify(session)) as postgres.JSONValue;
  const finishedAt = session.game === 'done' ? new Date() : null;
  await sql`
    INSERT INTO games (code, host_key, created_at, updated_at, finished_at, phase, data)
    VALUES (
      ${session.code},
      ${session.hostKey},
      ${new Date(session.createdAt)},
      now(),
      ${finishedAt},
      ${session.game},
      ${sql.json(payload)}
    )
    ON CONFLICT (code) DO UPDATE SET
      updated_at = now(),
      finished_at = CASE
        WHEN EXCLUDED.phase = 'done' THEN COALESCE(games.finished_at, now())
        ELSE NULL
      END,
      phase = EXCLUDED.phase,
      data = EXCLUDED.data
  `;
}
