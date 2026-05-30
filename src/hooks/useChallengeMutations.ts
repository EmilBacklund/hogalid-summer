import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/utils/api';

/**
 * Daily-completion + buddy-challenge writes. Daily points are awarded
 * server-side (SEC H1) and the completion is idempotent. Buddy create/respond/
 * cancel derive the acting user from the cookie (SEC C1).
 */
export function useChallengeMutations() {
  const queryClient = useQueryClient();
  const invalidateBuddies = () => queryClient.invalidateQueries({ queryKey: ['buddy-challenges'] });
  const invalidateMeAndTeam = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      queryClient.invalidateQueries({ queryKey: ['buddy-challenges'] }),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
    ]);

  const completeDaily = useMutation({
    mutationFn: (challengeId: string) => apiPost('/daily', { challengeId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const createBuddy = useMutation({
    mutationFn: (input: { toAlias: string; exerciseId: string; amount: number }) =>
      apiPost('/buddy-challenges', input),
    onSuccess: invalidateBuddies,
  });

  const respondBuddy = useMutation({
    mutationFn: (input: { challengeId: string; response: 'accept' | 'decline' }) =>
      apiPost('/buddy-challenges/respond', input),
    onSuccess: invalidateMeAndTeam,
  });

  const cancelBuddy = useMutation({
    mutationFn: (challengeId: string) => apiPost('/buddy-challenges/cancel', { challengeId }),
    onSuccess: invalidateBuddies,
  });

  return { completeDaily, createBuddy, respondBuddy, cancelBuddy };
}
