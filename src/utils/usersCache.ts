import { apiGet } from './api';
import { isDemoActive } from '../demo/demoMode';
import type { User } from '../types';

const CACHE_TTL = 120 * 1000; // 2 minutes
const LS_KEY = 'hogalid_users_cache';

// In-memory layer (fast, no serialization cost for within-session use)
let cachedUsers: User[] | null = null;
let cacheTime = 0;
let inflightPromise: Promise<User[]> | null = null;

// Hydrate from localStorage on first module load (survives page reload)
try {
  const stored = localStorage.getItem(LS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored) as { users?: User[]; time?: number };
    if (parsed.users && parsed.time && Date.now() - parsed.time < CACHE_TTL) {
      cachedUsers = parsed.users;
      cacheTime = parsed.time;
    }
  }
} catch {
  /* ignore corrupt storage / no localStorage (SSR) */
}

function persist(users: User[], time: number): void {
  // Never write demo team data to the persistent (cross-tab, 2-min) cache —
  // it must not survive into a real session on the same device.
  if (isDemoActive()) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ users, time }));
  } catch {
    /* ignore quota errors */
  }
}

export function invalidateUsersCache(): void {
  cachedUsers = null;
  cacheTime = 0;
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

// Returns cached data immediately if available, triggers a background refresh
// only if the cache is older than TTL. Calls onChange(newData) when fresh data
// arrives and differs from the current cache.
export function fetchAllUsersStale(onChange: (users: User[]) => void): User[] | null {
  // In demo, bypass the shared cache entirely: fetch fresh (the api layer
  // serves the demo fixture) and never read or write real-session data.
  if (isDemoActive()) {
    void apiGet<User[]>('/users')
      .then(onChange)
      .catch(() => {});
    return null;
  }

  const cacheIsFresh = cachedUsers && Date.now() - cacheTime < CACHE_TTL;

  if (!cacheIsFresh && !inflightPromise) {
    inflightPromise = apiGet<User[]>('/users')
      .then((users) => {
        const changed = JSON.stringify(users) !== JSON.stringify(cachedUsers);
        cachedUsers = users;
        cacheTime = Date.now();
        persist(users, cacheTime);
        if (changed) onChange(users);
        return users;
      })
      .catch(() => [] as User[])
      .finally(() => {
        inflightPromise = null;
      });
  }

  return cachedUsers;
}

// Blocking fetch — for places that need fresh data (e.g. after saving a log).
export async function fetchAllUsers(): Promise<User[]> {
  // In demo, always fetch fresh (intercepted to the demo fixture) and never
  // touch the shared cache.
  if (isDemoActive()) return apiGet<User[]>('/users');

  const now = Date.now();
  if (cachedUsers && now - cacheTime < CACHE_TTL) {
    return cachedUsers;
  }
  if (inflightPromise) return inflightPromise;
  inflightPromise = apiGet<User[]>('/users')
    .then((users) => {
      cachedUsers = users;
      cacheTime = Date.now();
      persist(users, cacheTime);
      return users;
    })
    .finally(() => {
      inflightPromise = null;
    });
  return inflightPromise;
}
