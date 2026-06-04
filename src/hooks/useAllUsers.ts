import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/api';
import type { User } from '@/types';

/** Every player, fully hydrated — for the leaderboard / team views. */
export function useAllUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet<User[]>('/users'),
    staleTime: 30_000,
  });
}
