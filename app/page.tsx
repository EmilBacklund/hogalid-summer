'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/constants';
import {
  generateFeed,
  getDailyChallenge,
  getLevel,
  getNextLevel,
  calcProgress,
  localToday,
} from '@/utils';
import { Card, ProgressBar, Countdown, TopBar, LoadingSpinner } from '@/components/common';
import { AvatarSVG } from '@/components/avatar';
import {
  IntroCarousel,
  CheerToast,
  NewsTicker,
  ActionNudge,
  ChallengesWidget,
  BuddyWidget,
  LastWeekResult,
  StatTiles,
  CollectorCardsCta,
  type Nudge,
} from '@/components/home';
import { useUser } from '@/providers/UserProvider';
import { useStats } from '@/hooks/useStats';
import { useConfig } from '@/hooks/useConfig';
import { useAllUsers } from '@/hooks/useAllUsers';
import { usePhotos } from '@/hooks/usePhotos';
import { useTeamMessages } from '@/hooks/useTeamMessages';
import { useBuddyChallenges } from '@/hooks/useBuddyChallenges';
import { useCheers } from '@/hooks/useCheers';
import type { Stats, User } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { user, isAdmin, isLeader, isLoading } = useUser();
  const stats = useStats();

  // The single admin has no player home — route them to their console.
  // Leaders (coaches) don't play either; the team view is their landing page.
  useEffect(() => {
    if (isAdmin) router.replace('/admin');
    else if (isLeader) router.replace('/team');
  }, [isAdmin, isLeader, router]);

  if (isLoading || !user || !stats) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar din profil..." />
      </main>
    );
  }

  return <HomeContent user={user} stats={stats} />;
}

