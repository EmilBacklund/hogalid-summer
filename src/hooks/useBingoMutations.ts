import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/utils/api';
import type { SecretFlags } from '@/types';

/** Server board identifiers (see src/server/points.ts BingoBoard). */
export type BingoBoardKey = 'classic' | 'adult' | 'bonus' | 'bingoTwo';

export interface MarkTileInput {
  board: BingoBoardKey;
  challengeId: string;
  /** Client-computed line-completion bonus; the server clamps it (SEC H1). */
  lineBonus?: number;
  lineTitle?: string;
}

/**
 * Bingo writes. Marking a tile is server-authoritative (SEC H1): the per-tile
 * bonus is awarded from constants and the reported line bonus is clamped; the
 * mark is idempotent. Discovering the secret adult board flips a secret flag.
 */
export function useBingoMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
    ]);

  const markTile = useMutation({
    mutationFn: (input: MarkTileInput) => apiPost('/bingo', input),
    onSuccess: invalidate,
  });

  const recordSecretProgress = useMutation({
    mutationFn: (patch: Partial<SecretFlags>) => apiPost('/users/secret-progress', { patch }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  return { markTile, recordSecretProgress };
}
