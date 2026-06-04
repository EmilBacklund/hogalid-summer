import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { User } from '@/types';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));

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

const saveLog = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
const editLog = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
const savePenalty = { mutateAsync: vi.fn().mockResolvedValue(undefined) };
const recordSecretProgress = { mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue(undefined) };
vi.mock('@/hooks/useLogMutations', () => ({
  useLogMutations: () => ({ saveLog, editLog, savePenalty, recordSecretProgress }),
}));

import LogPage from './page';

beforeEach(() => vi.clearAllMocks());

describe('LogPage', () => {
  it('renders the Dagbok form', () => {
    render(<LogPage />);
    expect(screen.getByText('Dagbok 📕')).toBeInTheDocument();
    expect(screen.getByText('⚽ Träning')).toBeInTheDocument();
    expect(screen.getByText('☀️ Sommargrejer')).toBeInTheDocument();
  });

  it('blocks a below-threshold log and shows the warning', async () => {
    render(<LogPage />);
    fireEvent.change(screen.getByPlaceholderText('Antal min'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: /Spara/ }));
    expect(await screen.findByText(/Minst 5 minuter eller 30 touch/)).toBeInTheDocument();
    expect(saveLog.mutateAsync).not.toHaveBeenCalled();
  });

  it('saves a valid training log with server-bound fields', async () => {
    render(<LogPage />);
    fireEvent.change(screen.getByPlaceholderText('Antal min'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /Spara/ }));
    await waitFor(() => expect(saveLog.mutateAsync).toHaveBeenCalledTimes(1));
    const arg = saveLog.mutateAsync.mock.calls[0]![0];
    expect(arg.log).toMatchObject({
      exercises: [{ id: 'fritraning', value: 20 }],
      iceCream: 0,
      swim: 0,
      pages: 0,
    });
  });
});
