// Demo-mode isolation core (React-free on purpose — imported by the API choke
// point in `src/utils/api.ts`).
//
// Safety model — why this can never touch the real app:
//  1. The active flag lives in *sessionStorage*, which is per-tab. Opening a new
//     tab and signing in with a real account never inherits the demo flag.
//  2. Every real auth action (login / register / logout) calls `exitDemo()`
//     first, clearing the flag and the in-memory user.
//  3. While the flag is set, `request()` returns from `demoHandle` *before*
//     `fetch()` — the backend is physically unreachable, so no demo write can
//     ever reach the database. Writes only mutate the in-memory `demoUser`.
//  4. `exitDemo()` resets `demoUser` to a fresh clone, so nothing lingers.
//  5. A matching `hf_demo` *cookie* lets the route-guard middleware tell that a
//     visitor is in demo, so it stops bouncing them to /login. The cookie is
//     never a session — it's unsigned, grants no API access (every API route
//     still demands the real signed session and would 401), and /admin stays
//     blocked. It only relaxes the client-page guard so the demo pages, which
//     fetch their data from the in-memory fixture, are allowed to render.

import { DEMO_CONFIG, DEMO_PHOTOS, DEMO_TEAM_USERS, DEMO_USER } from './demoData';
import type { BingoBoardKey } from '@/hooks/useBingoMutations';
import type { AvatarConfig, User } from '@/types';

const DEMO_KEY = 'hf_demo';
/** Cookie the middleware reads — must match `DEMO_COOKIE` in middleware.ts. */
const DEMO_COOKIE = 'hf_demo';

/** True only in the browser tab that entered demo mode. SSR-safe. */
export function isDemoActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

// Session cookie (no Max-Age → cleared when the browser closes), scoped to the
// whole site, Lax so normal top-level navigations send it. Not HttpOnly — it
// carries no secret and the client sets it.
function setDemoCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${DEMO_COOKIE}=1; path=/; SameSite=Lax`;
}

function clearDemoCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${DEMO_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}

function freshUser(): User {
  // Structured clone so demo writes never mutate the shared fixture.
  return JSON.parse(JSON.stringify(DEMO_USER)) as User;
}

// The live, mutable demo player. Reset on every enter/exit so a previous demo
// session can never bleed into a new one.
let demoUser: User = freshUser();

export function enterDemo(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DEMO_KEY, '1');
  } catch {
    // ignore — demo just won't persist across reloads, which is fine.
  }
  setDemoCookie();
  demoUser = freshUser();
}

export function exitDemo(): void {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.removeItem(DEMO_KEY);
    } catch {
      // ignore
    }
  }
  clearDemoCookie();
  demoUser = freshUser();
}

/** Board key → the matching array field on the demo user. */
const BOARD_FIELD: Record<BingoBoardKey, 'bingo' | 'adultBingo' | 'bonusBingo' | 'bingoTwo'> = {
  classic: 'bingo',
  adult: 'adultBingo',
  bonus: 'bonusBingo',
  bingoTwo: 'bingoTwo',
};

type Body = Record<string, unknown> | undefined;

function parseBody(init?: RequestInit): Body {
  if (!init?.body || typeof init.body !== 'string') return undefined;
  try {
    return JSON.parse(init.body) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/**
 * Serve a request entirely from in-memory demo state. Called by `request()`
 * only when `isDemoActive()` — so a non-demo session never reaches this.
 */
export function demoHandle<T>(path: string, init?: RequestInit): T {
  const method = (init?.method ?? 'GET').toUpperCase();
  const [route] = path.split('?');
  const body = parseBody(init);

  if (method === 'GET') return demoGet<T>(route ?? path);
  return demoWrite<T>(route ?? path, body);
}

function demoGet<T>(route: string): T {
  switch (route) {
    case '/auth/me':
      return demoUser as unknown as T;
    case '/users':
      // Reflect the live demo user (its points may have changed) into the team.
      return DEMO_TEAM_USERS.map((u) => (u.alias === 'demo' ? demoUser : u)) as unknown as T;
    case '/config':
      return DEMO_CONFIG as unknown as T;
    case '/buddy-challenges':
    case '/cheers':
    case '/invites':
      return [] as unknown as T;
    case '/reactions':
      return {} as unknown as T;
    case '/photos':
    case '/photos/pending':
      return (route === '/photos/pending'
        ? { photos: [], nextOffset: null }
        : DEMO_PHOTOS) as unknown as T;
    default:
      return {} as unknown as T;
  }
}

function demoWrite<T>(route: string, body: Body): T {
  const ok = { ok: true } as unknown as T;

  switch (route) {
    case '/bingo': {
      const board = (body?.board as BingoBoardKey) ?? 'classic';
      const challengeId = body?.challengeId as string | undefined;
      const field = BOARD_FIELD[board];
      if (challengeId && field && !demoUser[field].includes(challengeId)) {
        demoUser[field] = [...demoUser[field], challengeId];
      }
      return ok;
    }
    case '/daily': {
      const challengeId = body?.challengeId as string | undefined;
      if (challengeId) {
        const today = new Date();
        const date =
          today.getFullYear() +
          '-' +
          String(today.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(today.getDate()).padStart(2, '0');
        demoUser.completedDaily = { ...demoUser.completedDaily, [date]: challengeId };
      }
      return ok;
    }
    case '/users/secret-progress': {
      const patch = (body?.patch as Record<string, unknown>) ?? {};
      demoUser.secretFlags = { ...demoUser.secretFlags, ...patch };
      return ok;
    }
    case '/users/display-name': {
      if (typeof body?.displayName === 'string') demoUser.displayName = body.displayName;
      return ok;
    }
    case '/auth/me': {
      // PUT — avatar / unlocks / highscores self-edits.
      if (body?.avatarConfig) demoUser.avatarConfig = body.avatarConfig as AvatarConfig;
      if (Array.isArray(body?.unlockedItems))
        demoUser.unlockedItems = body.unlockedItems as string[];
      if (body?.highscores) {
        demoUser.highscores = {
          ...demoUser.highscores,
          ...(body.highscores as Record<string, number>),
        };
      }
      return demoUser as unknown as T;
    }
    default:
      // Everything else (logs, photo upload, buddy challenges, cheers, …) is a
      // harmless no-op in demo — the UI either hides or disables these surfaces.
      return ok;
  }
}
