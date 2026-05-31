import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
}));

import { GET } from './route';
import { getDb } from '@/server/db';
import { signSession, SESSION_COOKIE } from '@/server/session';
import { createFakeDb, type FakeDb } from '@/test/fakeDb';

async function cookie(alias: string, admin: boolean): Promise<string> {
  const value = await signSession({ alias, admin, iat: 1 });
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}`;
}

function req(cookieHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request('http://localhost/api/users', { headers });
}

function userRow(alias: string, role: 'player' | 'leader') {
  return {
    alias,
    role,
    display_alias: alias,
    display_name: '',
    avatar_config: '{}',
    unlocked_items: '[]',
    highscores: '{}',
    secret_flags: '{}',
    joined_at: null,
  };
}

let db: FakeDb;
beforeEach(() => {
  db = createFakeDb([
    {
      test: (sql) => /SELECT \* FROM users/.test(sql),
      result: { rows: [userRow('maja', 'player'), userRow('tranare-anna', 'leader')] as never },
    },
  ]);
  vi.mocked(getDb).mockReturnValue(db.client);
});

describe('GET /api/users', () => {
  it('rejects unauthenticated callers with 401', async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('excludes leader (coach) accounts from the leaderboard', async () => {
    const res = await GET(req(await cookie('maja', false)));
    expect(res.status).toBe(200);
    const users = (await res.json()) as { alias: string; role: string }[];
    expect(users.map((u) => u.alias)).toEqual(['maja']);
    expect(users.some((u) => u.role === 'leader')).toBe(false);
  });
});
