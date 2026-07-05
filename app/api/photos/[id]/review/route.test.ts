import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
}));

import { POST } from './route';
import { getDb } from '@/server/db';
import { signSession, SESSION_COOKIE } from '@/server/session';
import { setPhotoStorageForTests, type PhotoStorage } from '@/server/photoStorage';
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

function reviewReq(action: string, cookieHeader?: string): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request('http://localhost/api/photos/9/review', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action }),
  });
}

const params = { params: Promise.resolve({ id: '9' }) };

let storage: PhotoStorage & { delete: ReturnType<typeof vi.fn> };
beforeEach(() => {
  storage = {
    put: vi.fn(async () => {}),
    get: vi.fn(async () => null),
    delete: vi.fn(async () => {}),
  };
  setPhotoStorageForTests(storage);
});
afterEach(() => setPhotoStorageForTests(null));

function dbWithPhoto(opts: { status?: string; bonusAlreadyPaid?: boolean } = {}): FakeDb {
  return createFakeDb([
    // deletePhotoById looks up the blob_key before removing the row.
    {
      test: (sql) => /SELECT blob_key FROM album_photos/.test(sql),
      result: { rows: [{ blob_key: 'maja/2026-06-01/abc' } as never] },
    },
    // approve reads the row first: uploader + week drive the challenge bonus.
    {
      test: (sql) => /SELECT alias, week_start, status FROM album_photos/.test(sql),
      result: {
        rows: [
          {
            alias: 'maja',
            week_start: '2026-07-06',
            status: opts.status ?? 'pending',
          } as never,
        ],
      },
    },
    // the once-per-challenge dedupe check on the logs table.
    {
      test: (sql) => /SELECT COUNT\(\*\) AS count FROM logs/.test(sql),
      result: { rows: [{ count: opts.bonusAlreadyPaid ? 1 : 0 } as never] },
    },
    {
      test: (sql) => /UPDATE album_photos SET status = 'approved'/.test(sql),
      result: { rowsAffected: 1 },
    },
  ]);
}

const bonusInsert = (db: FakeDb) => db.calls.find((c) => /INSERT INTO logs/.test(c.sql));

describe('POST /api/photos/[id]/review (SEC — leader-only moderation)', () => {
  it('rejects unauthenticated callers with 401', async () => {
    vi.mocked(getDb).mockReturnValue(dbWithPhoto().client);
    expect((await POST(reviewReq('approve'), params)).status).toBe(401);
  });

  it('rejects a plain player with 403', async () => {
    vi.mocked(getDb).mockReturnValue(dbWithPhoto().client);
    const res = await POST(reviewReq('approve', await cookie('maja', { role: 'player' })), params);
    expect(res.status).toBe(403);
  });

  it('lets a leader approve a pending photo', async () => {
    const db = dbWithPhoto();
    vi.mocked(getDb).mockReturnValue(db.client);
    const res = await POST(
      reviewReq('approve', await cookie('tranare-anna', { role: 'leader' })),
      params,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, status: 'approved' });
    const update = db.calls.find((c) => /UPDATE album_photos SET status = 'approved'/.test(c.sql));
    expect(update).toBeDefined();
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('awards the weekly photo-challenge bonus on approval (SEC H1 — server-fixed points)', async () => {
    const db = dbWithPhoto();
    vi.mocked(getDb).mockReturnValue(db.client);
    const res = await POST(reviewReq('approve', await cookie('admin', { admin: true })), params);
    expect(res.status).toBe(200);
    const insert = bonusInsert(db);
    expect(insert).toBeDefined();
    // alias, date, points, title, created_at — points fixed at 50, challenge
    // resolved from the photo's week (2026-07-06 → Sommarens glass).
    expect(insert!.args[0]).toBe('maja');
    expect(insert!.args[2]).toBe(50);
    expect(insert!.args[3]).toBe('📸 Fotoutmaning: Sommarens glass');
  });

  it('never double-pays: a second approved photo the same week awards nothing', async () => {
    const db = dbWithPhoto({ bonusAlreadyPaid: true });
    vi.mocked(getDb).mockReturnValue(db.client);
    const res = await POST(reviewReq('approve', await cookie('admin', { admin: true })), params);
    expect(res.status).toBe(200);
    expect(bonusInsert(db)).toBeUndefined();
  });

  it('re-approving an already-approved photo is a no-op for the bonus', async () => {
    const db = dbWithPhoto({ status: 'approved' });
    vi.mocked(getDb).mockReturnValue(db.client);
    const res = await POST(reviewReq('approve', await cookie('admin', { admin: true })), params);
    expect(res.status).toBe(200);
    expect(bonusInsert(db)).toBeUndefined();
  });

  it('lets the admin reject a photo, deleting both bytes and row', async () => {
    const db = dbWithPhoto();
    vi.mocked(getDb).mockReturnValue(db.client);
    const res = await POST(reviewReq('reject', await cookie('admin', { admin: true })), params);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, status: 'rejected' });
    expect(storage.delete).toHaveBeenCalledWith('maja/2026-06-01/abc');
    expect(db.calls.some((c) => /DELETE FROM album_photos/.test(c.sql))).toBe(true);
  });

  it('rejects an unknown action with 400', async () => {
    vi.mocked(getDb).mockReturnValue(dbWithPhoto().client);
    const res = await POST(reviewReq('banish', await cookie('admin', { admin: true })), params);
    expect(res.status).toBe(400);
  });

  it('returns 404 for a missing photo', async () => {
    vi.mocked(getDb).mockReturnValue(createFakeDb().client);
    const res = await POST(reviewReq('approve', await cookie('admin', { admin: true })), params);
    expect(res.status).toBe(404);
  });
});
