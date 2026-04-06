import { apiGet } from './api';

const CACHE_TTL = 120 * 1000; // 2 minutes

let cachedUsers = null;
let cacheTime = 0;

export function invalidateUsersCache() {
  cachedUsers = null;
  cacheTime = 0;
}

export async function fetchAllUsers() {
  const now = Date.now();
  if (cachedUsers && now - cacheTime < CACHE_TTL) {
    return cachedUsers;
  }
  const users = await apiGet('/users');
  cachedUsers = users;
  cacheTime = now;
  return users;
}
