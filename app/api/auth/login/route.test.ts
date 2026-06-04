import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client } from '@libsql/client';

vi.mock('@/server/db', () => ({
  getDb: vi.fn(),
  initDb: vi.fn(async () => {}),
}));

import { POST } from './route';
import { getDb } from '@/server/db';
import { hashPassword } from '@/server/auth';
import { createFakeDb } from '@/test/fakeDb';
import { resetRateLimitForTests } from '@/server/rateLimit';

function loginReq(body: unknown, ip = '1.2.3.4'): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  resetRateLimitForTests();
  vi.mocked(getDb).mockReturnValue(createFakeDb().client);
  process.env.ADMIN_ALIAS = 'admin';
  process.env.ADMIN_PASSWORD = 'topsecret';
});

describe('POST /api/auth/login', () => {
  it('logs in the admin and sets a session cookie', async () => {
    const res = await POST(loginReq({ alias: 'admin', password: 'topsecret' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ alias: 'admin', isAdmin: true });
    expect(res.headers.get('set-cookie')).toContain('hf_session=');
    expect(res.headers.get('set-cookie')).toContain('HttpOnly');
  });

  it('rejects a wrong admin password with a generic error', async () => {
    const res = await POST(loginReq({ alias: 'admin', password: 'wrong' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('rejects an unknown user without leaking which field was wrong', async () => {
    vi.mocked(getDb).mockReturnValue(createFakeDb().client); // no rows
    const res = await POST(loginReq({ alias: 'ghost', password: 'x' }, '9.9.9.9'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('logs in a valid user and sets a session cookie', async () => {
    const hash = await hashPassword('secret');
    const db = createFakeDb([
      {
        test: (sql) => /SELECT password FROM users/.test(sql),
        result: { rows: [{ password: hash } as never] },
      },
      {
        test: (sql) => /SELECT \* FROM users WHERE alias/.test(sql),
        result: {
          rows: [{ alias: 'maja', display_alias: 'Maja', joined_at: '2026-05-01' } as never],
        },
      },
    ]);
    vi.mocked(getDb).mockReturnValue(db.client as unknown as Client);
    const res = await POST(loginReq({ alias: 'Maja', password: 'secret' }, '5.5.5.5'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ alias: 'maja' });
    expect(res.headers.get('set-cookie')).toContain('hf_session=');
  });

  it('rate-limits repeated attempts from the same client', async () => {
    let last = await POST(loginReq({ alias: 'admin', password: 'wrong' }, '7.7.7.7'));
    for (let i = 0; i < 12; i++) {
      last = await POST(loginReq({ alias: 'admin', password: 'wrong' }, '7.7.7.7'));
    }
    expect(last.status).toBe(429);
    expect(await last.json()).toEqual({ error: 'rate_limited' });
  });
});
