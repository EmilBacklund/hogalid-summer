import { handle, json, parseBody } from '@/server/responses';
import { rateLimit, clientIp } from '@/server/rateLimit';
import { postErrorToDiscord } from '@/server/discord-notify';
import { clientErrorSchema } from '@/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Relay browser-side errors to Discord. The Discord webhook is a server secret,
 * so the client can't post to it directly — its Sentry `beforeSend` posts here
 * instead and we forward to the shared notifier.
 *
 * This endpoint is intentionally unauthenticated (errors can happen before login)
 * and therefore abuse-prone, so it is defended in depth:
 *  - rate limited per client IP (best-effort, blunts channel flooding);
 *  - same-origin only, to reject naive cross-site/bot posting;
 *  - payload sizes are capped by `clientErrorSchema`.
 */
export function POST(req: Request) {
  return handle(async () => {
    // Reject anything not posted from our own pages. Origin is browser-enforced;
    // it doesn't stop a determined non-browser client, but combined with the rate
    // limit it keeps casual abuse out.
    const origin = req.headers.get('origin');
    if (origin && new URL(origin).host !== new URL(req.url).host) {
      return json({ ok: true }); // silently ignore — never reveal the relay
    }

    rateLimit(`client-error:${clientIp(req)}`, { limit: 15, windowMs: 60_000 });

    const body = await parseBody(req, clientErrorSchema);
    await postErrorToDiscord({
      type: body.type,
      message: body.message,
      source: 'client',
      url: body.url,
      stack: body.stack,
      eventId: body.eventId,
    });

    return json({ ok: true });
  });
}
