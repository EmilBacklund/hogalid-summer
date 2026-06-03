import { NextResponse } from 'next/server';
import { getSession, type Session } from './session';

/**
 * An error whose `code` is safe to return to the client (SEC M4). Anything not
 * thrown as an ApiError is treated as an unexpected server fault: the detail is
 * logged server-side and the client only sees a generic `server_error`.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number = 400,
    readonly extra?: Record<string, unknown>,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Wrap a Route Handler so thrown ApiErrors become clean `{ error: code }`
 * responses and everything else becomes a logged 500 with a generic message.
 */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return json({ error: err.code, ...(err.extra ?? {}) }, err.status);
    }
    // Unexpected — log full detail server-side (also surfaced via Sentry), but
    // never leak it to the client.
    console.error('[api] unhandled error', err);
    return json({ error: 'server_error' }, 500);
  }
}

/** Require a valid session, else throw 401. Returns the acting session. */
export async function requireUser(req: Request): Promise<Session> {
  const session = await getSession(req);
  if (!session) throw new ApiError('unauthorized', 401);
  return session;
}

/** Require the admin claim, else throw (401 if no session, 403 if not admin). */
export async function requireAdmin(req: Request): Promise<Session> {
  const session = await requireUser(req);
  if (!session.admin) throw new ApiError('forbidden', 403);
  return session;
}

/**
 * Require a moderator — the admin or a leader account — else throw (401 with no
 * session, 403 otherwise). Used by moderation endpoints (e.g. photo approval).
 */
export async function requireLeader(req: Request): Promise<Session> {
  const session = await requireUser(req);
  if (!session.admin && session.role !== 'leader') throw new ApiError('forbidden', 403);
  return session;
}

/** Parse + validate a JSON body with a Zod schema, throwing a clean 400. */
export async function parseBody<T>(
  req: Request,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError('invalid_body', 400);
  }
  const result = schema.safeParse(raw);
  if (!result.success || result.data === undefined) {
    throw new ApiError('invalid_body', 400);
  }
  return result.data;
}
