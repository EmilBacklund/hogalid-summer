'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/constants';
import { computeStats, localToday } from '@/utils';
import { LoadingSpinner } from '@/components/common';
import { SeasonControls, InviteManager, PlayerCard } from '@/components/admin';
import { useUser } from '@/providers/UserProvider';
import { useAllUsers } from '@/hooks/useAllUsers';

export default function AdminPage() {
  const { isAdmin, isLoading, logout } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace('/');
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="splash" text="Laddar..." />
      </main>
    );
  }
  return <AdminContent onLogout={() => void logout()} />;
}

function AdminContent({ onLogout }: { onLogout: () => void }) {
  const { data: allUsers, isLoading } = useAllUsers();
  const today = localToday();

  const players = useMemo(() => {
    return (allUsers ?? [])
      .map((u) => {
        const stats = computeStats(u);
        const dates = (u.logs || [])
          .map((l) => l.date)
          .filter(Boolean)
          .sort();
        const lastActivity = dates.length > 0 ? dates[dates.length - 1]! : null;
        return { user: u, stats, lastActivity };
      })
      .sort((a, b) => (b.lastActivity || '').localeCompare(a.lastActivity || ''));
  }, [allUsers]);

  const summary = [
    { label: 'Spelare', val: players.length, icon: '👥' },
    {
      label: 'Träningar loggade',
      val: players.reduce((s, p) => s + p.stats.totalLogs, 0),
      icon: '📅',
    },
    {
      label: 'Bingo klarade',
      val: players.reduce((s, p) => s + p.stats.bingoCount, 0),
      icon: '🌞',
    },
  ];

  return (
    <main
      className="min-h-screen text-white"
      style={{
        background: `linear-gradient(160deg, ${COLORS.dark} 0%, #001e6e 60%, #002864 100%)`,
      }}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Image src="/img/hogalid-logo.png" alt="" width={32} height={32} />
            <span className="text-hogalid-yellow font-display text-xl">Admin — Högalid F15</span>
          </div>
          <div className="text-xs text-white/40">Sommarlovet 2026</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-[13px] text-white/60"
        >
          Logga ut
        </button>
      </div>

      <div className="px-4 pt-4 pb-10">
        <div className="mb-5 grid grid-cols-3 gap-2.5">
          {summary.map(({ label, val, icon }) => (
            <div key={label} className="rounded-2xl bg-white/[0.09] px-2.5 py-3 text-center">
              <div className="text-xl">{icon}</div>
              <div className="text-hogalid-yellow font-display text-[22px]">{val}</div>
              <div className="mt-0.5 text-[11px] text-white/45">{label}</div>
            </div>
          ))}
        </div>

        <SeasonControls />
        <InviteManager />

        <div className="mb-2.5 text-xs font-semibold tracking-wider text-white/50 uppercase">
          Alla spelare ({players.length}) — sorterat senast aktiv
        </div>

        {isLoading ? (
          <LoadingSpinner text="Laddar spelardata..." />
        ) : players.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/30">
            Inga spelare registrerade än.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {players.map(({ user, stats, lastActivity }) => (
              <PlayerCard
                key={user.alias}
                player={user}
                stats={stats}
                lastActivity={lastActivity}
                today={today}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
