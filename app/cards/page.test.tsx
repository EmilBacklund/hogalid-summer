import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { Log, User } from '@/types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

/** A log carrying enough points to afford a pack (coins = points − spent). */
const richLog: Log = {
  id: 1,
  date: '2026-06-01',
  exercises: [],
  points: 400,
  minutes: 0,
  bingo: false,
  bingoFootball: false,
  dailyChallenge: false,
  iceCream: 0,
  swim: 0,
  pages: 0,
  title: '',
  createdAt: '2026-06-01T00:00:00.000Z',
};

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
  logs: [richLog],
  bingo: [],
  bonusBingo: [],
  bingoTwo: [],
  adultBingo: [],
  completedDaily: {},
};

vi.mock('@/providers/UserProvider', () => ({
  useUser: () => ({ user: fakeUser, isAdmin: false, isAuthenticated: true, isLoading: false }),
}));

const openPack = { mutate: vi.fn() };
vi.mock('@/hooks/useCardMutations', () => ({ useCardMutations: () => ({ openPack }) }));

import CardsPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

describe('CardsPage', () => {
  it('renders the shop header and coin balance', () => {
    render(<CardsPage />);
    expect(screen.getByText('Samlarkort')).toBeInTheDocument();
    expect(screen.getByText('400 mynt')).toBeInTheDocument();
  });

  it('opens a pack and unlocks the drawn card', () => {
    render(<CardsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Öppna kort/ }));
    // Advance through shake (1200ms) → reveal (2100ms) where the unlock fires.
    act(() => vi.advanceTimersByTime(2200));
    expect(openPack.mutate).toHaveBeenCalledTimes(1);
    const arg = openPack.mutate.mock.calls[0]![0] as string[];
    expect(arg).toHaveLength(1);
    expect(arg[0]).toMatch(/^card_/);
  });
});
