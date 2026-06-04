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

describe('POST /api/admin create-leader', () => {
  it('rejects a non-admin session with 403', async () => {
    const res = await POST(
      req(
        { action: 'create-leader', alias: 'tranare-anna', password: 'hejhej' },
        await cookie('maja', false),
      ),
    );
    expect(res.status).toBe(403);
  });

  it('creates a leader account with role=leader and a hashed password (SEC C2)', async () => {
    const res = await POST(
      req(
        { action: 'create-leader', alias: 'Tranare-Anna', password: 'hejhej' },
        await cookie('admin', true),
      ),
    );
    expect(res.status).toBe(201);
    const insert = db.calls.find((c) => /INSERT INTO users/.test(c.sql));
    expect(insert).toBeDefined();
    // role lives in the SQL literal; alias is lowercased.
    expect(insert!.sql).toMatch(/'leader'/);
    const args = insert!.args as unknown[];
    expect(args[0]).toBe('tranare-anna');
    const stored = args[2] as string;
    expect(stored).not.toContain('hejhej');
    expect(stored).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  it('refuses to create a leader when the alias is taken (409)', async () => {
    db = createFakeDb([
      {
        test: (sql) => /SELECT alias FROM users/.test(sql),
        result: { rows: [{ alias: 'x' } as never] },
      },
    ]);
    vi.mocked(getDb).mockReturnValue(db.client);
    const res = await POST(
      req({ action: 'create-leader', alias: 'x', password: 'hejhej' }, await cookie('admin', true)),
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: 'alias_taken' });
  });

  it('rejects a too-short password (400)', async () => {
    const res = await POST(
      req({ action: 'create-leader', alias: 'anna', password: 'ab' }, await cookie('admin', true)),
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/admin delete-log (per-player log moderation)', () => {
  it('rejects a non-admin session with 403', async () => {
    const res = await POST(req({ action: 'delete-log', logId: 5 }, await cookie('maja', false)));
    expect(res.status).toBe(403);
  });

  it('lets the admin delete a training log by id', async () => {
    db = createFakeDb([
      {
        test: (sql) => /DELETE FROM logs/.test(sql),
        result: { rowsAffected: 1 },
      },
    ]);
    vi.mocked(getDb).mockReturnValue(db.client);
    const res = await POST(req({ action: 'delete-log', logId: 5 }, await cookie('admin', true)));
    expect(res.status).toBe(200);
    const del = db.calls.find((c) => /DELETE FROM logs WHERE id = \?/.test(c.sql));
    expect(del).toBeDefined();
    expect((del!.args as unknown[])[0]).toBe(5);
  });

  it('returns 404 when the log does not exist', async () => {
    const res = await POST(req({ action: 'delete-log', logId: 999 }, await cookie('admin', true)));
    expect(res.status).toBe(404);
  });

  it('rejects a non-positive log id (400)', async () => {
    const res = await POST(req({ action: 'delete-log', logId: 0 }, await cookie('admin', true)));
    expect(res.status).toBe(400);
  });
});
