import { getDb, initDb } from '@/server/db';
import { hashPassword } from '@/server/auth';
import { setSessionCookie } from '@/server/session';
import { ApiError, handle, json, parseBody } from '@/server/responses';
import { rateLimit, clientIp } from '@/server/rateLimit';
import { loadUser } from '@/server/repo';
import { getInviteByCode, getInviteByToken, hydrateInviteDisplay } from '@/server/invites';
import { registerInputSchema } from '@/schemas';

export const runtime = 'nodejs';

export function POST(req: Request) {
  return handle(async () => {
    const body = await parseBody(req, registerInputSchema);
    const aliasInput = body.alias.trim();
    const key = aliasInput.toLowerCase();

    // SEC M3: throttle invite redemption attempts per IP.
    rateLimit(`register:${clientIp(req)}`, { limit: 15, windowMs: 10 * 60_000 });

    const db = getDb();
    await initDb(db);

    const invite = body.inviteToken
      ? await getInviteByToken(db, body.inviteToken)
      : body.inviteCode
        ? await getInviteByCode(db, body.inviteCode)
        : null;

    if (!invite) throw new ApiError('invite_required', 400);
    if (String(invite.status) === 'used') {
      const hydrated = await hydrateInviteDisplay(db, invite);
      throw new ApiError('invite_used', 409, {
        usedByAlias: String(hydrated.used_by_label ?? hydrated.used_by_alias ?? ''),
      });
    }
    if (String(invite.status) === 'disabled') throw new ApiError('invite_disabled', 409);

    const existing = await db.execute({
      sql: 'SELECT alias FROM users WHERE alias = ?',
      args: [key],
    });
    if (existing.rows.length > 0) throw new ApiError('alias_taken', 409);

    // SEC C2: only the PBKDF2 hash is stored — never the plaintext password.
    const hashed = await hashPassword(body.password);
    const joinedAt = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO users
            (alias, display_alias, password, avatar_config, unlocked_items, highscores, secret_flags, joined_at)
            VALUES (?, ?, ?, ?, '[]', '{}', '{}', ?)`,
      args: [key, aliasInput || key, hashed, JSON.stringify(body.avatarConfig ?? {}), joinedAt],
    });
    await db.execute({
      sql: 'UPDATE invites SET status = ?, used_at = ?, used_by_alias = ? WHERE id = ?',
      args: ['used', joinedAt, key, Number(invite.id)],
    });

    const user = await loadUser(db, key);
    const res = json(user, 201);
    await setSessionCookie(res, { alias: key, admin: false, role: 'player' });
    return res;
  });
}
