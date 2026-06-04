import { request as pwRequest, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Shared E2E helpers. Auth + data setup go through the real Route Handlers over
 * HTTP (using a request context that shares the page's cookie jar), so tests can
 * reserve UI interaction for the flow actually under test.
 */

export const BASE_URL = 'http://localhost:3000';
export const TEST_PASSWORD = 'test1234';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing env var ${name}. E2E needs TURSO_URL, TURSO_TOKEN, SESSION_SECRET, ` +
        `ADMIN_ALIAS, ADMIN_PASSWORD (see README). Set them in .env.local.`,
    );
  }
  return value;
}

let aliasCounter = 0;
/** A unique, schema-valid alias (<=30 chars, lowercased) prefixed for easy cleanup. */
export function uniqueAlias(prefix = 'user'): string {
  aliasCounter += 1;
  const stamp = Date.now().toString(36).slice(-6);
  return `e2e_${prefix}_${stamp}${aliasCounter}`.slice(0, 30);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A standalone request context authenticated as the single admin. */
export async function adminContext(): Promise<APIRequestContext> {
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
  const res = await ctx.post('/api/auth/login', {
    data: { alias: requireEnv('ADMIN_ALIAS'), password: requireEnv('ADMIN_PASSWORD') },
  });
  expect(res.ok(), `admin login failed (${res.status()})`).toBeTruthy();
  return ctx;
}

/** Admin-create a single-use invite; returns its link token and human code. */
export async function createInvite(label = 'E2E'): Promise<{ token: string; code: string }> {
  const ctx = await adminContext();
  try {
    const res = await ctx.post('/api/invites', { data: { label } });
    expect(res.ok(), `create invite failed (${res.status()})`).toBeTruthy();
    const invite = (await res.json()) as { token: string; code: string };
    return { token: invite.token, code: invite.code };
  } finally {
    await ctx.dispose();
  }
}

/** Register a fresh user on the given context (its cookie jar becomes that user). */
export async function registerUser(
  ctx: APIRequestContext,
  alias: string,
  password = TEST_PASSWORD,
): Promise<void> {
  const { token } = await createInvite(alias);
  const res = await ctx.post('/api/auth/register', {
    data: { alias, password, inviteToken: token, avatarConfig: {} },
  });
  expect(res.ok(), `register ${alias} failed (${res.status()})`).toBeTruthy();
}

/** Log a normal training entry via the API (points are recomputed server-side). */
export async function logExercise(
  ctx: APIRequestContext,
  exerciseId: string,
  value: number,
): Promise<void> {
  const res = await ctx.post('/api/logs', {
    data: { kind: 'training', date: today(), exercises: [{ id: exerciseId, value }] },
  });
  expect(res.ok(), `log ${exerciseId} failed (${res.status()})`).toBeTruthy();
}

/** Register a user and authenticate the browser page as them (via page.request). */
export async function registerAndSignIn(page: Page, prefix = 'user'): Promise<string> {
  const alias = uniqueAlias(prefix);
  await registerUser(page.request, alias);
  return alias;
}

/** A 1×1 transparent PNG, for photo-upload tests. */
export function tinyPngBuffer(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/x8QAAAAAElFTkSuQmCC',
    'base64',
  );
}
