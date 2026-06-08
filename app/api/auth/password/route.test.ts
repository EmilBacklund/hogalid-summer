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
  return new Request('http://localhost/api/auth/password', {
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

describe('POST /api/auth/password', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await POST(req({ newPassword: 'brandnew' }));
    expect(res.status).toBe(401);
  });

  it('rejects the admin (env-managed password) with 403', async () => {
    const res = await POST(req({ newPassword: 'brandnew' }, await cookie('admin', true)));
    expect(res.status).toBe(403);
  });

  it('rejects a too-short password with 400', async () => {
    const res = await POST(req({ newPassword: 'ab' }, await cookie('anna', false)));
    expect(res.status).toBe(400);
  });

  it('stores a hashed password and clears the forced-change flag (SEC C2)', async () => {
    const res = await POST(req({ newPassword: 'brandnew' }, await cookie('anna', false)));
    expect(res.status).toBe(200);
    const update = db.calls.find((c) => /UPDATE users SET password/.test(c.sql));
    expect(update).toBeDefined();
    expect(update!.sql).toMatch(/must_change_password = 0/);
    const stored = (update!.args as unknown[])[0] as string;
    expect(stored).not.toContain('brandnew');
    expect(stored).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    // Alias comes from the session, never the body.
    expect((update!.args as unknown[])[1]).toBe('anna');
  });
});
