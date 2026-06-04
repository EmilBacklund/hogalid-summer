import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { User } from '@/types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

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

vi.mock('@/providers/UserProvider', () => ({
  useUser: () => ({ user: fakeUser, isAdmin: false, isAuthenticated: true, isLoading: false }),
}));
vi.mock('@/hooks/useConfig', () => ({
  useConfig: () => ({ data: { seasonStart: null, countdownDate: null } }),
}));
vi.mock('@/hooks/useAllUsers', () => ({
  useAllUsers: () => ({ data: [fakeUser], isLoading: false }),
}));
vi.mock('@/hooks/useBuddyChallenges', () => ({ useBuddyChallenges: () => ({ data: [] }) }));

const completeDaily = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
vi.mock('@/hooks/useChallengeMutations', () => ({
  useChallengeMutations: () => ({
    completeDaily,
    createBuddy: { mutateAsync: vi.fn().mockResolvedValue(undefined) },
    respondBuddy: { mutateAsync: vi.fn().mockResolvedValue(undefined) },
    cancelBuddy: { mutate: vi.fn() },
  }),
}));

import ChallengesPage from './page';

beforeEach(() => vi.clearAllMocks());

describe('ChallengesPage', () => {
  it('renders all three challenge sections', () => {
    render(<ChallengesPage />);
    expect(screen.getByText('Utmaningar ⚡')).toBeInTheDocument();
    expect(screen.getByText('📅 Dagens uppdrag')).toBeInTheDocument();
    expect(screen.getByText('🤝 Veckans lagutmaning')).toBeInTheDocument();
    expect(screen.getByText('🤝 Kompisutmaningar')).toBeInTheDocument();
  });

  it('completes the daily challenge', async () => {
    render(<ChallengesPage />);
    fireEvent.click(screen.getByRole('button', { name: /Jag har gjort det/ }));
    await waitFor(() => expect(completeDaily.mutateAsync).toHaveBeenCalledTimes(1));
    expect(typeof completeDaily.mutateAsync.mock.calls[0]![0]).toBe('string');
  });
});
