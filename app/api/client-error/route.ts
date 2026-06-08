import { json, parseBody } from '@/server/responses';
import { rateLimit, clientIp } from '@/server/rateLimit';
import { postErrorToDiscord } from '@/server/discord-notify';
import { clientErrorSchema } from '@/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Reject bodies larger than this before reading them into memory (defence only). */
const MAX_BODY_BYTES = 8 * 1024;

/**
 * Relay browser-side errors to Discord. The Discord webhook is a server secret,
 * so the client can't post to it directly — its Sentry `beforeSend` posts here
 * instead and we forward to the shared notifier.
 *
 * This endpoint is intentionally unauthenticated (errors can happen before login)
 * and therefore abuse-prone, so it is defended in depth:
 *  - rate limited per client IP (best-effort, blunts channel flooding);
 *  - same-origin only, to reject naive cross-site/bot posting;
 *  - oversized bodies are rejected before reading; field sizes are capped by
 *    `clientErrorSchema`.
 *
 * It always responds `{ ok: true }` and never surfaces an error: this is a
 * fire-and-forget relay, so there is nothing useful to report back to the
 * browser, and a uniform response avoids advertising the endpoint's internals.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    // Reject anything not posted from our own pages. Origin is browser-enforced;
    // it doesn't stop a determined non-browser client, but combined with the rate
    // limit it keeps casual abuse out. Compare full origins (scheme + host + port);
    // a missing or opaque ("null") Origin simply won't match and is dropped.
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) {
      return json({ ok: true });
    }

    const declaredLength = Number(req.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return json({ ok: true });
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
  } catch {
    // Swallow everything (rate limit, bad body, relay failure) — best-effort relay.
  }
  return json({ ok: true });
}
