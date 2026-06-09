import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';
import { signSession, SESSION_COOKIE } from '@/server/session';

function request(path: string, cookie?: string): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set('cookie', `${SESSION_COOKIE}=${encodeURIComponent(cookie)}`);
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
}

function demoRequest(path: string): NextRequest {
  const headers = new Headers();
  headers.set('cookie', 'hf_demo=1');
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
}

function location(res: Response): string | null {
  const loc = res.headers.get('location');
  return loc ? new URL(loc).pathname : null;
}

function locationUrl(res: Response): URL | null {
  const loc = res.headers.get('location');
  return loc ? new URL(loc) : null;
}

describe('middleware auth guard (SEC C1)', () => {
  it('redirects an unauthenticated user to /login', async () => {
    const res = await middleware(request('/profile'));
    expect(res.status).toBe(307);
    expect(location(res)).toBe('/login');
  });

  it('preserves an invite query string when bouncing to /login', async () => {
    const res = await middleware(request('/?invite=abc123'));
    expect(res.status).toBe(307);
    const url = locationUrl(res);
    expect(url?.pathname).toBe('/login');
    // The invite token must survive the redirect so the login page can pre-fill
    // and validate the code automatically.
    expect(url?.searchParams.get('invite')).toBe('abc123');
  });

  it('lets /login through when unauthenticated', async () => {
    const res = await middleware(request('/login'));
    expect(location(res)).toBeNull(); // NextResponse.next(), no redirect
  });

  it('bounces an authenticated user away from /login', async () => {
    const cookie = await signSession({ alias: 'maja', admin: false, iat: 1 });
    const res = await middleware(request('/login', cookie));
    expect(res.status).toBe(307);
    expect(location(res)).toBe('/');
  });

  it('allows an authenticated user onto a protected page', async () => {
    const cookie = await signSession({ alias: 'maja', admin: false, iat: 1 });
    const res = await middleware(request('/profile', cookie));
    expect(location(res)).toBeNull();
  });

  it('blocks a non-admin from /admin', async () => {
    const cookie = await signSession({ alias: 'maja', admin: false, iat: 1 });
    const res = await middleware(request('/admin', cookie));
    expect(res.status).toBe(307);
    expect(location(res)).toBe('/');
  });

  it('allows the admin onto /admin', async () => {
    const cookie = await signSession({ alias: 'admin', admin: true, iat: 1 });
    const res = await middleware(request('/admin', cookie));
    expect(location(res)).toBeNull();
  });

  it('lets a demo visitor (hf_demo cookie, no session) onto a protected page', async () => {
    const res = await middleware(demoRequest('/profile'));
    expect(location(res)).toBeNull();
  });

  it('still blocks a demo visitor from /admin (demo is never admin)', async () => {
    const res = await middleware(demoRequest('/admin'));
    expect(res.status).toBe(307);
    expect(location(res)).toBe('/login');
  });
});
