import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPut } from '@/utils/api';

/**
 * Card-shop writes. Opening a pack appends the drawn card to the user's
 * `unlockedItems` (alias derived from the cookie via `PUT /api/auth/me`, SEC C1).
 * Coins are derived deterministically from points − pack costs (see
 * {@link computeCoins}), so there is no separate balance to persist. Invalidates
 * `['me']` + `['users']` so the balance and any leaderboard view re-derive.
 */
export function useCardMutations() {
  const queryClient = useQueryClient();

  const openPack = useMutation({
    /** Caller passes the full unlocked list (existing items + the new card id). */
    mutationFn: (unlockedItems: string[]) => apiPut('/auth/me', { unlockedItems }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['users'] }),
      ]),
  });

  return { openPack };
}
