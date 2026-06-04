import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/utils/api';
import { fileToCompressedDataUrl } from '@/components/photos/compress';
import type { Photo, PhotosPage } from '@/types';

/**
 * The full team album: pages loaded via the paginated `/photos` endpoint and
 * accumulated until exhausted (the team is small enough to hold all at once).
 * `photos` is the flattened, newest-first list; `upload` compresses client-side
 * (SEC M1) then POSTs, invalidating the album on success.
 */
export function usePhotoAlbum() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['photos', 'album'],
    queryFn: ({ pageParam }) => apiGet<PhotosPage>(`/photos?offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset,
    staleTime: 30_000,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  // Pull every remaining page so the album shows all photos.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const photos: Photo[] = query.data?.pages.flatMap((p) => p.photos) ?? [];

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const imageData = await fileToCompressedDataUrl(file);
      return apiPost<{ ok: true; photo: Photo }>('/photos', { imageData, mimeType: 'image/jpeg' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['photos'] }),
  });

  return {
    photos,
    isLoading: query.isLoading,
    loadingMore: hasNextPage || isFetchingNextPage,
    upload,
  };
}
