import { describe, expect, it } from 'vitest';
import { getSession, signSession, verifySessionValue, SESSION_COOKIE } from './session';

describe('session signing', () => {
  it('round-trips a signed session', async () => {
    const value = await signSession({ alias: 'maja', admin: false, iat: 123 });
    const session = await verifySessionValue(value);
    expect(session).toEqual({ alias: 'maja', admin: false, iat: 123 });
  });

  it('preserves the admin claim', async () => {
    const value = await signSession({ alias: 'admin', admin: true, iat: 1 });
    expect((await verifySessionValue(value))?.admin).toBe(true);
  });

  it('rejects a tampered payload', async () => {
    const value = await signSession({ alias: 'maja', admin: false, iat: 1 });
    const [, sig] = value.split('.');
    // Swap in an admin payload while keeping the original signature.
    const forgedPayload = Buffer.from(JSON.stringify({ alias: 'maja', admin: true, iat: 1 }))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(await verifySessionValue(`${forgedPayload}.${sig}`)).toBeNull();
  });

  it('rejects a bad signature', async () => {
    const value = await signSession({ alias: 'maja', admin: false, iat: 1 });
    const [payload] = value.split('.');
    expect(await verifySessionValue(`${payload}.deadbeef`)).toBeNull();
  });

  it('rejects malformed / empty values', async () => {
    expect(await verifySessionValue(undefined)).toBeNull();
    expect(await verifySessionValue('')).toBeNull();
    expect(await verifySessionValue('nodot')).toBeNull();
  });

  it('reads the session from a request cookie header', async () => {
    const value = await signSession({ alias: 'leo', admin: false, iat: 5 });
    const req = new Request('http://localhost/api/auth/me', {
      headers: { cookie: `other=x; ${SESSION_COOKIE}=${encodeURIComponent(value)}` },
    });
    expect((await getSession(req))?.alias).toBe('leo');
  });

  it('returns null when no cookie is present', async () => {
    const req = new Request('http://localhost/api/auth/me');
    expect(await getSession(req)).toBeNull();
  });
});

describe('session role claim', () => {
  it('round-trips a leader role', async () => {
    const value = await signSession({
      alias: 'tranare-anna',
      admin: false,
      role: 'leader',
      iat: 1,
    });
    expect((await verifySessionValue(value))?.role).toBe('leader');
  });

  it('round-trips a player role', async () => {
    const value = await signSession({ alias: 'maja', admin: false, role: 'player', iat: 1 });
    expect((await verifySessionValue(value))?.role).toBe('player');
  });

  it('treats a legacy cookie with no role as role-less (backwards compatible)', async () => {
    const value = await signSession({ alias: 'maja', admin: false, iat: 1 });
    const parsed = await verifySessionValue(value);
    expect(parsed).not.toBeNull();
    expect(parsed?.role).toBeUndefined();
  });

  it('ignores an unknown/tampered role value', async () => {
    const value = await signSession({
      alias: 'maja',
      admin: false,
      // @ts-expect-error — exercising a malformed payload
      role: 'superadmin',
      iat: 1,
    });
    expect((await verifySessionValue(value))?.role).toBeUndefined();
  });
});
