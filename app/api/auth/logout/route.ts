import { clearSessionCookie } from '@/server/session';
import { handle, json } from '@/server/responses';

export const runtime = 'nodejs';

export function POST() {
  return handle(async () => {
    const res = json({ ok: true });
    clearSessionCookie(res);
    return res;
  });
}
