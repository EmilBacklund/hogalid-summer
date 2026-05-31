import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Stats, User } from '@/types';

const push = vi.fn();
const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace, refresh: vi.fn() }) }));

const fakeUser: User = {
  alias: 'maja',
  displayAlias: 'Maja',
  role: 'player',
  avatarConfig: {},
  unlockedItems: [],
  highscores: {},
  secretFlags: {},
  joinedAt: null,
  photoCount: 0,
  logs: [],
  bingo: [],
  bonusBingo: [],
  bingoTwo: [],
  adultBingo: [],
  completedDaily: {},
};

const fakeStats: Stats = {
  totalPoints: 120,
  totalMinutes: 0,
  totalLogs: 0,
  totalTouch: 0,
  exerciseCounts: {},
  exerciseHighscores: {},
  streak: 3,
  maxStreak: 3,
  bingoCount: 0,
  bingoLines: 0,
  totalIceCream: 0,
  totalSwim: 0,
  totalPages: 0,
  photoCount: 0,
  iceCreamStreak: 0,
  swimStreak: 0,
  readStreak: 0,
};

vi.mock('@/providers/UserProvider', () => ({
  useUser: () => ({
    user: fakeUser,
    isAdmin: false,
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}));
vi.mock('@/hooks/useStats', () => ({ useStats: () => fakeStats }));
vi.mock('@/hooks/useConfig', () => ({
  useConfig: () => ({ data: { seasonStart: '2026-06-01', countdownDate: null } }),
}));
vi.mock('@/hooks/useAllUsers', () => ({
  useAllUsers: () => ({ data: [fakeUser], isLoading: false }),
}));
vi.mock('@/hooks/usePhotos', () => ({
  usePhotos: () => ({ data: { photos: [], nextOffset: null } }),
}));
vi.mock('@/hooks/useBuddyChallenges', () => ({ useBuddyChallenges: () => ({ data: [] }) }));
vi.mock('@/hooks/useCheers', () => ({
  useCheers: () => ({ cheers: [], markSeen: vi.fn(), sendCheer: vi.fn() }),
}));

import HomePage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('HomePage', () => {
  it('greets the signed-in player', () => {
    render(<HomePage />);
    expect(screen.getByText(/Hej, Maja!/)).toBeInTheDocument();
  });

  it('navigates to the log screen from the Dagbok button', () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole('button', { name: '📕 Dagbok' }));
    expect(push).toHaveBeenCalledWith('/log');
  });

  it('shows the bingo progress out of 50', () => {
    render(<HomePage />);
    expect(
      screen.getByRole('button', { name: /Sommarlovsbingo — 0\/50 klara/ }),
    ).toBeInTheDocument();
  });
});
