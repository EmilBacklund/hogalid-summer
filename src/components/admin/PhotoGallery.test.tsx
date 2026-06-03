import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Photo } from '@/types';

const approve = { mutate: vi.fn(), isPending: false, variables: undefined as number | undefined };
const remove = { mutate: vi.fn(), isPending: false, variables: undefined as number | undefined };
let photos: Photo[] = [];

vi.mock('@/hooks/useAdminPhotos', () => ({
  useAdminPhotos: () => ({ photos, isLoading: false, remove, approve }),
}));

import { PhotoGallery } from './PhotoGallery';

function photo(id: number, status: Photo['status']): Photo {
  return {
    id,
    alias: 'maja',
    uploaderName: 'Maja',
    mimeType: 'image/jpeg',
    weekStart: '2026-06-01',
    uploadedAt: '2026-06-03T10:00:00.000Z',
    date: '2026-06-03',
    url: `/api/photos/${id}`,
    status,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  photos = [photo(1, 'pending'), photo(2, 'approved')];
});

describe('PhotoGallery', () => {
  it('approves a pending photo directly from the gallery', () => {
    render(<PhotoGallery />);
    fireEvent.click(screen.getByText(/Lagets foton/));
    fireEvent.click(screen.getByLabelText('Godkänn'));
    expect(approve.mutate).toHaveBeenCalledWith(1);
  });

  it('only offers an approve button on pending photos', () => {
    render(<PhotoGallery />);
    fireEvent.click(screen.getByText(/Lagets foton/));
    // One pending photo → exactly one approve control.
    expect(screen.getAllByLabelText('Godkänn')).toHaveLength(1);
    // Both photos can still be removed.
    expect(screen.getAllByLabelText('Ta bort')).toHaveLength(2);
  });
});
