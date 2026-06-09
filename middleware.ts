import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionValue } from '@/server/session';

/** Unsigned flag the client sets in demo mode — must match `DEMO_COOKIE` in
 * src/demo/demoMode.ts. It is NOT a session: it grants no API access (every API
 * route still requires the real signed session) and never satisfies the admin
 * check below. It only lets a demo visitor past the page guard so the
 * client-rendered demo pages can load their in-memory fixture. */
const DEMO_COOKIE = 'hf_demo';

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
  const isDemo = req.cookies.get(DEMO_COOKIE)?.value === '1';

  if (pathname === '/login') {
    // Already signed in → no reason to see the login screen. (Demo visitors stay
    // free to revisit /login so they can leave the demo and sign in for real.)
    return session ? NextResponse.redirect(new URL('/', req.url)) : NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Admin always demands the real signed admin claim — demo never qualifies.
    if (!session?.admin) return NextResponse.redirect(new URL(session ? '/' : '/login', req.url));
    return NextResponse.next();
  }

  // Real session or a demo visitor may view the (client-rendered) app pages.
  if (!session && !isDemo) {
    // Preserve the query string so an invite link (`/?invite=<token>`) still
    // pre-fills + validates the code after the bounce to /login. Dropping it
    // forced new players to hunt for the code manually.
    const loginUrl = new URL('/login', req.url);
    loginUrl.search = req.nextUrl.search;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes, Next internals, and files with an extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
