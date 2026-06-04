import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/utils/api';

/** All feed reactions, shaped as { eventKey: { alias: emoji } }. */
export type ReactionMap = Record<string, Record<string, string>>;

/**
 * Feed reactions for the team activity feed. The acting alias is derived from
 * the cookie server-side (SEC C1); `toggle` optimistically flips the reaction in
 * the cache (passing `emoji: ''` removes it) and rolls back on error.
 */
export function useReactions(alias: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['reactions'],
    queryFn: () => apiGet<ReactionMap>('/reactions'),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ eventKey, emoji }: { eventKey: string; emoji: string }) =>
      apiPost('/reactions', { eventKey, emoji }),
    onMutate: async ({ eventKey, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['reactions'] });
      const prev = queryClient.getQueryData<ReactionMap>(['reactions']);
      queryClient.setQueryData<ReactionMap>(['reactions'], (old) => {
        const copy: ReactionMap = { ...(old ?? {}), [eventKey]: { ...(old?.[eventKey] ?? {}) } };
        if (!emoji) delete copy[eventKey]![alias];
        else copy[eventKey]![alias] = emoji;
        return copy;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['reactions'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['reactions'] }),
  });

  return {
    reactions: query.data ?? {},
    toggle: (eventKey: string, emoji: string) => mutation.mutate({ eventKey, emoji }),
  };
}
