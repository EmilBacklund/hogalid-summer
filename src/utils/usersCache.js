import { apiGet } from './api';

const CACHE_TTL = 120 * 1000; // 2 minutes — show stale, revalidate in background

let cachedUsers = null;
let cacheTime = 0;
let inflightPromise = null;

export function invalidateUsersCache() {
  cachedUsers = null;
  cacheTime = 0;
}

// Returns cached data immediately if available (even if stale), and triggers
// a background refresh only if the cache is older than TTL. Calls
// onChange(newData) when fresh data arrives and differs from current cache.
export function fetchAllUsersStale(onChange) {
  const cacheIsFresh = cachedUsers && (Date.now() - cacheTime < CACHE_TTL);

  // Skip background fetch if cache is still fresh or a fetch is already running
  if (!cacheIsFresh && !inflightPromise) {
    inflightPromise = apiGet('/users')
      .then(users => {
        const changed = JSON.stringify(users) !== JSON.stringify(cachedUsers);
        cachedUsers = users;
        cacheTime = Date.now();
        if (changed) onChange(users);
        return users;
      })
      .catch(() => {})
      .finally(() => { inflightPromise = null; });
  }

  // Return stale data immediately if we have it
  return cachedUsers;
}

// Original blocking fetch — kept for places that need to await fresh data
// (e.g. after saving a log). Still respects TTL.
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
      return users;
    })
    .finally(() => { inflightPromise = null; });
  return inflightPromise;
}
