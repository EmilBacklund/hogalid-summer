import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Invite, User } from '@/types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));

const player: User = {
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

const invite: Invite = {
  id: 1,
  label: 'Maja',
  token: 'tok',
  code: 'F15-ABCD',
  status: 'used',
  clickedAt: null,
  usedAt: '2026-06-02T10:00:00.000Z',
  usedByAlias: 'maja',
  createdAt: '2026-06-01T10:00:00.000Z',
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
  useInvites: () => ({ data: [invite] }),
  useLeaders: () => ({ data: [] }),
  useAdminMutations: () => ({
    resetSeason: mutation,
    resetPassword: mutation,
    deleteUser: mutation,
    deleteLog: mutation,
    setSeasonStart: mutation,
    setCountdownDate: mutation,
    createInvite: mutation,
    updateInvite: mutation,
    createLeader: mutation,
  }),
}));
vi.mock('@/hooks/useAdminPhotos', () => ({
  useAdminPhotos: () => ({ photos: [], isLoading: false, remove: mutation, approve: mutation }),
}));
vi.mock('@/hooks/usePhotoModeration', () => ({
  usePhotoModeration: () => ({
    pending: [],
    isLoading: false,
    approve: mutation,
    reject: mutation,
  }),
}));
vi.mock('@/hooks/useTeamMessages', () => ({
  useTeamMessages: () => ({ messages: [], post: mutation, remove: mutation }),
}));

import AdminPage from './page';

beforeEach(() => vi.clearAllMocks());

describe('AdminPage', () => {
  it('renders the dashboard with the players tab active by default', () => {
    render(<AdminPage />);
    expect(screen.getByText('Admin — Högalid F15')).toBeInTheDocument();
    expect(screen.getByText(/Nollställ säsong/)).toBeInTheDocument();
    expect(screen.getByText('maja')).toBeInTheDocument();
    // The invite manager lives behind the other tab.
    expect(screen.queryByText('🔐 Inbjudningslänkar & koder')).not.toBeInTheDocument();
  });

  it('shows which invite a player signed up with', () => {
    render(<AdminPage />);
    expect(screen.getByText(/Inbjuden som/)).toBeInTheDocument();
    expect(screen.getByText('Maja')).toBeInTheDocument();
  });

  it('switches to the invites tab', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);
    await user.click(screen.getByText(/Inbjudningar/));
    expect(screen.getByText('🔐 Inbjudningslänkar & koder')).toBeInTheDocument();
  });

  it('does not expose any plaintext-password display (SEC C2)', () => {
    render(<AdminPage />);
    // Only a reset action ("Byt"), never a "Visa" (show) password control.
    expect(screen.queryByText('Visa')).not.toBeInTheDocument();
    expect(screen.getByText('Byt')).toBeInTheDocument();
  });
});
