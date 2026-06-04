import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/api';
import type { Me } from '@/types';

/** Current session user (or the admin marker). 401 → no retry, treated as unauthenticated. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiGet<Me>('/auth/me'),
    retry: false,
    staleTime: 60_000,
  });
}
