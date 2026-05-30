'use client';

import Link from 'next/link';
import { useUser } from '@/providers/UserProvider';

/**
 * App header: logo (links home), a user pill, and logout. Reads the session
 * from `useUser` — no props needed for the common case.
 */
export function TopBar() {
  const { user, isAdmin, isAuthenticated, logout } = useUser();
  const name = isAdmin ? 'Admin' : user?.displayName || user?.displayAlias || user?.alias;

  return (
    <div className="flex items-center justify-between px-4 pt-3.5">
      <Link href="/" className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/hogalid-logo.png" alt="" className="h-8 w-auto" />
        <span className="text-hogalid-yellow font-display text-xl">Högalid</span>
      </Link>

      {isAuthenticated && (
        <div className="flex items-center gap-3">
          {name && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/80">
              {name}
            </span>
          )}
          <button
            onClick={() => void logout()}
            className="text-[13px] text-white/40 hover:text-white/70"
          >
            Logga ut
          </button>
        </div>
      )}
    </div>
  );
}
