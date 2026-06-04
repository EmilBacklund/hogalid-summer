import type { Client, Row } from '@libsql/client';
import type { AvatarConfig, ExerciseEntry, Log, SecretFlags, User } from '@/types';

/**
 * Shared read helpers that map DB rows onto the domain types. Used by the auth
 * and users handlers so user hydration lives in one place.
 */

function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return JSON.parse(String(value ?? '')) as T;
  } catch {
    return fallback;
  }
}

function rowToUserBase(
  row: Row,
): Omit<
  User,
  'logs' | 'bingo' | 'bonusBingo' | 'bingoTwo' | 'adultBingo' | 'completedDaily' | 'photoCount'
> {
  return {
    alias: String(row.alias),
    role: row.role === 'leader' ? 'leader' : 'player',
    displayAlias: String(row.display_alias || row.alias),
    displayName: String(row.display_name || ''),
    avatarConfig: parseJson<AvatarConfig>(row.avatar_config, {}),
    unlockedItems: parseJson<string[]>(row.unlocked_items, []),
    highscores: parseJson<Record<string, number>>(row.highscores, {}),
    secretFlags: parseJson<SecretFlags>(row.secret_flags, {}),
    joinedAt: row.joined_at ? String(row.joined_at) : null,
  };
}

export async function getLogs(db: Client, alias: string): Promise<Log[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM logs WHERE alias = ? ORDER BY date ASC',
    args: [alias],
  });
  return result.rows.map((row) => ({
    id: Number(row.id),
    date: String(row.date),
    exercises: parseJson<ExerciseEntry[]>(row.exercises, []),
    points: Number(row.points),
    minutes: Number(row.minutes),
    bingo: Number(row.bingo) === 1,
    bingoFootball: Number(row.bingo_football) === 1,
    dailyChallenge: Number(row.daily_challenge) === 1,
    iceCream: Number(row.ice_cream || 0),
    swim: Number(row.swim || 0),
    pages: Number(row.pages || 0),
    title: String(row.title || ''),
    createdAt: String(row.created_at || ''),
  }));
}

async function getBoard(db: Client, table: string, alias: string): Promise<string[]> {
  const result = await db.execute({
    sql: `SELECT challenge_id FROM ${table} WHERE alias = ?`,
    args: [alias],
  });
  return result.rows.map((r) => String(r.challenge_id));
}

export async function getCompletedDaily(
  db: Client,
  alias: string,
): Promise<Record<string, string>> {
  const result = await db.execute({
    sql: 'SELECT date, challenge_id FROM completed_daily WHERE alias = ?',
    args: [alias],
  });
  const out: Record<string, string> = {};
  for (const r of result.rows) out[String(r.date)] = String(r.challenge_id);
  return out;
}

export async function getPhotoCount(db: Client, alias: string): Promise<number> {
  // Only approved photos count toward the public stat; pending uploads are not
  // yet visible to the team.
  const result = await db.execute({
    sql: "SELECT COUNT(*) AS count FROM album_photos WHERE alias = ? AND status = 'approved'",
    args: [alias],
  });
  return Number(result.rows[0]?.count ?? 0);
}

async function hydrate(db: Client, base: ReturnType<typeof rowToUserBase>): Promise<User> {
  const alias = base.alias.toLowerCase();
  const [logs, bingo, bonusBingo, bingoTwo, adultBingo, completedDaily, photoCount] =
    await Promise.all([
      getLogs(db, alias),
      getBoard(db, 'bingo', alias),
      getBoard(db, 'bonus_bingo', alias),
      getBoard(db, 'bingo_two', alias),
      getBoard(db, 'adult_bingo', alias),
      getCompletedDaily(db, alias),
      getPhotoCount(db, alias),
    ]);
  return { ...base, logs, bingo, bonusBingo, bingoTwo, adultBingo, completedDaily, photoCount };
}

/** Load one fully-hydrated user, or null if the alias does not exist. */
export async function loadUser(db: Client, alias: string): Promise<User | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE alias = ?',
    args: [alias.toLowerCase()],
  });
  const row = result.rows[0];
  if (!row) return null;
  return hydrate(db, rowToUserBase(row));
}

/** Load every user, fully hydrated. Never includes any password material. */
export async function loadAllUsers(db: Client): Promise<User[]> {
  const result = await db.execute('SELECT * FROM users');
  return Promise.all(result.rows.map((row) => hydrate(db, rowToUserBase(row))));
}