function HomeContent({ user, stats }: { user: User; stats: Stats }) {
  const router = useRouter();
  const { data: config } = useConfig();
  const { data: allUsersData, isLoading: loadingTeam } = useAllUsers();
  const { data: photosPage } = usePhotos();
  const { messages } = useTeamMessages();
  const { data: buddyData } = useBuddyChallenges();
  const { cheers, markSeen } = useCheers();

  const seasonStart = config?.seasonStart ?? null;
  const allUsers = useMemo(() => allUsersData ?? [], [allUsersData]);
  const teamPhotos = useMemo(() => photosPage?.photos ?? [], [photosPage]);
  const buddyChallenges = buddyData ?? [];

  const todayStr = localToday();
  const displayName = user.displayName || user.displayAlias || user.alias;
  const level = getLevel(stats.totalPoints);
  const nextLevel = getNextLevel(stats.totalPoints);
  const progress = calcProgress(stats.totalPoints);

  // ── Navigation helpers ──
  const goToChallenges = (target: 'daily' | 'weekly' | 'buddy' | null) =>
    router.push(target ? `/challenges?target=${target}` : '/challenges');
  const openTeamFeed = () => router.push('/team?feed=open');

  const nameByAlias = useMemo(
    () =>
      Object.fromEntries(
        allUsers.map((u) => [u.alias, u.displayName || u.displayAlias || u.alias]),
      ),
    [allUsers],
  );

  const feedItems = useMemo(() => {
    if (allUsers.length === 0) return [];
    return generateFeed(allUsers, user.alias, seasonStart, teamPhotos, messages).slice(0, 5);
  }, [allUsers, user.alias, seasonStart, teamPhotos, messages]);

  const playersLoggedToday = useMemo(
    () =>
      allUsers.filter((u) =>
        (u.logs || []).some((l) => l.date === todayStr && !l.bingo && !l.dailyChallenge),
      ).length,
    [allUsers, todayStr],
  );

  // ── "Gör-det-nu" nudge ──
  const hasLogToday = (user.logs || []).some(
    (l) => l.date === todayStr && !l.bingo && !l.dailyChallenge,
  );
  const dailyChallenge = getDailyChallenge(seasonStart);
  const dailyDoneToday = (user.completedDaily || {})[todayStr] === dailyChallenge.id;
  const pendingBuddies = buddyChallenges.filter(
    (c) => c.status === 'pending' && c.toAlias === user.alias,
  );
  const activeBuddies = buddyChallenges.filter((c) => c.status === 'active');
  const nudge: Nudge = useMemo(() => {
    if (!hasLogToday)
      return {
        icon: '⚽',
        text: 'Dags att träna! Sisten som loggar sin dag hejar på Reymers!',
        action: 'log',
        color: COLORS.lime,
      };
    if (pendingBuddies.length > 0)
      return {
        icon: '🤝',
        text: `${pendingBuddies.length} kompisutmaning väntar på svar!`,
        action: 'buddy',
        color: '#f9a8d4',
      };
    if (activeBuddies.length > 0)
      return {
        icon: '💪',
        text: 'Du har en aktiv kompisutmaning — kämpa på!',
        action: 'buddy',
        color: '#60a5fa',
      };
    if (!dailyDoneToday)
      return {
        icon: '✅',
        text: 'Du har redan loggat idag — snyggt jobbat!',
        action: null,
        color: COLORS.lime,
      };
    return {
      icon: '🎉',
      text: 'Du har gjort allt idag — bra jobbat!',
      action: null,
      color: COLORS.lime,
    };
  }, [hasLogToday, dailyDoneToday, pendingBuddies.length, activeBuddies.length]);

  const onNudge = () => {
    if (nudge.action === 'log') router.push('/log');
    else if (nudge.action === 'daily') goToChallenges('daily');
    else if (nudge.action === 'buddy') goToChallenges('buddy');
  };

  // ── Intro modal (first visit per alias) ──
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    const key = `hogalid_intro_seen_${user.alias}`;
    if (!localStorage.getItem(key)) {
      setShowIntro(true);
      localStorage.setItem(key, '1');
    }
  }, [user.alias]);

  // ── Cheer toast ──
  const [cheerToast, setCheerToast] = useState<{ names: string[] } | null>(null);
  const [cheerFading, setCheerFading] = useState(false);
  useEffect(() => {
    if (cheers.length === 0 || cheerToast) return;
    const names = [...new Set(cheers.map((c) => nameByAlias[c.fromAlias] || c.fromAlias))];
    setCheerToast({ names });
    markSeen(cheers.map((c) => c.id));
    const t1 = setTimeout(() => setCheerFading(true), 4500);
    const t2 = setTimeout(() => {
      setCheerToast(null);
      setCheerFading(false);
    }, 5200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [cheers, cheerToast, markSeen, nameByAlias]);

  return (
    <main className="mx-auto min-h-screen max-w-md">
      <TopBar />

      {showIntro && <IntroCarousel onClose={() => setShowIntro(false)} />}
      {cheerToast && (
        <CheerToast
          names={cheerToast.names}
          fading={cheerFading}
          onDismiss={() => {
            setCheerToast(null);
            setCheerFading(false);
          }}
        />
      )}

      <div className="px-4 pt-5 pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            aria-label="Min profil"
            className="shrink-0 leading-none"
          >
            <AvatarSVG avatarConfig={user.avatarConfig} size={56} />
          </button>
          <div>
            <div className="font-display text-2xl leading-[1.1] text-white">
              Hej, {displayName}! 👋
            </div>
            <div className="text-hogalid-yellow text-sm font-semibold">
              {level.icon} {level.name}
            </div>
          </div>
        </div>

        {/* Compact level progress */}
        <Card className="mb-3 px-3 py-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-2.5">
            <span className="text-[13px] leading-tight font-bold text-white">
              {level.icon} {level.name}
            </span>
            {nextLevel && (
              <span className="shrink-0 text-[11px] font-bold text-white/45">
                {nextLevel.min - stats.totalPoints} poäng kvar till nästa nivå
              </span>
            )}
          </div>
          <ProgressBar value={progress} color={COLORS.lime} height={8} />
        </Card>

        <Countdown />

        <NewsTicker items={feedItems} onOpen={openTeamFeed} />

        <ActionNudge
          nudge={nudge}
          subtitle={
            !loadingTeam && allUsers.length > 1
              ? `${playersLoggedToday} av ${allUsers.length} spelare har tränat idag`
              : null
          }
          onClick={onNudge}
        />

        <ChallengesWidget
          user={user}
          allUsers={allUsers}
          seasonStart={seasonStart}
          loadingTeam={loadingTeam}
          onNavigate={goToChallenges}
        />

        <BuddyWidget
          buddyChallenges={buddyChallenges}
          myAlias={user.alias}
          nameByAlias={nameByAlias}
          onOpen={() => goToChallenges('buddy')}
        />

        {!loadingTeam && <LastWeekResult allUsers={allUsers} seasonStart={seasonStart} />}

        <StatTiles stats={stats} user={user} onOpenLog={() => router.push('/log')} />

        {/* Primary actions */}
        <button
          type="button"
          onClick={() => router.push('/log')}
          className="bg-hogalid-yellow text-hogalid-dark font-display mb-2.5 w-full rounded-[18px] py-[18px] text-[22px] tracking-[0.5px] shadow-[0_6px_28px_#f0dc0055]"
        >
          📕 Dagbok
        </button>
        <button
          type="button"
          onClick={() => router.push('/bingo')}
          className="font-display mb-2.5 w-full rounded-2xl bg-[linear-gradient(135deg,#dc2828,#002864)] py-[15px] text-[19px] tracking-[0.5px] text-white shadow-[0_4px_20px_rgba(220,40,40,0.35)]"
        >
          🌞 Sommarlovsbingo — {(user.bingo || []).length}/50 klara
        </button>

        <CollectorCardsCta stats={stats} user={user} onClick={() => router.push('/cards')} />

        <div className="mb-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="font-display rounded-[14px] bg-white/10 py-3.5 text-base text-white"
          >
            👧 Min profil
          </button>
          <button
            type="button"
            onClick={() => router.push('/team')}
            className="font-display rounded-[14px] bg-white/10 py-3.5 text-base text-white"
          >
            🤝 Högalid F15
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowIntro(true)}
          className="mb-2 w-full rounded-[14px] border border-white/[0.16] bg-white/[0.08] py-3 text-sm font-extrabold tracking-[0.3px] text-white/[0.88]"
        >
          ❓ Hur funkar appen?
        </button>
      </div>
    </main>
  );
}
