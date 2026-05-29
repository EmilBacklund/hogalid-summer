import { apiGet } from './api';
import type { Photo } from '../types';

const CACHE_TTL = 120 * 1000;
const LS_KEY = 'hogalid_photos_cache';

let cachedPhotos: Photo[] | null = null;
let cacheTime = 0;
let inflightPromise: Promise<Photo[]> | null = null;

try {
  const stored = localStorage.getItem(LS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored) as { photos?: Photo[]; time?: number };
    if (parsed.photos && parsed.time && Date.now() - parsed.time < CACHE_TTL) {
      cachedPhotos = parsed.photos;
      cacheTime = parsed.time;
    }
  }
} catch {
  /* ignore corrupt storage / no localStorage (SSR) */
}

function persist(photos: Photo[], time: number): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ photos, time }));
  } catch {
    /* ignore quota issues */
  }
}

export function invalidatePhotosCache(): void {
  cachedPhotos = null;
  cacheTime = 0;
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

export function fetchTeamPhotosStale(onChange: (photos: Photo[]) => void): Photo[] | null {
  const cacheIsFresh = cachedPhotos && Date.now() - cacheTime < CACHE_TTL;

  if (!cacheIsFresh && !inflightPromise) {
    inflightPromise = apiGet<Photo[]>('/photos')
      .then((photos) => {
        const changed = JSON.stringify(photos) !== JSON.stringify(cachedPhotos);
        cachedPhotos = photos;
        cacheTime = Date.now();
        persist(photos, cacheTime);
        if (changed) onChange(photos);
        return photos;
      })
      .catch(() => [] as Photo[])
      .finally(() => {
        inflightPromise = null;
      });
  }

  return cachedPhotos;
}

export async function fetchTeamPhotos(): Promise<Photo[]> {
  const now = Date.now();
  if (cachedPhotos && now - cacheTime < CACHE_TTL) {
    return cachedPhotos;
  }
  if (inflightPromise) return inflightPromise;
  inflightPromise = apiGet<Photo[]>('/photos')
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
