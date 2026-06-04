import { useMemo } from 'react';
import { useMe } from './useMe';
import { computeStats } from '@/utils';
import type { Stats } from '@/types';

/**
 * Derived player stats (points, streak, touch totals, …) computed from the
 * current session user. A thin selector over {@link useMe} — the admin marker
 * has no logs, so it yields `null`.
 */
export function useStats(): Stats | null {
  const { data } = useMe();
  return useMemo(() => {
    if (!data || !('logs' in data)) return null;
    return computeStats(data);
  }, [data]);
}
