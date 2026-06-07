import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Photo } from '@/types';

const approve = { mutate: vi.fn(), isPending: false, variables: undefined as number | undefined };
const reject = { mutate: vi.fn(), isPending: false, variables: undefined as number | undefined };
let pending: Photo[] = [];

vi.mock('@/hooks/usePhotoModeration', () => ({
  usePhotoModeration: () => ({ pending, isLoading: false, approve, reject }),
}));

import { PhotoModeration } from './PhotoModeration';

const photo: Photo = {
  id: 7,
  alias: 'maja',
  uploaderName: 'Maja',
  mimeType: 'image/jpeg',
  weekStart: '2026-06-01',
  uploadedAt: '2026-06-03T10:00:00.000Z',
  date: '2026-06-03',
  url: '/api/photos/7',
  status: 'pending',
};

beforeEach(() => {
  vi.clearAllMocks();
  pending = [photo];
});

describe('PhotoModeration', () => {
  it('renders nothing when the queue is empty', () => {
    pending = [];
    const { container } = render(<PhotoModeration />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the pending count as a banner', () => {
    render(<PhotoModeration />);
    expect(screen.getByText('Bilder att godkänna (1)')).toBeInTheDocument();
  });

  it('opens a full-size preview when the thumbnail is tapped and approves from there', () => {
    render(<PhotoModeration />);
    fireEvent.click(screen.getByLabelText('Visa foto av Maja'));
    // The preview overlay exposes its own large approve button.
    fireEvent.click(screen.getByText('Godkänn'));
    expect(approve.mutate).toHaveBeenCalledWith(7);
  });

  it('rejects from the preview overlay', () => {
    render(<PhotoModeration />);
    fireEvent.click(screen.getByLabelText('Visa foto av Maja'));
    fireEvent.click(screen.getByText('Avvisa'));
    expect(reject.mutate).toHaveBeenCalledWith(7);
  });
});
