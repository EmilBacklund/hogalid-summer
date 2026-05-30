'use client';

import Link from 'next/link';
import { Card, TopBar } from '@/components/common';

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
 * Temporary stand-in for a screen until it is ported in a later session. Uses
 * the real common components (TopBar, Card) so they get exercised in-page, and
 * links to the other routes so the new file-based routing can be walked.
 */
export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-4">
      <TopBar />

      <Card className="text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-white/60">Byggs i en kommande session 🚧</p>
      </Card>

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
