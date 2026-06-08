import { json } from '@/server/responses';
import { rateLimit, clientIp } from '@/server/rateLimit';
import { postErrorToDiscord } from '@/server/discord-notify';
import { clientErrorSchema } from '@/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Hard cap on the request body. Real payloads are a few hundred bytes. */
const MAX_BODY_BYTES = 8 * 1024;

/**
 * Read a request body into a string, aborting once `maxBytes` is exceeded.
 * Returns null if the body is missing, unreadable, or over the cap — so an
 * oversized/forged payload can't force a large allocation before we even parse.
 * (A `Content-Length` check alone is insufficient: it's optional and forgeable.)
 */
async function readBodyLimited(req: Request, maxBytes: number): Promise<string | null> {
  if (!req.body) return null;
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

/**
 * Relay browser-side errors to Discord. The Discord webhook is a server secret,
 * so the client can't post to it directly — its Sentry `beforeSend` posts here
 * instead and we forward to the shared notifier.
 *
 * This endpoint is intentionally unauthenticated (errors can happen before login)
 * and therefore abuse-prone, so it is defended in depth:
 *  - same-origin only: the Origin header must be present and match the request
 *    host (a browser fetch POST always sends Origin), else the request is dropped;
 *  - rate limited per client IP (best-effort, blunts channel flooding);
 *  - the body is read under a hard size cap before parsing; field sizes are then
 *    capped by `clientErrorSchema`.
 *
 * None of these stop a determined attacker forging headers, but together they
 * keep casual/cross-site abuse out. It always responds `{ ok: true }` and never
 * surfaces an error: this is a fire-and-forget relay, so there is nothing useful
 * to report back, and a uniform response avoids advertising the endpoint.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    // Same-origin: require Origin and match it against the Host the client used.
    // A missing/opaque ("null") or mismatched Origin is dropped. `new URL` throws
    // on "null", which the outer catch turns into the same silent drop.
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    if (!origin || !host || new URL(origin).host !== host) {
      return json({ ok: true });
    }

    // Cheap early-out for honest clients; the streaming cap below is the real guard.
    if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
      return json({ ok: true });
    }

    rateLimit(`client-error:${clientIp(req)}`, { limit: 15, windowMs: 60_000 });

    const raw = await readBodyLimited(req, MAX_BODY_BYTES);
    if (raw === null) return json({ ok: true });

    const parsed = clientErrorSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return json({ ok: true });

    const body = parsed.data;
    await postErrorToDiscord({
      type: body.type,
      message: body.message,
      source: 'client',
      url: body.url,
      stack: body.stack,
      eventId: body.eventId,
    });
  } catch {
    // Swallow everything (rate limit, bad JSON, relay failure) — best-effort relay.
  }
  return json({ ok: true });
}
