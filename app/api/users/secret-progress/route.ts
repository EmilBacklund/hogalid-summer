import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import type { SecretFlags } from '@/types';
import { secretProgressSchema } from '@/schemas';

export const runtime = 'nodejs';

/** Merge easter-egg / secret-progress flags for the acting user. */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { patch } = await parseBody(req, secretProgressSchema);

    const db = getDb();
    await initDb(db);
    const existing = await db.execute({
      sql: 'SELECT secret_flags FROM users WHERE alias = ?',
      args: [session.alias],
    });
    const row = existing.rows[0];
    if (!row) throw new ApiError('not_found', 404);

    let current: SecretFlags = {};
    try {
      current = JSON.parse(String(row.secret_flags ?? '{}')) as SecretFlags;
    } catch {
      current = {};
    }
    const next: SecretFlags = { ...current };
    if (patch.foundAdultBingo) next.foundAdultBingo = true;
    if (patch.foundPenaltyGame) next.foundPenaltyGame = true;
    if (typeof patch.penaltyBest === 'number') {
      next.penaltyBest = Math.max(Number(current.penaltyBest ?? 0), patch.penaltyBest);
    }

    await db.execute({
      sql: 'UPDATE users SET secret_flags = ? WHERE alias = ?',
      args: [JSON.stringify(next), session.alias],
    });
    return json({ ok: true, secretFlags: next });
  });
}
