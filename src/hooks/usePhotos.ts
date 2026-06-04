import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/api';
import type { PhotosPage } from '@/types';

/** First page of the team photo album (metadata + URLs, never bytes). */
export function usePhotos(offset = 0) {
  return useQuery({
    queryKey: ['photos', offset],
    queryFn: () => apiGet<PhotosPage>(`/photos?offset=${offset}`),
    staleTime: 30_000,
  });
}
