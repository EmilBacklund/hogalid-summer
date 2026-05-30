'use client';

import Link from 'next/link';
import { useUser } from '@/providers/UserProvider';

const NAV: { label: string; href: string }[] = [
  { label: 'Hem', href: '/' },
  { label: 'Logga', href: '/log' },
  { label: 'Historik', href: '/log/history' },
  { label: 'Profil', href: '/profile' },
  { label: 'Utmaningar', href: '/challenges' },
  { label: 'Bingo', href: '/bingo' },
  { label: 'Kort', href: '/cards' },
  { label: 'Lag', href: '/team' },
  { label: 'Bilder', href: '/team/photos' },
  { label: 'Admin', href: '/admin' },
];

/**
 * Temporary stand-in for a screen until it is ported in a later session. Shows
 * the session state (proving the providers + cookie auth work) and links to the
 * other routes so the new file-based routing can be walked manually.
 */
export function PlaceholderScreen({ title, session }: { title: string; session?: string }) {
  const { user, isAdmin, isAuthenticated, isLoading, logout } = useUser();

  const who = isLoading
    ? '…'
    : isAdmin
      ? 'admin'
      : user
        ? user.displayName || user.displayAlias || user.alias
        : 'utloggad';

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <span className="text-hogalid-yellow text-lg font-black">Högalid F15</span>
        <span className="text-hogalid-sky text-sm">
          {session ?? `Inloggad: ${who}`}
          {isAuthenticated && (
            <button onClick={() => void logout()} className="ml-3 underline">
              Logga ut
            </button>
          )}
        </span>
      </header>

      <div className="rounded-xl border border-white/10 p-6 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-white/60">Byggs i en kommande session 🚧</p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-hogalid-navy rounded-full px-3 py-1 text-sm hover:opacity-80"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
