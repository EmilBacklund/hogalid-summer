import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiPost, apiPut } from '@/utils/api';
import type { SecretFlags } from '@/types';

/** A training-log payload. Points/minutes are recomputed server-side (SEC H1). */
export interface TrainingLogInput {
  date: string;
  exercises: { id: string; value: number }[];
  iceCream?: number;
  swim?: number;
  pages?: number;
}

/**
 * The log/profile write operations the Dagbok screen needs. Because points are
 * recomputed server-side (SEC H1), an optimistic cache patch would show the
 * wrong score for a frame — so each mutation invalidates instead, and the
 * screen shows its own immediate "saved" summary for perceived speed.
 */
export function useLogMutations() {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: ['buddy-challenges'] }),
    ]);

  const saveLog = useMutation({
    mutationFn: async ({
      log,
      highscores,
    }: {
      log: TrainingLogInput;
      highscores?: Record<string, number>;
    }) => {
      await apiPost('/logs', { kind: 'training', ...log });
      if (highscores) await apiPut('/auth/me', { highscores });
    },
    onSuccess: refresh,
  });

  const editLog = useMutation({
    mutationFn: ({ logId, log }: { logId: number; log: TrainingLogInput }) =>
      apiPut('/logs', { logId, log }),
    onSuccess: refresh,
  });

  const deleteLog = useMutation({
    mutationFn: (logId: number) => apiDelete('/logs', { logId }),
    onSuccess: refresh,
  });

  const savePenalty = useMutation({
    mutationFn: (score: number) => apiPost('/logs', { kind: 'penalty', score }),
    onSuccess: refresh,
  });

  const recordSecretProgress = useMutation({
    mutationFn: (patch: Partial<SecretFlags>) => apiPost('/users/secret-progress', { patch }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  return { saveLog, editLog, deleteLog, savePenalty, recordSecretProgress };
}
