import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionValue } from '@/server/session';

/**
 * Route guard (SEC C1). Unauthenticated users are bounced to /login; /admin
 * additionally requires the signed `admin` claim. API routes enforce their own
 * auth and return JSON 401/403, so they are excluded from the matcher below
 * (redirecting a fetch to /login would break it).
 *
 * Runs on the edge — `verifySessionValue` uses Web Crypto only, no Node APIs.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySessionValue(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === '/login') {
    // Already signed in → no reason to see the login screen.
    return session ? NextResponse.redirect(new URL('/', req.url)) : NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!session.admin) return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals, and files with an extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
