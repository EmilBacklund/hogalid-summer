import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { dailyChallengePoints, isDailyChallenge } from '@/server/points';
import { stockholmToday } from '@/server/dates';
import { dailyInputSchema } from '@/schemas';

export const runtime = 'nodejs';

/**
 * Complete today's daily challenge. One completion per user per day (enforced by
 * the (alias, date) primary key); the bonus points come authoritatively from
 * constants (SEC H1). Replays award nothing.
 */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { challengeId } = await parseBody(req, dailyInputSchema);
    if (!isDailyChallenge(challengeId)) throw new ApiError('unknown_challenge', 400);

    const db = getDb();
    await initDb(db);
    const today = stockholmToday();

    const inserted = await db.execute({
      sql: 'INSERT OR IGNORE INTO completed_daily (alias, date, challenge_id) VALUES (?, ?, ?)',
      args: [session.alias, today, challengeId],
    });
    if (Number(inserted.rowsAffected) === 0) {
      return json({ ok: true, alreadyDone: true });
    }

    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO logs (alias, date, exercises, points, minutes, bingo, bingo_football, daily_challenge, ice_cream, swim, pages, title, created_at)
            VALUES (?, ?, '[]', ?, 0, 0, 0, 1, 0, 0, 0, '', ?)`,
      args: [session.alias, today, dailyChallengePoints(challengeId), now],
    });

    return json({ ok: true });
  });
}
