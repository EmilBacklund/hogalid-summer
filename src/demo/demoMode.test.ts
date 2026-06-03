import { beforeEach, describe, expect, it } from 'vitest';
import { demoHandle, enterDemo, exitDemo, isDemoActive } from './demoMode';
import { DEMO_USER } from './demoData';
import type { PhotosPage, User } from '@/types';

beforeEach(() => {
  window.sessionStorage.clear();
  exitDemo();
});

describe('demo flag (per-tab sessionStorage isolation)', () => {
  it('is inactive by default', () => {
    expect(isDemoActive()).toBe(false);
  });

  it('enterDemo sets the flag and exitDemo clears it', () => {
    enterDemo();
    expect(isDemoActive()).toBe(true);
    exitDemo();
    expect(isDemoActive()).toBe(false);
  });

  it('lives in sessionStorage (per-tab), never localStorage', () => {
    enterDemo();
    expect(window.sessionStorage.getItem('hf_demo')).toBe('1');
    expect(window.localStorage.getItem('hf_demo')).toBeNull();
  });

  it('sets an hf_demo cookie so the route guard lets the demo pages load', () => {
    expect(document.cookie).not.toContain('hf_demo=1');
    enterDemo();
    expect(document.cookie).toContain('hf_demo=1');
    exitDemo();
    expect(document.cookie).not.toContain('hf_demo=1');
  });
});

describe('demoHandle GET routing', () => {
  beforeEach(() => enterDemo());

  it('serves the demo user from /auth/me', () => {
    const me = demoHandle<User>('/auth/me');
    expect(me.alias).toBe('demo');
    expect(me.role).toBe('player');
  });

  it('serves the team from /users including the demo player', () => {
    const users = demoHandle<User[]>('/users');
    expect(users.some((u) => u.alias === 'demo')).toBe(true);
    expect(users.length).toBeGreaterThan(1);
  });

  it('serves only approved data-URL photos from /photos', () => {
    const page = demoHandle<PhotosPage>('/photos?offset=0');
    expect(page.photos.length).toBeGreaterThan(0);
    for (const p of page.photos) {
      expect(p.status).toBe('approved');
      expect(p.url.startsWith('data:')).toBe(true);
    }
  });

  it('serves empty collections for buddy-challenges / cheers', () => {
    expect(demoHandle('/buddy-challenges')).toEqual([]);
    expect(demoHandle('/cheers')).toEqual([]);
  });
});

describe('demoHandle writes mutate only the in-memory user', () => {
  beforeEach(() => enterDemo());

  it('marks a bingo tile and reflects it on the next /auth/me', () => {
    demoHandle('/bingo', {
      method: 'POST',
      body: JSON.stringify({ board: 'classic', challengeId: 'b50' }),
    });
    const me = demoHandle<User>('/auth/me');
    expect(me.bingo).toContain('b50');
  });

  it('updates the display name', () => {
    demoHandle('/users/display-name', {
      method: 'PUT',
      body: JSON.stringify({ displayName: 'Ny Demo' }),
    });
    expect(demoHandle<User>('/auth/me').displayName).toBe('Ny Demo');
  });

  it('updates avatar config via PUT /auth/me', () => {
    demoHandle('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ avatarConfig: { hair: 'long08' } }),
    });
    expect(demoHandle<User>('/auth/me').avatarConfig.hair).toBe('long08');
  });

  it('resets the in-memory user on exitDemo (nothing lingers)', () => {
    demoHandle('/bingo', {
      method: 'POST',
      body: JSON.stringify({ board: 'classic', challengeId: 'b50' }),
    });
    exitDemo();
    enterDemo();
    expect(demoHandle<User>('/auth/me').bingo).not.toContain('b50');
    expect(demoHandle<User>('/auth/me').bingo).toEqual(DEMO_USER.bingo);
  });

  it('never mutates the shared DEMO_USER fixture', () => {
    const before = JSON.stringify(DEMO_USER.bingo);
    demoHandle('/bingo', {
      method: 'POST',
      body: JSON.stringify({ board: 'classic', challengeId: 'bXX' }),
    });
    expect(JSON.stringify(DEMO_USER.bingo)).toBe(before);
  });
});
