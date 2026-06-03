import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
  albumPhotosNeedsImageData: vi.fn(() => false),
}));

import { GET as getList, POST } from './route';
import { GET as getBytes, DELETE as deleteBytes } from './[id]/route';
import { getDb, albumPhotosNeedsImageData } from '@/server/db';
import { signSession, SESSION_COOKIE } from '@/server/session';
import { setPhotoStorageForTests, type PhotoStorage } from '@/server/photoStorage';
import { createFakeDb, type FakeDb } from '@/test/fakeDb';

async function cookie(alias: string, admin = false, role?: 'player' | 'leader'): Promise<string> {
  const value = await signSession({ alias, admin, iat: 1, ...(role ? { role } : {}) });
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}`;
}

const PNG = 'data:image/png;base64,AQIDBA==';

function uploadReq(cookieHeader?: string): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request('http://localhost/api/photos', {
    method: 'POST',
    headers,
    body: JSON.stringify({ imageData: PNG }),
  });
}

let storage: PhotoStorage & { put: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

beforeEach(() => {
  storage = {
    put: vi.fn(async () => {}),
    get: vi.fn(async () => new Uint8Array([1, 2, 3, 4]).buffer),
    delete: vi.fn(async () => {}),
  };
  setPhotoStorageForTests(storage);
});

afterEach(() => {
  setPhotoStorageForTests(null);
});

function useDb(db: FakeDb) {
  vi.mocked(getDb).mockReturnValue(db.client);
}

describe('POST /api/photos (SEC M1 — bytes to Blobs, metadata to DB)', () => {
  it('rejects unauthenticated uploads', async () => {
    useDb(createFakeDb());
    expect((await POST(uploadReq())).status).toBe(401);
  });

  it('rejects uploads from the admin (moderators curate, never publish)', async () => {
    useDb(createFakeDb());
    const res = await POST(uploadReq(await cookie('admin', true)));
    expect(res.status).toBe(403);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('rejects uploads from a leader account (moderators curate, never publish)', async () => {
    useDb(createFakeDb());
    const res = await POST(uploadReq(await cookie('coach', false, 'leader')));
    expect(res.status).toBe(403);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('stores bytes in blob storage and metadata in the DB', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /COUNT\(\*\) AS count FROM album_photos/.test(sql),
        result: { rows: [{ count: 0 } as never] },
      },
      { test: (sql) => /INSERT INTO album_photos/.test(sql), result: { lastInsertRowid: 42n } },
    ]);
    useDb(db);
    const res = await POST(uploadReq(await cookie('maja')));
    expect(res.status).toBe(201);
    expect(storage.put).toHaveBeenCalledOnce();
    const body = (await res.json()) as { photo: { id: number; url: string; status: string } };
    expect(body.photo.id).toBe(42);
    expect(body.photo.url).toBe('/api/photos/42');
    // New uploads await a leader's approval before the team can see them.
    expect(body.photo.status).toBe('pending');
    // The DB row holds a blob_key, never the image bytes, and lands as pending.
    const insert = db.calls.find((c) => /INSERT INTO album_photos/.test(c.sql));
    const blobKey = (insert!.args as unknown[])[1] as string;
    expect(blobKey).toContain('maja/');
    expect(insert!.sql).toMatch(/'pending'/);
  });

  it('supplies image_data on legacy DBs that still have the NOT NULL column', async () => {
    vi.mocked(albumPhotosNeedsImageData).mockReturnValueOnce(true);
    const db = createFakeDb([
      {
        test: (sql) => /COUNT\(\*\) AS count FROM album_photos/.test(sql),
        result: { rows: [{ count: 0 } as never] },
      },
      { test: (sql) => /INSERT INTO album_photos/.test(sql), result: { lastInsertRowid: 7n } },
    ]);
    useDb(db);
    const res = await POST(uploadReq(await cookie('maja')));
    expect(res.status).toBe(201);
    const insert = db.calls.find((c) => /INSERT INTO album_photos/.test(c.sql));
    expect(insert!.sql).toContain('image_data');
    // The trailing arg is the '' placeholder satisfying the legacy NOT NULL column.
    expect((insert!.args as unknown[]).at(-1)).toBe('');
  });

  it('enforces the weekly upload limit', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /COUNT\(\*\) AS count FROM album_photos/.test(sql),
        result: { rows: [{ count: 2 } as never] },
      },
    ]);
    useDb(db);
    const res = await POST(uploadReq(await cookie('maja')));
    expect(res.status).toBe(429);
    expect(storage.put).not.toHaveBeenCalled();
  });
});

describe('GET /api/photos/[id] (SEC M1 — auth-gated bytes)', () => {
  it('rejects unauthenticated byte requests', async () => {
    useDb(createFakeDb());
    const res = await getBytes(new Request('http://localhost/api/photos/5'), {
      params: Promise.resolve({ id: '5' }),
    });
    expect(res.status).toBe(401);
  });

  it('serves approved bytes with a private cache header for an authed user', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /SELECT .*blob_key.* FROM album_photos/.test(sql),
        result: {
          rows: [
            {
              alias: 'maja',
              blob_key: 'maja/2026-06-01/abc',
              mime_type: 'image/png',
              status: 'approved',
            } as never,
          ],
        },
      },
    ]);
    useDb(db);
    const res = await getBytes(
      new Request('http://localhost/api/photos/5', { headers: { cookie: await cookie('leo') } }),
      { params: Promise.resolve({ id: '5' }) },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toContain('private');
    expect(storage.get).toHaveBeenCalledWith('maja/2026-06-01/abc');
  });

  it('hides a pending photo from a non-owner (SEC — un-approved minors’ photos)', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /SELECT .*blob_key.* FROM album_photos/.test(sql),
        result: {
          rows: [
            {
              alias: 'maja',
              blob_key: 'maja/2026-06-01/abc',
              mime_type: 'image/png',
              status: 'pending',
            } as never,
          ],
        },
      },
    ]);
    useDb(db);
    const res = await getBytes(
      new Request('http://localhost/api/photos/5', { headers: { cookie: await cookie('leo') } }),
      { params: Promise.resolve({ id: '5' }) },
    );
    expect(res.status).toBe(404);
    expect(storage.get).not.toHaveBeenCalled();
  });

  it('serves a pending photo to its own uploader', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /SELECT .*blob_key.* FROM album_photos/.test(sql),
        result: {
          rows: [
            {
              alias: 'maja',
              blob_key: 'maja/2026-06-01/abc',
              mime_type: 'image/png',
              status: 'pending',
            } as never,
          ],
        },
      },
    ]);
    useDb(db);
    const res = await getBytes(
      new Request('http://localhost/api/photos/5', { headers: { cookie: await cookie('maja') } }),
      { params: Promise.resolve({ id: '5' }) },
    );
    expect(res.status).toBe(200);
    expect(storage.get).toHaveBeenCalledWith('maja/2026-06-01/abc');
  });
});

describe('GET /api/photos (album visibility)', () => {
  function listReq(cookieHeader?: string): Request {
    const headers: Record<string, string> = {};
    if (cookieHeader) headers.cookie = cookieHeader;
    return new Request('http://localhost/api/photos', { headers });
  }

  it('rejects unauthenticated listing', async () => {
    useDb(createFakeDb());
    expect((await getList(listReq())).status).toBe(401);
  });

  it('filters to approved-or-own at the SQL level, scoped to the caller', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /FROM album_photos/.test(sql),
        result: {
          rows: [
            {
              id: 1,
              alias: 'maja',
              mime_type: 'image/jpeg',
              week_start: '2026-06-01',
              uploaded_at: '2026-06-02T00:00:00.000Z',
              status: 'pending',
              display_name: 'Maja',
            } as never,
          ],
        },
      },
    ]);
    useDb(db);
    const res = await getList(listReq(await cookie('maja')));
    expect(res.status).toBe(200);
    // The query only exposes approved photos plus the caller's own, parameterised
    // with the caller's alias so it can never leak another player's pending shot.
    const select = db.calls.find((c) => /FROM album_photos/.test(c.sql));
    expect(select!.sql).toMatch(/status = 'approved' OR .*alias = \?/);
    expect((select!.args as unknown[])[0]).toBe('maja');
    const body = (await res.json()) as { photos: { id: number; status: string }[] };
    expect(body.photos[0]?.status).toBe('pending');
  });

  it('returns every photo (no status filter) for a moderator', async () => {
    const db = createFakeDb([
      { test: (sql) => /FROM album_photos/.test(sql), result: { rows: [] } },
    ]);
    useDb(db);
    const res = await getList(listReq(await cookie('admin', true)));
    expect(res.status).toBe(200);
    const select = db.calls.find((c) => /FROM album_photos/.test(c.sql));
    // Moderators get the whole album — no WHERE clause scoping by status/alias.
    expect(select!.sql).not.toMatch(/WHERE/);
  });
});

describe('DELETE /api/photos/[id] (admin gallery moderation)', () => {
  function delReq(id: string, cookieHeader?: string): Request {
    const headers: Record<string, string> = {};
    if (cookieHeader) headers.cookie = cookieHeader;
    return new Request(`http://localhost/api/photos/${id}`, { method: 'DELETE', headers });
  }

  it('rejects unauthenticated callers with 401', async () => {
    useDb(createFakeDb());
    const res = await deleteBytes(delReq('5'), { params: Promise.resolve({ id: '5' }) });
    expect(res.status).toBe(401);
  });

  it('rejects a plain player with 403', async () => {
    useDb(createFakeDb());
    const res = await deleteBytes(delReq('5', await cookie('maja')), {
      params: Promise.resolve({ id: '5' }),
    });
    expect(res.status).toBe(403);
  });

  it('lets the admin delete any photo, removing bytes and row', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /SELECT blob_key FROM album_photos/.test(sql),
        result: { rows: [{ blob_key: 'maja/2026-06-01/abc' } as never] },
      },
    ]);
    useDb(db);
    const res = await deleteBytes(delReq('5', await cookie('admin', true)), {
      params: Promise.resolve({ id: '5' }),
    });
    expect(res.status).toBe(200);
    expect(storage.delete).toHaveBeenCalledWith('maja/2026-06-01/abc');
    expect(db.calls.some((c) => /DELETE FROM album_photos/.test(c.sql))).toBe(true);
  });

  it('returns 404 for a missing photo', async () => {
    useDb(createFakeDb());
    const res = await deleteBytes(delReq('5', await cookie('admin', true)), {
      params: Promise.resolve({ id: '5' }),
    });
    expect(res.status).toBe(404);
  });
});
