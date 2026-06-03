'use client';

import { useUser } from '@/providers/UserProvider';

/**
 * A persistent banner shown only while exploring the demo. Makes it obvious
 * nothing is saved and offers a one-tap exit (which clears the demo flag and
 * returns to /login via {@link useUser}'s `logout`).
 */
export function DemoBanner() {
  const { isDemo, logout } = useUser();
  if (!isDemo) return null;

  return (
    <div className="bg-hogalid-yellow text-hogalid-dark fixed inset-x-0 bottom-0 z-[1500] flex items-center justify-between gap-3 px-4 py-2.5 shadow-[0_-2px_16px_rgba(0,0,0,0.25)]">
      <span className="text-[13px] font-extrabold">🎮 Demoläge — inget sparas</span>
      <button
        type="button"
        onClick={() => void logout()}
        className="bg-hogalid-dark rounded-lg px-3 py-1.5 text-xs font-bold text-white"
      >
        Avsluta demo
      </button>
    </div>
  );
}
