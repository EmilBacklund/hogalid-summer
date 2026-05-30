import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
}));

import { POST } from './route';
import { GET as getBytes } from './[id]/route';
import { getDb } from '@/server/db';
import { signSession, SESSION_COOKIE } from '@/server/session';
import { setPhotoStorageForTests, type PhotoStorage } from '@/server/photoStorage';
import { createFakeDb, type FakeDb } from '@/test/fakeDb';

async function cookie(alias: string, admin = false): Promise<string> {
  const value = await signSession({ alias, admin, iat: 1 });
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
    const body = (await res.json()) as { photo: { id: number; url: string } };
    expect(body.photo.id).toBe(42);
    expect(body.photo.url).toBe('/api/photos/42');
    // The DB row holds a blob_key, never the image bytes.
    const insert = db.calls.find((c) => /INSERT INTO album_photos/.test(c.sql));
    const blobKey = (insert!.args as unknown[])[1] as string;
    expect(blobKey).toContain('maja/');
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

  it('serves bytes with a private cache header for an authed user', async () => {
    const db = createFakeDb([
      {
        test: (sql) => /SELECT blob_key, mime_type FROM album_photos/.test(sql),
        result: { rows: [{ blob_key: 'maja/2026-06-01/abc', mime_type: 'image/png' } as never] },
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
});
