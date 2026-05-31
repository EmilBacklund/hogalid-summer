import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
}));

import { GET } from './route';
import { getDb } from '@/server/db';
import { signSession, SESSION_COOKIE } from '@/server/session';
import { createFakeDb, type FakeDb } from '@/test/fakeDb';

async function cookie(alias: string, opts: { admin?: boolean; role?: 'player' | 'leader' } = {}) {
  const value = await signSession({
    alias,
    admin: opts.admin ?? false,
    ...(opts.role ? { role: opts.role } : {}),
    iat: 1,
  });
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}`;
}

function req(cookieHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request('http://localhost/api/photos/pending', { headers });
}

let db: FakeDb;
beforeEach(() => {
  db = createFakeDb([
    {
      test: (sql) => /WHERE p.status = 'pending'/.test(sql),
      result: {
        rows: [
          {
            id: 3,
            alias: 'maja',
            mime_type: 'image/jpeg',
            week_start: '2026-06-01',
            uploaded_at: '2026-06-02T00:00:00.000Z',
            display_name: 'Maja',
          } as never,
        ],
      },
    },
  ]);
  vi.mocked(getDb).mockReturnValue(db.client);
});

describe('GET /api/photos/pending (moderation queue)', () => {
  it('rejects unauthenticated callers with 401', async () => {
    expect((await GET(req())).status).toBe(401);
  });

  it('rejects a plain player with 403', async () => {
    expect((await GET(req(await cookie('maja', { role: 'player' })))).status).toBe(403);
  });

  it('returns the pending queue to a leader', async () => {
    const res = await GET(req(await cookie('tranare-anna', { role: 'leader' })));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { photos: { id: number; uploaderName: string }[] };
    expect(body.photos).toHaveLength(1);
    expect(body.photos[0]).toMatchObject({ id: 3, uploaderName: 'Maja', url: '/api/photos/3' });
  });

  it('returns the pending queue to the admin', async () => {
    const res = await GET(req(await cookie('admin', { admin: true })));
    expect(res.status).toBe(200);
  });
});
