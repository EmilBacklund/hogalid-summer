import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
}));

import { POST } from './route';
import { getDb } from '@/server/db';
import { signSession, SESSION_COOKIE } from '@/server/session';
import { createFakeDb, type FakeDb } from '@/test/fakeDb';

async function cookie(alias: string, admin: boolean): Promise<string> {
  const value = await signSession({ alias, admin, iat: 1 });
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}`;
}

function req(body: unknown, cookieHeader?: string): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request('http://localhost/api/admin', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

let db: FakeDb;
beforeEach(() => {
  db = createFakeDb();
  vi.mocked(getDb).mockReturnValue(db.client);
});

describe('POST /api/admin (SEC C1 — admin-claim gating)', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await POST(req({ action: 'reset-season' }));
    expect(res.status).toBe(401);
  });

  it('rejects a non-admin session with 403', async () => {
    const res = await POST(req({ action: 'reset-season' }, await cookie('maja', false)));
    expect(res.status).toBe(403);
  });

  it('allows the admin to reset the season', async () => {
    const res = await POST(req({ action: 'reset-season' }, await cookie('admin', true)));
    expect(res.status).toBe(200);
    expect(db.client.executeMultiple).toHaveBeenCalledOnce();
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it('never persists a plaintext password on reset (SEC C2)', async () => {
    const res = await POST(
      req(
        { action: 'reset-password', alias: 'maja', newPassword: 'brandnew' },
        await cookie('admin', true),
      ),
    );
    expect(res.status).toBe(200);
    const update = db.calls.find((c) => /UPDATE users SET password/.test(c.sql));
    expect(update).toBeDefined();
    // The stored value is a PBKDF2 `salt:hash`, never the cleartext.
    const stored = (update!.args as unknown[])[0] as string;
    expect(stored).not.toContain('brandnew');
    expect(stored).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('rejects an unknown admin action', async () => {
    const res = await POST(req({ action: 'nuke-everything' }, await cookie('admin', true)));
    expect(res.status).toBe(400);
  });
});
