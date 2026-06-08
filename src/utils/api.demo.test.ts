import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost } from './api';
import { enterDemo, exitDemo } from '@/demo/demoMode';
import type { User } from '@/types';

const fetchSpy = vi.spyOn(globalThis, 'fetch');

beforeEach(() => {
  window.sessionStorage.clear();
  exitDemo();
  fetchSpy.mockReset();
  fetchSpy.mockResolvedValue(new Response('{}', { status: 200 }));
});

afterEach(() => exitDemo());

describe('api.ts demo short-circuit (the real backend must be unreachable)', () => {
  it('reads come from the demo handler without ever calling fetch', async () => {
    enterDemo();
    const me = await apiGet<User>('/auth/me');
    expect(me.alias).toBe('demo');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('writes never reach the network in demo', async () => {
    enterDemo();
    await apiPost('/bingo', { board: 'classic', challengeId: 'b50' });
    await apiPost('/logs', { log: {} });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('falls through to fetch when demo is inactive', async () => {
    await apiGet('/auth/me');
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
