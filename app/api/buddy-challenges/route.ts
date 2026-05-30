import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { rowToChallenge } from '@/server/buddyChallenges';
import { EXERCISES } from '@/constants';
import { buddyCreateSchema } from '@/schemas';

export const runtime = 'nodejs';

const EXERCISE_IDS = new Set(EXERCISES.map((e) => e.id));

/** All buddy challenges involving the acting user; expires stale active ones. */
export function GET(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    const db = getDb();
    await initDb(db);

    // Active challenges older than 48h with one side unfinished are failed.
    const expireThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await db.execute({
      sql: `UPDATE buddy_challenges SET status = 'failed'
            WHERE status = 'active' AND accepted_at < ?
              AND (from_completed_at IS NULL OR to_completed_at IS NULL)`,
      args: [expireThreshold],
    });

    const result = await db.execute({
      sql: `SELECT * FROM buddy_challenges
            WHERE from_alias = ? OR to_alias = ?
            ORDER BY created_at DESC`,
      args: [session.alias, session.alias],
    });
    return json(result.rows.map(rowToChallenge));
  });
}

/** Create a pending challenge from the acting user to another player. */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { toAlias, exerciseId, amount } = await parseBody(req, buddyCreateSchema);
    const from = session.alias;
    const to = toAlias.toLowerCase();

    if (to === from) throw new ApiError('invalid_target', 400);
    if (!EXERCISE_IDS.has(exerciseId)) throw new ApiError('unknown_exercise', 400);

    const db = getDb();
    await initDb(db);

    const toExists = await db.execute({
      sql: 'SELECT alias FROM users WHERE alias = ?',
      args: [to],
    });
    if (toExists.rows.length === 0) throw new ApiError('user_not_found', 404);

    const countFor = async (alias: string): Promise<number> => {
      const r = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM buddy_challenges
              WHERE (from_alias = ? OR to_alias = ?) AND status IN ('pending','active')`,
        args: [alias, alias],
      });
      return Number(r.rows[0]?.cnt ?? 0);
    };
    if ((await countFor(from)) >= 3) throw new ApiError('too_many_own', 400);
    if ((await countFor(to)) >= 3) throw new ApiError('too_many_target', 400);

    const pair = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM buddy_challenges
            WHERE ((from_alias = ? AND to_alias = ?) OR (from_alias = ? AND to_alias = ?))
              AND status IN ('pending','active')`,
      args: [from, to, to, from],
    });
    if (Number(pair.rows[0]?.cnt ?? 0) > 0) throw new ApiError('pair_exists', 400);

    const id = `bc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.execute({
      sql: `INSERT INTO buddy_challenges
            (id, from_alias, to_alias, exercise_id, amount, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      args: [id, from, to, exerciseId, amount, new Date().toISOString()],
    });
    return json({ ok: true, id });
  });
}
