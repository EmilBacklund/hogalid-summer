import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
}));

import { DELETE, POST, PUT } from './route';
import { getDb } from '@/server/db';
import { signSession, SESSION_COOKIE } from '@/server/session';
import { createFakeDb, type FakeDb } from '@/test/fakeDb';

async function cookie(alias: string, admin = false): Promise<string> {
  const value = await signSession({ alias, admin, iat: 1 });
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}`;
}

function req(method: string, body: unknown, cookieHeader?: string): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request('http://localhost/api/logs', { method, headers, body: JSON.stringify(body) });
}

function useDb(db: FakeDb) {
  vi.mocked(getDb).mockReturnValue(db.client);
}

beforeEach(() => {
  useDb(createFakeDb());
});

describe('POST /api/logs (SEC H1 — server-authoritative points)', () => {
  it('recomputes points from clamped exercises, ignoring client input', async () => {
    const db = createFakeDb();
    useDb(db);
    const res = await POST(
      req(
        'POST',
        {
          kind: 'training',
          date: '2026-06-01',
          // toetaps max is 1000 — the 10000 must be clamped, and any client
          // "points" field is not even part of the schema.
          exercises: [{ id: 'toetaps', value: 10_000 }],
          iceCream: 999,
          points: 999_999,
        },
        await cookie('maja'),
      ),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ points: 1000 });

    const insert = db.calls.find((c) => /INSERT INTO logs/.test(c.sql));
    expect(insert).toBeDefined();
    const args = insert!.args as unknown[];
    expect(args[0]).toBe('maja'); // alias from cookie, not body
    expect(args[3]).toBe(1000); // points recomputed + clamped
    expect(args[5]).toBe(10); // ice cream clamped to max
  });

  it('clamps a penalty score to 0..10', async () => {
    const db = createFakeDb();
    useDb(db);
    const res = await POST(req('POST', { kind: 'penalty', score: 999 }, await cookie('maja')));
    expect(res.status).toBe(200);
    const insert = db.calls.find((c) => /INSERT INTO logs/.test(c.sql));
    expect((insert!.args as unknown[])[2]).toBe(10); // points = clamped score
  });

  it('rejects unauthenticated callers', async () => {
    const res = await POST(req('POST', { kind: 'training', date: '2026-06-01', exercises: [] }));
    expect(res.status).toBe(401);
  });
});

describe('PUT/DELETE /api/logs (ownership)', () => {
  it("refuses to edit another user's log", async () => {
    const db = createFakeDb([
      {
        test: (sql) => /SELECT alias FROM logs/.test(sql),
        result: { rows: [{ alias: 'someone-else' } as never] },
      },
    ]);
    useDb(db);
    const res = await PUT(
      req('PUT', { logId: 7, log: { date: '2026-06-01', exercises: [] } }, await cookie('maja')),
    );
    expect(res.status).toBe(403);
  });

  it("refuses to delete another user's log", async () => {
    const db = createFakeDb([
      {
        test: (sql) => /SELECT alias FROM logs/.test(sql),
        result: { rows: [{ alias: 'someone-else' } as never] },
      },
    ]);
    useDb(db);
    const res = await DELETE(req('DELETE', { logId: 7 }, await cookie('maja')));
    expect(res.status).toBe(403);
  });

  it('allows editing your own log and recomputes points', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /SELECT alias FROM logs/.test(sql),
        result: { rows: [{ alias: 'maja' } as never] },
      },
    ]);
    useDb(db);
    const res = await PUT(
      req(
        'PUT',
        { logId: 7, log: { date: '2026-06-01', exercises: [{ id: 'fritraning', value: 20 }] } },
        await cookie('maja'),
      ),
    );
    expect(res.status).toBe(200);
    const update = db.calls.find((c) => /UPDATE logs SET date/.test(c.sql));
    expect((update!.args as unknown[])[2]).toBe(100); // 20 min * 5
  });
});
