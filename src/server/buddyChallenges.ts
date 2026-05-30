import type { Client, Row } from '@libsql/client';
import type { ExerciseEntry } from '@/types';

export interface BuddyChallengeClient {
  id: string;
  fromAlias: string;
  toAlias: string;
  exerciseId: string;
  amount: number;
  status: string;
  createdAt: string;
  acceptedAt: string | null;
  fromCompletedAt: string | null;
  toCompletedAt: string | null;
  fromProgress: number;
  toProgress: number;
}

export function rowToChallenge(r: Row): BuddyChallengeClient {
  return {
    id: String(r.id),
    fromAlias: String(r.from_alias),
    toAlias: String(r.to_alias),
    exerciseId: String(r.exercise_id),
    amount: Number(r.amount),
    status: String(r.status),
    createdAt: String(r.created_at),
    acceptedAt: r.accepted_at ? String(r.accepted_at) : null,
    fromCompletedAt: r.from_completed_at ? String(r.from_completed_at) : null,
    toCompletedAt: r.to_completed_at ? String(r.to_completed_at) : null,
    fromProgress: Number(r.from_progress ?? 0),
    toProgress: Number(r.to_progress ?? 0),
  };
}

/** Snapshot today's logged total for an exercise — the accept-time baseline. */
export async function snapshotBaseline(
  db: Client,
  alias: string,
  exerciseId: string,
  date: string,
): Promise<number> {
  const logs = await db.execute({
    sql: `SELECT exercises FROM logs
          WHERE alias = ? AND date = ?
            AND bingo = 0 AND daily_challenge = 0
            AND title NOT LIKE '🤝buddy:%'`,
    args: [alias, date],
  });
  let total = 0;
  for (const lr of logs.rows) {
    const exArr = JSON.parse(String(lr.exercises ?? '[]')) as ExerciseEntry[];
    const found = exArr.find((e) => e.id === exerciseId);
    if (found) total += found.value || 0;
  }
  return total;
}
