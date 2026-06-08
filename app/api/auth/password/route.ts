import { getDb, initDb } from '@/server/db';
import { hashPassword } from '@/server/auth';
import { ApiError, handle, json, parseBody, requireUser } from '@/server/responses';
import { changePasswordSchema } from '@/schemas';

export const runtime = 'nodejs';

/**
 * Let a signed-in user set their own password (SEC C2: store only the new
 * PBKDF2 hash). Used by leaders to replace the admin-issued temporary password
 * on first login; clearing `must_change_password` lifts the forced-change gate.
 *
 * The admin has no DB row — its password is env-managed — so it is rejected.
 */
export function POST(req: Request) {
  return handle(async () => {
    const session = await requireUser(req);
    if (session.admin) throw new ApiError('forbidden', 403);
    const { newPassword } = await parseBody(req, changePasswordSchema);

    const db = getDb();
    await initDb(db);
    const hashed = await hashPassword(newPassword);
    await db.execute({
      sql: 'UPDATE users SET password = ?, must_change_password = 0 WHERE alias = ?',
      args: [hashed, session.alias],
    });
    return json({ ok: true });
  });
}
