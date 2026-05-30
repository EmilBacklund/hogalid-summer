import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@/types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const player: User = {
  alias: 'maja',
  displayAlias: 'Maja',
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
  useUser: () => ({ isAdmin: true, isLoading: false, logout: vi.fn() }),
}));
vi.mock('@/hooks/useAllUsers', () => ({
  useAllUsers: () => ({ data: [player], isLoading: false }),
}));
vi.mock('@/hooks/useConfig', () => ({
  useConfig: () => ({ data: { seasonStart: '2026-06-01', countdownDate: '2026-08-17' } }),
}));

const mutation = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
vi.mock('@/hooks/useAdmin', () => ({
  useInvites: () => ({ data: [] }),
  useAdminMutations: () => ({
    resetSeason: mutation,
    resetPassword: mutation,
    deleteUser: mutation,
    setSeasonStart: mutation,
    setCountdownDate: mutation,
    createInvite: mutation,
    updateInvite: mutation,
  }),
}));

import AdminPage from './page';

beforeEach(() => vi.clearAllMocks());

describe('AdminPage', () => {
  it('renders the admin dashboard with controls and player cards', () => {
    render(<AdminPage />);
    expect(screen.getByText('Admin — Högalid F15')).toBeInTheDocument();
    expect(screen.getByText(/Nollställ säsong/)).toBeInTheDocument();
    expect(screen.getByText('🔐 Inbjudningslänkar & koder')).toBeInTheDocument();
    expect(screen.getByText('maja')).toBeInTheDocument();
  });

  it('does not expose any plaintext-password display (SEC C2)', () => {
    render(<AdminPage />);
    // Only a reset action ("Byt"), never a "Visa" (show) password control.
    expect(screen.queryByText('Visa')).not.toBeInTheDocument();
    expect(screen.getByText('Byt')).toBeInTheDocument();
  });
});
