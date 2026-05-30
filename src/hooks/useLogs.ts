import { useMe } from './useMe';
import type { Log } from '@/types';

/**
 * The current user's logs. They are embedded in the `/api/auth/me` payload, so
 * this is a thin selector over {@link useMe} rather than a separate request.
 */
export function useLogs(): Log[] {
  const { data } = useMe();
  // The admin marker has no `logs` field — use it as the discriminant.
  if (!data || !('logs' in data)) return [];
  return data.logs;
}
