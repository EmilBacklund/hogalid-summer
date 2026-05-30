import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { snapshotBaseline } from '@/server/buddyChallenges';
import { buddyRespondSchema } from '@/schemas';

export const runtime = 'nodejs';

/**
 * The recipient accepts or declines a pending challenge. Only the `to_alias`
 * (derived from the session) may respond (SEC C1). Accepting snapshots each
 * partner's current total so only reps logged afterward count toward progress.
 */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { challengeId, response } = await parseBody(req, buddyRespondSchema);

    const db = getDb();
    await initDb(db);
    const row = await db.execute({
      sql: 'SELECT from_alias, to_alias, exercise_id FROM buddy_challenges WHERE id = ? AND status = ?',
      args: [challengeId, 'pending'],
    });
    const challenge = row.rows[0];
    if (!challenge) throw new ApiError('not_found', 404);
    if (String(challenge.to_alias) !== session.alias) throw new ApiError('forbidden', 403);

    if (response === 'decline') {
      await db.execute({
        sql: `UPDATE buddy_challenges SET status = 'declined' WHERE id = ? AND status = 'pending'`,
        args: [challengeId],
      });
      return json({ ok: true });
    }

    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const exerciseId = String(challenge.exercise_id);
    const fromBaseline = await snapshotBaseline(
      db,
      String(challenge.from_alias),
      exerciseId,
      today,
    );
    const toBaseline = await snapshotBaseline(db, String(challenge.to_alias), exerciseId, today);

    await db.execute({
      sql: `UPDATE buddy_challenges
            SET status = 'active', accepted_at = ?, from_baseline = ?, to_baseline = ?
            WHERE id = ? AND status = 'pending'`,
      args: [now, fromBaseline, toBaseline, challengeId],
    });
    return json({ ok: true });
  });
}
