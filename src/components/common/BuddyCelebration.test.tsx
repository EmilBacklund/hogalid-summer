import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuddyCelebration } from './BuddyCelebration';
import type { BuddyChallenge, User } from '@/types';

const user = { alias: 'maja' } as User;
const challenge: BuddyChallenge = {
  id: 'bc1',
  fromAlias: 'maja',
  toAlias: 'leo',
  exerciseId: 'toetaps',
  amount: 100,
  status: 'completed',
  createdAt: '',
  acceptedAt: null,
  fromCompletedAt: null,
  toCompletedAt: null,
  fromProgress: 0,
  toProgress: 0,
};

describe('BuddyCelebration', () => {
  it('names the partner and closes on the button', () => {
    const onClose = vi.fn();
    render(<BuddyCelebration challenge={challenge} user={user} onClose={onClose} />);
    expect(screen.getByText('Grattis!')).toBeInTheDocument();
    expect(screen.getByText('leo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Awesome/ }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
