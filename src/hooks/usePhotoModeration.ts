import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/utils/api';
import type { Photo } from '@/types';

interface PendingPhotosPage {
  photos: Photo[];
}

/**
 * The moderation queue for leaders/admin: photos awaiting approval plus the
 * approve/reject actions. Both actions invalidate the album (`['photos']`) so
 * an approved photo appears for the team, and the pending queue so it clears.
 * Only call this from a moderator view — the endpoints enforce `requireLeader`.
 */
export function usePhotoModeration(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['photos', 'pending'],
    queryFn: () => apiGet<PendingPhotosPage>('/photos/pending'),
    enabled,
    staleTime: 15_000,
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['photos'] });
  }

  const approve = useMutation({
    mutationFn: (id: number) => apiPost(`/photos/${id}/review`, { action: 'approve' }),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: (id: number) => apiPost(`/photos/${id}/review`, { action: 'reject' }),
    onSuccess: invalidate,
  });

  return {
    pending: query.data?.photos ?? [],
    isLoading: query.isLoading,
    approve,
    reject,
  };
}
