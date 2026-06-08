import * as Sentry from '@sentry/nextjs';
import { json } from '@/server/responses';
import { getSession } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * TEMPORARY Sentry verification endpoint — DELETE after confirming events land.
 * Captures a labelled test exception and flushes before returning, so the event
 * is guaranteed sent even in a short-lived serverless function. Inert outside
 * production (Sentry is disabled without a DSN + NODE_ENV=production).
 *
 * NB: the folder must NOT be prefixed with `_` — Next.js treats `_`-prefixed
 * folders as private and opts them out of routing (they 404), which is why the
 * original `_sentry-check` was unreachable.
 *
 * Admin-only: this deliberately throws an exception (spending Sentry quota and
 * pinging Discord), so it must not be publicly callable. Non-admins get a 404 so
 * the endpoint's existence isn't advertised. Verify it in-browser while logged in
 * as admin (the session cookie rides along automatically).
 */
export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session?.admin) {
    return json({ error: 'not_found' }, 404);
  }

  const eventId = Sentry.captureException(
    new Error('Sentry verification check — safe to ignore, delete /api/sentry-check'),
  );
  await Sentry.flush(2000);
  return json({ ok: true, eventId });
}
