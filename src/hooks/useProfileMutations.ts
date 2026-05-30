import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPut } from '@/utils/api';
import type { AvatarConfig } from '@/types';

/**
 * Profile self-edits. Avatar + unlocks go through `PUT /api/auth/me`
 * (alias derived from the cookie, SEC C1); the display name has its own route.
 * Each invalidates `['me']` so the UI reflects the persisted state.
 */
export function useProfileMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['me'] });

  const updateAvatar = useMutation({
    mutationFn: (avatarConfig: AvatarConfig) => apiPut('/auth/me', { avatarConfig }),
    onSuccess: invalidate,
  });

  /** Persist the full unlocked-items list (caller appends the new id). */
  const unlockItems = useMutation({
    mutationFn: (unlockedItems: string[]) => apiPut('/auth/me', { unlockedItems }),
    onSuccess: invalidate,
  });

  const updateDisplayName = useMutation({
    mutationFn: (displayName: string) => apiPut('/users/display-name', { displayName }),
    onSuccess: invalidate,
  });

  return { updateAvatar, unlockItems, updateDisplayName };
}
