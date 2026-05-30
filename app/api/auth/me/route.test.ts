import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
}));

import { GET } from './route';
import { getDb } from '@/server/db';
import { signSession, SESSION_COOKIE } from '@/server/session';
import { createFakeDb } from '@/test/fakeDb';

async function cookie(alias: string, admin = false): Promise<string> {
  const value = await signSession({ alias, admin, iat: 1 });
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}`;
}

function getReq(cookieHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request('http://localhost/api/auth/me', { headers });
}

beforeEach(() => {
  vi.mocked(getDb).mockReturnValue(createFakeDb().client);
});

describe('GET /api/auth/me', () => {
  it('rejects unauthenticated callers', async () => {
    expect((await GET(getReq())).status).toBe(401);
  });

  it('returns an admin marker for the admin session', async () => {
    const res = await GET(getReq(await cookie('admin', true)));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ alias: 'admin', isAdmin: true });
  });

  it('returns the hydrated user for a normal session', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /SELECT \* FROM users WHERE alias/.test(sql),
        result: {
          rows: [{ alias: 'leo', display_alias: 'Leo', joined_at: '2026-05-01' } as never],
        },
      },
    ]);
    vi.mocked(getDb).mockReturnValue(db.client);
    const res = await GET(getReq(await cookie('leo')));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ alias: 'leo', logs: [], bingo: [] });
  });
});
