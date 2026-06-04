import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPost } from '@/utils/api';
import type { TeamMessage } from '@/types';

interface MessagesResponse {
  messages: TeamMessage[];
}

/**
 * Leader/admin team announcements shown in the feed. Reading is open to any
 * signed-in user; `post`/`remove` are only honoured server-side for moderators.
 */
export function useTeamMessages() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['teamMessages'],
    queryFn: () => apiGet<MessagesResponse>('/messages'),
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['teamMessages'] });

  const post = useMutation({
    mutationFn: (body: string) => apiPost('/messages', { body }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiDelete(`/messages?id=${id}`, {}),
    onSuccess: invalidate,
  });

  return {
    messages: query.data?.messages ?? [],
    isLoading: query.isLoading,
    post,
    remove,
  };
}
