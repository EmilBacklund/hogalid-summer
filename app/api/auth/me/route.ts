import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { loadUser } from '@/server/repo';
import { updateSelfSchema } from '@/schemas';

export const runtime = 'nodejs';

/** Current authenticated user (the client's session bootstrap). */
export function GET(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) return json({ alias: 'admin', isAdmin: true });

    const db = getDb();
    await initDb(db);
    const user = await loadUser(db, session.alias);
    if (!user) throw new ApiError('not_found', 404);
    return json(user);
  });
}

/** Update the acting user's own progress fields (alias comes from the cookie). */
export function PUT(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const body = await parseBody(req, updateSelfSchema);

    const db = getDb();
    await initDb(db);
    const existing = await db.execute({
      sql: 'SELECT highscores, unlocked_items, avatar_config, secret_flags FROM users WHERE alias = ?',
      args: [session.alias],
    });
    const row = existing.rows[0];
    if (!row) throw new ApiError('not_found', 404);

    await db.execute({
      sql: 'UPDATE users SET highscores = ?, unlocked_items = ?, avatar_config = ?, secret_flags = ? WHERE alias = ?',
      args: [
        body.highscores !== undefined
          ? JSON.stringify(body.highscores)
          : String(row.highscores ?? '{}'),
        body.unlockedItems !== undefined
          ? JSON.stringify(body.unlockedItems)
          : String(row.unlocked_items ?? '[]'),
        body.avatarConfig !== undefined
          ? JSON.stringify(body.avatarConfig)
          : String(row.avatar_config ?? '{}'),
        body.secretFlags !== undefined
          ? JSON.stringify(body.secretFlags)
          : String(row.secret_flags ?? '{}'),
        session.alias,
      ],
    });
    return json({ ok: true });
  });
}
