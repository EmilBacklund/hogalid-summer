import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { displayNameSchema } from '@/schemas';

export const runtime = 'nodejs';

export function PUT(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { displayName } = await parseBody(req, displayNameSchema);
    const name = displayName.trim().slice(0, 20);

    const db = getDb();
    await initDb(db);
    await db.execute({
      sql: 'UPDATE users SET display_name = ? WHERE alias = ?',
      args: [name, session.alias],
    });
    return json({ ok: true });
  });
}
