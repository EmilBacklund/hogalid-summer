import type { NextResponse } from 'next/server';

/**
 * Signed, httpOnly session cookie (SEC C1).
 *
 * The cookie carries the acting identity — every mutating handler derives the
 * alias from here, never from the request body. Admin handlers additionally
 * check the `admin` claim. Signed with HMAC-SHA256 (Web Crypto, so this stays
 * portable to edge middleware in Session 4); tampering invalidates the cookie.
 */

export const SESSION_COOKIE = 'hf_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface Session {
  /** Lowercased alias. For the admin it is the literal string `admin`. */
  alias: string;
  /** True only for the single env-var admin (SEC C1). */
  admin: boolean;
  /** Issued-at (epoch seconds). */
  iat: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set (>=16 chars) in production');
  }
  // Dev/test fallback so the app runs without a configured secret.
  return 'dev-insecure-session-secret-change-me';
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(payload: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/** Serialize + sign a session into a cookie value. */
export async function signSession(session: Session): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(session)));
  const sig = toBase64Url(await hmac(payload));
  return `${payload}.${sig}`;
}

/** Verify + parse a cookie value back into a session, or null if invalid. */
export async function verifySessionValue(value: string | undefined): Promise<Session | null> {
  if (!value) return null;
  const dot = value.indexOf('.');
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  let expected: Uint8Array;
  try {
    expected = await hmac(payload);
  } catch {
    return null;
  }
  let provided: Uint8Array;
  try {
    provided = fromBase64Url(sig);
  } catch {
    return null;
  }
  if (!timingSafeEqual(provided, expected)) return null;
  try {
    const json = new TextDecoder().decode(fromBase64Url(payload));
    const parsed = JSON.parse(json) as Partial<Session>;
    if (typeof parsed.alias !== 'string' || typeof parsed.admin !== 'boolean') return null;
    return { alias: parsed.alias, admin: parsed.admin, iat: Number(parsed.iat) || 0 };
  } catch {
    return null;
  }
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/** Read + verify the session from an incoming request. */
export async function getSession(req: Request): Promise<Session | null> {
  return verifySessionValue(readCookie(req, SESSION_COOKIE));
}

/** Attach the signed session cookie to a response. */
export async function setSessionCookie(
  res: NextResponse,
  session: Omit<Session, 'iat'>,
): Promise<void> {
  const value = await signSession({ ...session, iat: Math.floor(Date.now() / 1000) });
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Clear the session cookie on a response. */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
