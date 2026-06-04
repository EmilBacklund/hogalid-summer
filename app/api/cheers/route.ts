import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { cheerInputSchema, cheerSeenInputSchema } from '@/schemas';

export const runtime = 'nodejs';

/** Unseen cheers addressed to the acting user. */
export function GET(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    const db = getDb();
    await initDb(db);
    const result = await db.execute({
      sql: 'SELECT id, from_alias, created_at FROM cheers WHERE to_alias = ? AND seen = 0 ORDER BY created_at DESC',
      args: [session.alias],
    });
    return json(
      result.rows.map((r) => ({
        id: Number(r.id),
        fromAlias: String(r.from_alias),
        createdAt: String(r.created_at),
      })),
    );
  });
}

/** Send a cheer. Sender is the cookie identity (SEC C1); max one per pair/day. */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { toAlias } = await parseBody(req, cheerInputSchema);
    const to = toAlias.toLowerCase();
    if (to === session.alias) throw new ApiError('invalid_target', 400);

    const db = getDb();
    await initDb(db);
    const today = new Date().toISOString().slice(0, 10);
    const existing = await db.execute({
      sql: 'SELECT id FROM cheers WHERE from_alias = ? AND to_alias = ? AND created_at LIKE ?',
      args: [session.alias, to, `${today}%`],
    });
    if (existing.rows.length > 0) throw new ApiError('already_cheered_today', 429);

    await db.execute({
      sql: 'INSERT INTO cheers (from_alias, to_alias, created_at) VALUES (?, ?, ?)',
      args: [session.alias, to, new Date().toISOString()],
    });
    return json({ ok: true });
  });
}

/** Mark the acting user's own received cheers as seen. */
export function PUT(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    const { ids } = await parseBody(req, cheerSeenInputSchema);
    if (ids.length === 0) return json({ ok: true });

    const db = getDb();
    await initDb(db);
    const placeholders = ids.map(() => '?').join(',');
    await db.execute({
      sql: `UPDATE cheers SET seen = 1 WHERE to_alias = ? AND id IN (${placeholders})`,
      args: [session.alias, ...ids],
    });
    return json({ ok: true });
  });
}
