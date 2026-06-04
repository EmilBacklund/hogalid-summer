import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/utils/api';
import type { Config } from '@/types';

/** Season start + countdown date. Public, rarely changes. */
export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => apiGet<Config>('/config'),
    staleTime: 5 * 60_000,
  });
}
