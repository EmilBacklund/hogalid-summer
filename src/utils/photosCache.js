import { apiGet } from './api';

const CACHE_TTL = 120 * 1000;
const LS_KEY = 'hogalid_photos_cache';

let cachedPhotos = null;
let cacheTime = 0;
let inflightPromise = null;

try {
  const stored = localStorage.getItem(LS_KEY);
  if (stored) {
    const { photos, time } = JSON.parse(stored);
    if (photos && time && Date.now() - time < CACHE_TTL) {
      cachedPhotos = photos;
      cacheTime = time;
    }
  }
} catch (e) {
  // Ignore cache parse issues
}

function persist(photos, time) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ photos, time }));
  } catch (e) {
    // Ignore quota issues
  }
}

export function invalidatePhotosCache() {
  cachedPhotos = null;
  cacheTime = 0;
  try {
    localStorage.removeItem(LS_KEY);
  } catch (e) {
    // ignore
  }
}

export function fetchTeamPhotosStale(onChange) {
  const cacheIsFresh = cachedPhotos && Date.now() - cacheTime < CACHE_TTL;

  if (!cacheIsFresh && !inflightPromise) {
    inflightPromise = apiGet('/photos')
      .then((photos) => {
        const changed = JSON.stringify(photos) !== JSON.stringify(cachedPhotos);
        cachedPhotos = photos;
        cacheTime = Date.now();
        persist(photos, cacheTime);
        if (changed) onChange(photos);
        return photos;
      })
      .catch(() => {})
      .finally(() => {
        inflightPromise = null;
      });
  }

  return cachedPhotos;
}

export async function fetchTeamPhotos() {
  const now = Date.now();
  if (cachedPhotos && now - cacheTime < CACHE_TTL) {
    return cachedPhotos;
  }
  if (inflightPromise) return inflightPromise;
  inflightPromise = apiGet('/photos')
    .then((photos) => {
      cachedPhotos = photos;
      cacheTime = Date.now();
      persist(photos, cacheTime);
      return photos;
    })
    .finally(() => {
      inflightPromise = null;
    });
  return inflightPromise;
}
