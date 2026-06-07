import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPost } from '@/utils/api';
import type { Photo, PhotosPage } from '@/types';

/**
 * The full album for admin moderation. Because the caller is a moderator, the
 * `/photos` endpoint returns every photo (including pending), newest first; all
 * pages are pulled so the gallery shows the whole album. `remove` deletes a
 * photo (bytes + row) and invalidates the album so it disappears everywhere.
 * Only call from an admin/leader view — the endpoints enforce the gating.
 */
export function useAdminPhotos(enabled = true) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['photos', 'admin'],
    queryFn: ({ pageParam }) => apiGet<PhotosPage>(`/photos?offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset,
    enabled,
    staleTime: 15_000,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    if (enabled && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [enabled, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const photos: Photo[] = query.data?.pages.flatMap((p) => p.photos) ?? [];

  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/photos/${id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });

  // Approve a still-pending photo straight from the gallery, so the admin
  // doesn't have to bounce to the team page to publish one.
  const approve = useMutation({
    mutationFn: (id: number) => apiPost(`/photos/${id}/review`, { action: 'approve' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });

  return {
    photos,
    isLoading: query.isLoading,
    remove,
    approve,
  };
}
