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

let userCtx = {
  user: fakeUser,
  isAdmin: false,
  isLeader: false,
  isAuthenticated: true,
  isLoading: false,
};
vi.mock('@/providers/UserProvider', () => ({
  useUser: () => userCtx,
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
  userCtx = {
    user: fakeUser,
    isAdmin: false,
    isLeader: false,
    isAuthenticated: true,
    isLoading: false,
  };
});

describe('PhotoAlbumPage', () => {
  it('shows the empty state when there are no photos', () => {
    render(<PhotoAlbumPage />);
    expect(screen.getByText('Fotoalbumet')).toBeInTheDocument();
    expect(screen.getByText('Albumet väntar på första bilden')).toBeInTheDocument();
  });

  it('lets a player upload (shows the upload control)', () => {
    render(<PhotoAlbumPage />);
    expect(screen.getByText('Lägg till bild')).toBeInTheDocument();
  });

  it('hides the upload control from leaders (they curate, never upload)', () => {
    userCtx = { ...userCtx, isLeader: true };
    render(<PhotoAlbumPage />);
    expect(screen.queryByText('Lägg till bild')).not.toBeInTheDocument();
    expect(screen.queryByText(/uppladdning/)).not.toBeInTheDocument();
    // The album itself is still visible to them.
    expect(screen.getByText('Fotoalbumet')).toBeInTheDocument();
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
        status: 'approved',
        url: '/api/photos/1',
      },
    ];
    render(<PhotoAlbumPage />);
    expect(screen.getByText('Tova')).toBeInTheDocument();
    expect(screen.getByText('Sida 1')).toBeInTheDocument();
  });
});
