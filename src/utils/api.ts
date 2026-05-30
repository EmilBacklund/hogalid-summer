// API helpers — talk to the backend Next.js Route Handlers under /api.
// Requests are same-origin and carry the httpOnly session cookie automatically.
export const API = '/api';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
