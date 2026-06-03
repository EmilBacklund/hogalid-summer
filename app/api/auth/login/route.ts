import { getDb, initDb } from '@/server/db';
import { verifyPassword } from '@/server/auth';
import { setSessionCookie } from '@/server/session';
import { ApiError, handle, json, parseBody } from '@/server/responses';
import { rateLimit, clientIp } from '@/server/rateLimit';
import { loadUser } from '@/server/repo';
import { loginInputSchema } from '@/schemas';

export const runtime = 'nodejs';

export function POST(req: Request) {
  return handle(async () => {
    const { alias, password } = await parseBody(req, loginInputSchema);
    const key = alias.toLowerCase();

    // SEC M3: throttle login attempts per IP+alias to blunt brute force.
    rateLimit(`login:${clientIp(req)}:${key}`, { limit: 10, windowMs: 5 * 60_000 });

    const adminAlias = (process.env.ADMIN_ALIAS || 'admin').toLowerCase();
    if (key === adminAlias) {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword || password !== adminPassword) {
        throw new ApiError('invalid_credentials', 401);
      }
      const res = json({ alias: 'admin', isAdmin: true });
      await setSessionCookie(res, { alias: 'admin', admin: true });
      return res;
    }

    const db = getDb();
    await initDb(db);
    const result = await db.execute({
      sql: 'SELECT password FROM users WHERE alias = ?',
      args: [key],
    });
    const row = result.rows[0];
    // SEC M4: identical generic error whether the alias exists or not.
    if (!row || !(await verifyPassword(password, String(row.password)))) {
      throw new ApiError('invalid_credentials', 401);
    }

    const user = await loadUser(db, key);
    if (!user) throw new ApiError('invalid_credentials', 401);
    const res = json(user);
    await setSessionCookie(res, { alias: key, admin: false, role: user.role });
    return res;
  });
}
