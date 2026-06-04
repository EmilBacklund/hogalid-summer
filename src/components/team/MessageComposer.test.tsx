import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { TeamMessage } from '@/types';

let messages: TeamMessage[] = [];
const post = {
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
  isError: false,
};
const remove = { mutate: vi.fn(), isPending: false };

vi.mock('@/hooks/useTeamMessages', () => ({
  useTeamMessages: () => ({ messages, post, remove }),
}));

import { MessageComposer } from './MessageComposer';

beforeEach(() => {
  vi.clearAllMocks();
  messages = [];
});

describe('MessageComposer', () => {
  it('disables send until something is typed', () => {
    render(<MessageComposer />);
    const send = screen.getByRole('button', { name: 'Skicka' });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Skriv ett kort meddelande/), {
      target: { value: 'Träning imorgon!' },
    });
    expect(send).toBeEnabled();
  });

  it('posts the trimmed message and clears the field', async () => {
    render(<MessageComposer />);
    const textarea = screen.getByPlaceholderText(
      /Skriv ett kort meddelande/,
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '  Bra kämpat!  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Skicka' }));
    expect(post.mutateAsync).toHaveBeenCalledWith('Bra kämpat!');
    await waitFor(() => expect(textarea.value).toBe(''));
  });

  it('lists existing messages with a delete button', () => {
    messages = [
      {
        id: 3,
        alias: 'tova',
        authorName: 'Tränare Tova',
        body: 'Matchdag på lördag!',
        createdAt: '2026-06-03T10:00:00.000Z',
      },
    ];
    render(<MessageComposer />);
    expect(screen.getByText('Matchdag på lördag!')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ta bort meddelande' }));
    expect(remove.mutate).toHaveBeenCalledWith(3);
  });
});
