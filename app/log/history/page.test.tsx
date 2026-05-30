import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Log, User } from '@/types';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const log: Log = {
  id: 7,
  date: '2026-05-20',
  exercises: [{ id: 'toetaps', value: 50 }],
  points: 50,
  minutes: 0,
  bingo: false,
  bingoFootball: false,
  dailyChallenge: false,
  iceCream: 0,
  swim: 0,
  pages: 0,
  title: '',
  createdAt: '2026-05-20T10:00:00Z',
};

const fakeUser = {
  alias: 'maja',
  displayAlias: 'Maja',
  avatarConfig: {},
  unlockedItems: [],
  highscores: {},
  secretFlags: {},
  joinedAt: null,
  photoCount: 0,
  logs: [log],
  bingo: [],
  bonusBingo: [],
  bingoTwo: [],
  adultBingo: [],
  completedDaily: {},
} satisfies User;

vi.mock('@/providers/UserProvider', () => ({
  useUser: () => ({ user: fakeUser, isAdmin: false, isAuthenticated: true, isLoading: false }),
}));

const editLog = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
const deleteLog = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
vi.mock('@/hooks/useLogMutations', () => ({
  useLogMutations: () => ({ editLog, deleteLog }),
}));

import LogHistoryPage from './page';

beforeEach(() => vi.clearAllMocks());

describe('LogHistoryPage', () => {
  it('lists logged sessions', () => {
    render(<LogHistoryPage />);
    expect(screen.getByText('Mina träningar')).toBeInTheDocument();
    expect(screen.getByText('1 pass loggade')).toBeInTheDocument();
    expect(screen.getByText('📅 2026-05-20')).toBeInTheDocument();
  });

  it('deletes a log after confirmation', async () => {
    render(<LogHistoryPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Ta bort' }));
    fireEvent.click(screen.getByRole('button', { name: /Ja, ta bort/ }));
    await waitFor(() => expect(deleteLog.mutateAsync).toHaveBeenCalledWith(7));
  });
});
