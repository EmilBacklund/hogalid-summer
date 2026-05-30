import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireAdmin } from '@/server/responses';
import { generateUniqueInvite, hydrateInviteDisplay, inviteRowToClient } from '@/server/invites';
import { inviteCreateSchema, inviteUpdateSchema } from '@/schemas';

export const runtime = 'nodejs';

/** Admin: list every invite, newest first. */
export function GET(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const db = getDb();
    await initDb(db);
    const result = await db.execute('SELECT * FROM invites ORDER BY created_at DESC');
    const invites = [];
    for (const row of result.rows) {
      invites.push(inviteRowToClient(await hydrateInviteDisplay(db, row)));
    }
    return json(invites);
  });
}

/** Admin: generate a new invite. */
export function POST(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const { label } = await parseBody(req, inviteCreateSchema);
    const db = getDb();
    await initDb(db);
    const invite = await generateUniqueInvite(db, label);
    return json(inviteRowToClient(invite), 201);
  });
}

/** Admin: change an invite's state (disable / enable / reset). */
export function PUT(req: Request) {
  return handle(async () => {
    await requireAdmin(req);
    const { inviteId, mode } = await parseBody(req, inviteUpdateSchema);
    const db = getDb();
    await initDb(db);

    const existing = await db.execute({
      sql: 'SELECT * FROM invites WHERE id = ?',
      args: [inviteId],
    });
    const invite = existing.rows[0];
    if (!invite) throw new ApiError('invite_not_found', 404);

    if (mode === 'disable') {
      await db.execute({
        sql: 'UPDATE invites SET status = ? WHERE id = ?',
        args: ['disabled', inviteId],
      });
    } else if (mode === 'enable') {
      const restored = invite.used_at ? 'used' : invite.clicked_at ? 'clicked' : 'active';
      await db.execute({
        sql: 'UPDATE invites SET status = ? WHERE id = ?',
        args: [restored, inviteId],
      });
    } else {
      await db.execute({
        sql: 'UPDATE invites SET status = ?, clicked_at = NULL, used_at = NULL, used_by_alias = NULL WHERE id = ?',
        args: ['active', inviteId],
      });
    }

    const updated = await db.execute({
      sql: 'SELECT * FROM invites WHERE id = ?',
      args: [inviteId],
    });
    return json(inviteRowToClient(updated.rows[0]!));
  });
}
