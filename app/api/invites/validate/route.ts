import { getDb, initDb } from '@/server/db';
import { ApiError, handle, json } from '@/server/responses';
import { rateLimit, clientIp } from '@/server/rateLimit';
import {
  getInviteByCode,
  getInviteByToken,
  hydrateInviteDisplay,
  inviteRowToClient,
  markInviteClicked,
} from '@/server/invites';

export const runtime = 'nodejs';

/**
 * Validate an invite by token or code. Intentionally public — the register
 * screen calls it before any session exists. Rate-limited to blunt code
 * enumeration (SEC M3). Marks the invite "clicked" on first open.
 */
export function GET(req: Request) {
  return handle(async () => {
    rateLimit(`invite-validate:${clientIp(req)}`, { limit: 30, windowMs: 10 * 60_000 });
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const code = url.searchParams.get('code');

    const db = getDb();
    await initDb(db);

    let invite = token
      ? await getInviteByToken(db, token)
      : code
        ? await getInviteByCode(db, code)
        : null;
    if (!token && !code) throw new ApiError('missing_invite', 400);
    if (!invite) throw new ApiError('invite_not_found', 404);

    const status = String(invite.status);
    if (status !== 'used' && status !== 'disabled') {
      invite = await markInviteClicked(db, invite);
    }
    return json(inviteRowToClient(await hydrateInviteDisplay(db, invite)));
  });
}
