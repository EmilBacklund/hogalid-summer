import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
}));

import { GET, POST, DELETE } from './route';
import { getDb } from '@/server/db';
import { signSession, SESSION_COOKIE } from '@/server/session';
import { createFakeDb, type FakeDb } from '@/test/fakeDb';

async function cookie(alias: string, admin = false, role?: 'player' | 'leader'): Promise<string> {
  const value = await signSession({ alias, admin, iat: 1, ...(role ? { role } : {}) });
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}`;
}

function getReq(cookieHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request('http://localhost/api/messages', { headers });
}

function postReq(body: unknown, cookieHeader?: string): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request('http://localhost/api/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function deleteReq(id: string, cookieHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (cookieHeader) headers.cookie = cookieHeader;
  return new Request(`http://localhost/api/messages?id=${id}`, { method: 'DELETE', headers });
}

function useDb(db: FakeDb) {
  vi.mocked(getDb).mockReturnValue(db.client);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('/api/messages — leader announcements', () => {
  it('GET requires a signed-in user', async () => {
    useDb(createFakeDb());
    expect((await GET(getReq())).status).toBe(401);
  });

  it('GET returns messages with the resolved author name', async () => {
    const db = createFakeDb([
      {
        test: (sql) => sql.includes('FROM team_messages'),
        result: {
          rows: [
            {
              id: 1,
              alias: 'tova',
              body: 'Träning imorgon kl 18!',
              created_at: '2026-06-03T10:00:00.000Z',
              display_name: 'Tränare Tova',
              display_alias: 'Tova',
            },
          ] as never,
        },
      },
    ]);
    useDb(db);
    const res = await GET(getReq(await cookie('maja')));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { messages: { authorName: string; body: string }[] };
    expect(json.messages[0]!.authorName).toBe('Tränare Tova');
    expect(json.messages[0]!.body).toBe('Träning imorgon kl 18!');
  });

  it('POST rejects a player (non-moderator) with 403', async () => {
    const db = createFakeDb();
    useDb(db);
    const res = await POST(postReq({ body: 'hej' }, await cookie('maja', false, 'player')));
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO team_messages'))).toBe(false);
  });

  it('POST lets a leader create a message', async () => {
    const db = createFakeDb([
      {
        test: (sql) => sql.includes('INSERT INTO team_messages'),
        result: { lastInsertRowid: 7n },
      },
    ]);
    useDb(db);
    const res = await POST(
      postReq({ body: '  Bra kämpat allihop!  ' }, await cookie('tova', false, 'leader')),
    );
    expect(res.status).toBe(201);
    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO team_messages'));
    expect(insert).toBeTruthy();
    // Body is trimmed by the schema before insert.
    expect(insert!.args[1]).toBe('Bra kämpat allihop!');
    expect(insert!.args[0]).toBe('tova');
  });

  it('POST lets the admin create a message', async () => {
    const db = createFakeDb([
      { test: (sql) => sql.includes('INSERT INTO team_messages'), result: { lastInsertRowid: 1n } },
    ]);
    useDb(db);
    const res = await POST(postReq({ body: 'Välkomna!' }, await cookie('admin', true)));
    expect(res.status).toBe(201);
  });

  it('POST rejects an empty body with 400', async () => {
    const db = createFakeDb();
    useDb(db);
    const res = await POST(postReq({ body: '   ' }, await cookie('tova', false, 'leader')));
    expect(res.status).toBe(400);
  });

  it('DELETE removes a message by id (moderator only)', async () => {
    const db = createFakeDb();
    useDb(db);
    const res = await DELETE(deleteReq('7', await cookie('tova', false, 'leader')));
    expect(res.status).toBe(200);
    const del = db.calls.find((c) => c.sql.includes('DELETE FROM team_messages'));
    expect(del!.args[0]).toBe(7);
  });

  it('DELETE rejects a player with 403', async () => {
    const db = createFakeDb();
    useDb(db);
    const res = await DELETE(deleteReq('7', await cookie('maja', false, 'player')));
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM team_messages'))).toBe(false);
  });
});
