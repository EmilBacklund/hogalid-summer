import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { reactionInputSchema } from '@/schemas';

export const runtime = 'nodejs';

/** All feed reactions, grouped as { eventKey: { alias: emoji } }. */
export function GET(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const db = getDb();
    await initDb(db);
    const result = await db.execute('SELECT event_key, alias, emoji FROM feed_reactions');
    const data: Record<string, Record<string, string>> = {};
    for (const r of result.rows) {
      const key = String(r.event_key);
      (data[key] ??= {})[String(r.alias)] = String(r.emoji);
    }
    return json(data);
  });
}

/** Add or remove the acting user's reaction (alias from cookie, not body). */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { eventKey, emoji } = await parseBody(req, reactionInputSchema);

    const db = getDb();
    await initDb(db);
    if (!emoji) {
      await db.execute({
        sql: 'DELETE FROM feed_reactions WHERE event_key = ? AND alias = ?',
        args: [eventKey, session.alias],
      });
    } else {
      await db.execute({
        sql: 'INSERT OR REPLACE INTO feed_reactions (event_key, alias, emoji) VALUES (?, ?, ?)',
        args: [eventKey, session.alias, emoji],
      });
    }
    return json({ ok: true });
  });
}
