import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/api';
import type { BuddyChallenge } from '@/types';

/** Buddy challenges involving the current user (server filters by the cookie). */
export function useBuddyChallenges(enabled = true) {
  return useQuery({
    queryKey: ['buddy-challenges'],
    queryFn: () => apiGet<BuddyChallenge[]>('/buddy-challenges'),
    enabled,
    staleTime: 30_000,
  });
}
