// API helpers — talk to the backend Next.js Route Handlers under /api.
// Requests are same-origin and carry the httpOnly session cookie automatically.
import { demoHandle, isDemoActive } from '@/demo/demoMode';

export const API = '/api';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Demo mode short-circuits BEFORE any network call: while the per-tab demo
  // flag is set the backend is unreachable, so nothing a visitor does can ever
  // touch the real app's data. See src/demo/demoMode.ts for the safety model.
  if (isDemoActive()) return demoHandle<T>(path, init);
  const r = await fetch(`${API}${path}`, init);
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as T;
}

export function apiGet<T = unknown>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) });
}

export function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(body) });
}

export function apiDelete<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'DELETE', headers: JSON_HEADERS, body: JSON.stringify(body) });
}
