import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { buddyCancelSchema } from '@/schemas';

export const runtime = 'nodejs';

/** The sender cancels their own pending challenge (only the `from_alias`). */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { challengeId } = await parseBody(req, buddyCancelSchema);

    const db = getDb();
    await initDb(db);
    const result = await db.execute({
      sql: `UPDATE buddy_challenges SET status = 'cancelled'
            WHERE id = ? AND status = 'pending' AND from_alias = ?`,
      args: [challengeId, session.alias],
    });
    if (Number(result.rowsAffected) === 0) throw new ApiError('not_found', 404);
    return json({ ok: true });
  });
}
