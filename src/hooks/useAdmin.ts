import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/utils/api';
import type { Invite } from '@/types';

/** All invites, newest first (admin only). */
export function useInvites() {
  return useQuery({
    queryKey: ['invites'],
    queryFn: () => apiGet<Invite[]>('/invites'),
    staleTime: 30_000,
  });
}

/**
 * Privileged admin actions. Every write hits the `/admin` dispatch (or `/invites`)
 * route, which re-verifies the signed `admin` claim server-side (SEC C1) — the
 * client gating here is convenience only. There is no plaintext-password path
 * (SEC C2): a reset stores a fresh PBKDF2 hash.
 */
export function useAdminMutations() {
  const queryClient = useQueryClient();
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['users'] });
  const invalidateConfig = () => queryClient.invalidateQueries({ queryKey: ['config'] });
  const invalidateInvites = () => queryClient.invalidateQueries({ queryKey: ['invites'] });

  const resetSeason = useMutation({
    mutationFn: () => apiPost('/admin', { action: 'reset-season' }),
    onSuccess: () => Promise.all([invalidateUsers(), invalidateConfig()]),
  });

  const resetPassword = useMutation({
    mutationFn: (input: { alias: string; newPassword: string }) =>
      apiPost('/admin', { action: 'reset-password', ...input }),
  });

  const deleteUser = useMutation({
    mutationFn: (alias: string) => apiPost('/admin', { action: 'delete-user', alias }),
    onSuccess: invalidateUsers,
  });

  const setSeasonStart = useMutation({
    mutationFn: (date: string) => apiPost('/admin', { action: 'season-start', date }),
    onSuccess: invalidateConfig,
  });

  const setCountdownDate = useMutation({
    mutationFn: (date: string) => apiPost('/admin', { action: 'countdown-date', date }),
    onSuccess: invalidateConfig,
  });

  const createInvite = useMutation({
    mutationFn: (label: string) => apiPost('/invites', { label }),
    onSuccess: invalidateInvites,
  });

  const updateInvite = useMutation({
    mutationFn: (input: { inviteId: number; mode: 'disable' | 'enable' }) =>
      apiPut('/invites', input),
    onSuccess: invalidateInvites,
  });

  return {
    resetSeason,
    resetPassword,
    deleteUser,
    setSeasonStart,
    setCountdownDate,
    createInvite,
    updateInvite,
  };
}
