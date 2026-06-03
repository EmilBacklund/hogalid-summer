import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
vi.mock('@/hooks/usePhotos', () => ({
  usePhotos: () => ({ data: { photos: [], nextOffset: null } }),
}));
vi.mock('@/hooks/useReactions', () => ({
  useReactions: () => ({ reactions: {}, toggle: vi.fn() }),
}));

import TeamPage from './page';

beforeEach(() => vi.clearAllMocks());

describe('TeamPage', () => {
  it('renders the team overview with roster and album cards', () => {
    render(<TeamPage />);
    expect(screen.getByText('Högalid F15 💪')).toBeInTheDocument();
    expect(screen.getByText('Lagets fotoalbum')).toBeInTheDocument();
    expect(screen.getByText('👥 Lagkompisar (1)')).toBeInTheDocument();
    expect(screen.getByText('Lagets totaler')).toBeInTheDocument();
  });
});
