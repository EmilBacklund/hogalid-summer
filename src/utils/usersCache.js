import { apiGet } from './api';

const CACHE_TTL = 120 * 1000; // 2 minutes
const LS_KEY = 'hogalid_users_cache';

// In-memory layer (fast, no serialization cost for within-session use)
let cachedUsers = null;
let cacheTime = 0;
let inflightPromise = null;

// Hydrate from localStorage on first module load (survives page reload)
try {
  const stored = localStorage.getItem(LS_KEY);
  if (stored) {
    const { users, time } = JSON.parse(stored);
    if (users && time && Date.now() - time < CACHE_TTL) {
      cachedUsers = users;
      cacheTime = time;
    }
  }
} catch (e) { /* ignore corrupt storage */ }

function persist(users, time) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ users, time }));
  } catch (e) { /* ignore quota errors */ }
}

export function invalidateUsersCache() {
  cachedUsers = null;
  cacheTime = 0;
  try { localStorage.removeItem(LS_KEY); } catch (e) {}
}

// Returns cached data immediately if available, triggers a background refresh
// only if the cache is older than TTL. Calls onChange(newData) when fresh data
// arrives and differs from the current cache.
export function fetchAllUsersStale(onChange) {
  const cacheIsFresh = cachedUsers && (Date.now() - cacheTime < CACHE_TTL);

  if (!cacheIsFresh && !inflightPromise) {
    inflightPromise = apiGet('/users')
      .then(users => {
        const changed = JSON.stringify(users) !== JSON.stringify(cachedUsers);
        cachedUsers = users;
        cacheTime = Date.now();
        persist(users, cacheTime);
        if (changed) onChange(users);
        return users;
      })
      .catch(() => {})
      .finally(() => { inflightPromise = null; });
  }

  return cachedUsers;
}

// Blocking fetch — for places that need fresh data (e.g. after saving a log).
export async function fetchAllUsers() {
  const now = Date.now();
  if (cachedUsers && now - cacheTime < CACHE_TTL) {
    return cachedUsers;
  }
  if (inflightPromise) return inflightPromise;
  inflightPromise = apiGet('/users')
    .then(users => {
      cachedUsers = users;
      cacheTime = Date.now();
      persist(users, cacheTime);
      return users;
    })
    .finally(() => { inflightPromise = null; });
  return inflightPromise;
}
