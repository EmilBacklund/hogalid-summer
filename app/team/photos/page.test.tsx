import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Photo, User } from '@/types';

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

let photos: Photo[] = [];
const upload = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
vi.mock('@/hooks/usePhotoAlbum', () => ({
  usePhotoAlbum: () => ({ photos, isLoading: false, loadingMore: false, upload }),
}));

import PhotoAlbumPage from './page';

beforeEach(() => {
  vi.clearAllMocks();
  photos = [];
});

describe('PhotoAlbumPage', () => {
  it('shows the empty state when there are no photos', () => {
    render(<PhotoAlbumPage />);
    expect(screen.getByText('Fotoalbumet')).toBeInTheDocument();
    expect(screen.getByText('Albumet väntar på första bilden')).toBeInTheDocument();
  });

  it('renders the uploaded photos as album pages', () => {
    photos = [
      {
        id: 1,
        alias: 'tova',
        uploaderName: 'Tova',
        mimeType: 'image/jpeg',
        weekStart: '2026-06-01',
        uploadedAt: '2026-06-02T00:00:00.000Z',
        date: '2026-06-02',
        url: '/api/photos/1',
      },
    ];
    render(<PhotoAlbumPage />);
    expect(screen.getByText('Tova')).toBeInTheDocument();
    expect(screen.getByText('Sida 1')).toBeInTheDocument();
  });
});
