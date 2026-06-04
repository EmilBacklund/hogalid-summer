import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/utils/api';

/** A cheer addressed to the current user (sender + when), as served unseen. */
export interface Cheer {
  id: number;
  fromAlias: string;
  createdAt: string;
}

/**
 * The current user's unseen cheers plus the two cheer mutations. The sender is
 * derived from the cookie server-side (SEC C1) — `sendCheer` only needs a
 * target alias. `markSeen` optimistically drops the seen cheers from the cache.
 */
export function useCheers(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cheers'],
    queryFn: () => apiGet<Cheer[]>('/cheers'),
    enabled,
    staleTime: 30_000,
  });

  const markSeenMutation = useMutation({
    mutationFn: (ids: number[]) => apiPut('/cheers', { ids }),
    onSuccess: (_data, ids) => {
      queryClient.setQueryData<Cheer[]>(['cheers'], (prev) =>
        (prev ?? []).filter((c) => !ids.includes(c.id)),
      );
    },
  });

  const sendCheerMutation = useMutation({
    mutationFn: (toAlias: string) => apiPost('/cheers', { toAlias }),
  });

  return {
    cheers: query.data ?? [],
    markSeen: markSeenMutation.mutate,
    sendCheer: sendCheerMutation.mutate,
  };
}
