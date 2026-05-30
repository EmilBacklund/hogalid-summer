import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BINGO } from '@/constants';
import type { User } from '@/types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const fakeUser: User = {
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
  useUser: () => ({ user: fakeUser, isAdmin: false, isAuthenticated: true, isLoading: false }),
}));

const markTile = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
const recordSecretProgress = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
vi.mock('@/hooks/useBingoMutations', () => ({
  useBingoMutations: () => ({ markTile, recordSecretProgress }),
}));

import BingoPage from './page';

beforeEach(() => vi.clearAllMocks());

describe('BingoPage', () => {
  it('renders the bingo screen with both boards and the stats card', () => {
    render(<BingoPage />);
    expect(screen.getByText('Sommarlovsbingo')).toBeInTheDocument();
    expect(screen.getByText('Bricka 1')).toBeInTheDocument();
    expect(screen.getByText('Bricka 2')).toBeInTheDocument();
    expect(screen.getByText('Bonusbingo')).toBeInTheDocument();
  });

  it('marks a classic-board tile done via the server (board=classic)', async () => {
    render(<BingoPage />);
    const firstTile = BINGO[0]!;
    // Expand the first challenge row, then confirm.
    fireEvent.click(screen.getByText(firstTile.label));
    fireEvent.click(screen.getByRole('button', { name: /Klart/ }));

    await waitFor(() => expect(markTile.mutateAsync).toHaveBeenCalledTimes(1));
    const arg = markTile.mutateAsync.mock.calls[0]![0];
    expect(arg.board).toBe('classic');
    expect(arg.challengeId).toBe(firstTile.id);
  });
});
