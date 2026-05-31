import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
vi.mock('@/hooks/useAllUsers', () => ({ useAllUsers: () => ({ data: [fakeUser] }) }));
const updateDisplayName = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
vi.mock('@/hooks/useProfileMutations', () => ({
  useProfileMutations: () => ({
    updateAvatar: { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false },
    unlockItems: { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false },
    updateDisplayName,
  }),
}));

import ProfilePage from './page';

beforeEach(() => vi.clearAllMocks());

describe('ProfilePage', () => {
  it('shows the display name and the avatar tab by default', () => {
    render(<ProfilePage />);
    // "Maja" shows in both the TopBar pill and the profile header.
    expect(screen.getAllByText('Maja').length).toBeGreaterThan(0);
    expect(screen.getByText('Belöningar')).toBeInTheDocument();
  });

  it('switches to the Stats tab', () => {
    render(<ProfilePage />);
    fireEvent.click(screen.getByRole('button', { name: /Stats/ }));
    expect(screen.getByText('Streaks')).toBeInTheDocument();
    expect(screen.getByText('Totalt')).toBeInTheDocument();
  });
});
