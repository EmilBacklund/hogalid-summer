import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireLeader, requireUser } from '@/server/responses';
import { teamMessageSchema } from '@/schemas';

export const runtime = 'nodejs';

const MAX_MESSAGES = 50;

interface TeamMessageRow {
  id: number;
  alias: string;
  authorName: string;
  body: string;
  createdAt: string;
}

/**
 * Leader/admin announcements that surface in the team feed ("lagflödet").
 * Reading is open to any signed-in user; only moderators (admin + leaders) may
 * post or delete. The poster's display name is resolved from the users table.
 */
export function GET(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const db = getDb();
    await initDb(db);
    const result = await db.execute({
      sql: `SELECT m.id, m.alias, m.body, m.created_at, u.display_name, u.display_alias
            FROM team_messages m
            LEFT JOIN users u ON u.alias = m.alias
            ORDER BY m.created_at DESC
            LIMIT ?`,
      args: [MAX_MESSAGES],
    });
    const messages: TeamMessageRow[] = result.rows.map((r) => ({
      id: Number(r.id),
      alias: String(r.alias),
      authorName: String(r.display_name || r.display_alias || r.alias),
      body: String(r.body),
      createdAt: String(r.created_at),
    }));
    return json({ messages });
  });
}

/** Post a short announcement. Moderators only (SEC C1 — author is the cookie). */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireLeader(req);
    const { body } = await parseBody(req, teamMessageSchema);

    const db = getDb();
    await initDb(db);
    const createdAt = new Date().toISOString();
    const insert = await db.execute({
      sql: 'INSERT INTO team_messages (alias, body, created_at) VALUES (?, ?, ?)',
      args: [session.alias, body, createdAt],
    });
    const id = Number(insert.lastInsertRowid);
    return json({ ok: true, message: { id, alias: session.alias, body, createdAt } }, 201);
  });
}

/** Remove an announcement by id. Moderators only. */
export function DELETE(req: Request) {
  return handle(async () => {
    await requireLeader(req);
    const id = Number(new URL(req.url).searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) throw new ApiError('invalid_id', 400);

    const db = getDb();
    await initDb(db);
    await db.execute({ sql: 'DELETE FROM team_messages WHERE id = ?', args: [id] });
    return json({ ok: true });
  });
}
