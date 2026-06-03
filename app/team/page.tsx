'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EXERCISES } from '@/constants';
import {
  localToday,
  getWeekStart,
  getTeamLevel,
  getNextTeamLevel,
  calcTeamProgress,
  getWeeklyChallenge,
  getWeeklyLevelInfo,
  computeTeamAggregate,
  computeWeeklyHistory,
  saveWeeklyResult,
  generateFeed,
} from '@/utils';
import { apiPost } from '@/utils/api';
import { Confetti, LoadingSpinner, TopBar } from '@/components/common';
import {
  PhotoAlbumCard,
  PhotoModeration,
  MessageComposer,
  RosterCard,
  ActivityFeed,
  WeeklyTeamChallenge,
  WeeklyHistoryCard,
  TeamLevelCard,
  UpcomingLevels,
  TeamStreakCard,
  TeamTotals,
  MyContribution,
} from '@/components/team';
import { useUser } from '@/providers/UserProvider';
import { useConfig } from '@/hooks/useConfig';
import { useAllUsers } from '@/hooks/useAllUsers';
import { usePhotos } from '@/hooks/usePhotos';
import { useTeamMessages } from '@/hooks/useTeamMessages';
import { useReactions } from '@/hooks/useReactions';
import type { User } from '@/types';

type CheerResult = 'sent' | 'already' | 'error';

export default function TeamPage() {
  const { user, isLoading } = useUser();
  if (isLoading || !user) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar..." />
      </main>
    );
  }
  return <TeamContent user={user} />;
}

function TeamContent({ user }: { user: User }) {
  const router = useRouter();
  const { isAdmin, isLeader } = useUser();
  const { data: config } = useConfig();
  const { data: allUsersData, isLoading: loadingTeam } = useAllUsers();
  const { data: photosPage } = usePhotos();
  const { messages } = useTeamMessages();
  const { reactions, toggle } = useReactions(user.alias);

  const seasonStart = config?.seasonStart ?? null;
  const allUsers = useMemo(() => allUsersData ?? [], [allUsersData]);
  // The shared album/feed only ever show approved photos; an uploader's own
  // pending shots live on the dedicated /team/photos page (badged as awaiting).
  const photos = useMemo(
    () => (photosPage?.photos ?? []).filter((p) => p.status === 'approved'),
    [photosPage],
  );
  const canModerate = isAdmin || isLeader;

  const [showConfetti, setShowConfetti] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const savedWeeklyRef = useRef(false);

  // Open + scroll to the feed when arriving via /team?feed=open (Home nav).
  const feedOpen = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('feed') === 'open';
  }, []);
  useEffect(() => {
    if (!feedOpen) return;
    const timer = setTimeout(
      () => feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      150,
    );
    return () => clearTimeout(timer);
  }, [feedOpen, loadingTeam]);

  // Persist last week's team result once, in the background.
  useEffect(() => {
    if (loadingTeam || savedWeeklyRef.current || allUsers.length === 0 || !seasonStart) return;
    savedWeeklyRef.current = true;
    saveWeeklyResult(allUsers, seasonStart).catch(() => {});
  }, [loadingTeam, allUsers, seasonStart]);

  const agg = useMemo(() => computeTeamAggregate(allUsers), [allUsers]);
  const teamLevel = getTeamLevel(agg.points);

  // Brief confetti when the team level changes since last visit (this tab).
  useEffect(() => {
    if (loadingTeam) return;
    const key = 'fball_last_team_level';
    const last = sessionStorage.getItem(key);
    if (last && last !== teamLevel.name) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      sessionStorage.setItem(key, teamLevel.name);
      return () => clearTimeout(timer);
    }
    sessionStorage.setItem(key, teamLevel.name);
  }, [loadingTeam, teamLevel.name]);

  async function handleCheer(alias: string): Promise<CheerResult> {
    try {
      await apiPost('/cheers', { toAlias: alias });
      return 'sent';
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      return message.includes('already_cheered_today') ? 'already' : 'error';
    }
  }

  if (loadingTeam) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar lagets data..." />
      </main>
    );
  }

  const today = localToday();
  const weekStart = getWeekStart(today);
  const nextTeamLevel = getNextTeamLevel(agg.points);
  const teamProgress = calcTeamProgress(agg.points);

  // Current week's challenge progress, aggregated across the team.
  const weekly = getWeeklyChallenge(seasonStart);
  let weekTouch = 0;
  let weekMinutes = 0;
  allUsers.forEach((u) => {
    (u.logs || []).forEach((l) => {
      if (!l.bingo && l.date >= weekStart && l.date <= today) {
        weekMinutes += l.minutes || 0;
        (l.exercises || []).forEach((e) => {
          const ex = EXERCISES.find((x) => x.id === e.id);
          if (ex && !ex.isTime && e.id !== 'skott') weekTouch += e.value || 0;
        });
      }
    });
  });
  const weekValue = weekly.type === 'touch' ? weekTouch : weekMinutes;
  const weekDone = weekValue >= weekly.goal;
  const levelInfo = getWeeklyLevelInfo(weekValue, weekly.goal);

  const feed = generateFeed(allUsers, user.alias, seasonStart, photos, messages);
  const history = computeWeeklyHistory(allUsers, seasonStart);
  const myStats = agg.allStats.find((u) => u.alias === user.alias);
  const openAlbum = () => router.push('/team/photos');

  const totals = [
    { label: 'Antal spelare', val: agg.allStats.length, icon: '👥' },
    { label: 'Inloggade träningar', val: agg.totalLogs, icon: '📅' },
    { label: 'Minuter tränat', val: agg.totalMinutes, icon: '⏱' },
    { label: 'Touch totalt', val: agg.totalTouch.toLocaleString('sv'), icon: '🦶' },
    {
      label: 'Bingo-uppdrag klarade',
      val: `${agg.totalBingo} (${agg.uniqueBingo} unika)`,
      icon: '🌞',
    },
    { label: 'Glassar totalt', val: agg.totalIceCream, icon: '🍦' },
    { label: 'Bad totalt', val: agg.totalSwim, icon: '🏊' },
    { label: 'Sidor lästa totalt', val: agg.totalPages.toLocaleString('sv'), icon: '📖' },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-md">
      <TopBar />
      <div className="px-4 pt-5 pb-8">
        <Confetti active={showConfetti} />

        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-hogalid-yellow mb-4 flex items-center gap-1 text-[15px] font-bold"
        >
          <ArrowLeft size={16} />
          Tillbaka
        </button>

        <div className="font-display mb-1 text-[26px] text-white">Högalid F15 💪</div>
        <div className="mb-5 text-[13px] text-white/50">Träna mer — klättra upp i nivåer!</div>

        {canModerate && <MessageComposer />}
        {canModerate && <PhotoModeration />}

        <PhotoAlbumCard photos={photos} onOpen={openAlbum} />

        <TeamLevelCard
          teamLevel={teamLevel}
          nextTeamLevel={nextTeamLevel}
          teamProgress={teamProgress}
          teamPoints={agg.points}
        />
        <UpcomingLevels teamLevel={teamLevel} />

        <RosterCard members={allUsers} myAlias={user.alias} onCheer={handleCheer} />

        <ActivityFeed
          ref={feedRef}
          feed={feed}
          myAlias={user.alias}
          reactions={reactions}
          onToggleReaction={toggle}
          onOpenPhoto={openAlbum}
          defaultExpanded={feedOpen}
        />

        <TeamStreakCard streak={agg.streak} />

        <WeeklyTeamChallenge
          weekly={weekly}
          weekStart={weekStart}
          weekValue={weekValue}
          weekDone={weekDone}
          levelInfo={levelInfo}
        />

        <TeamTotals rows={totals} />

        <WeeklyHistoryCard history={history} />

        {myStats && <MyContribution stats={myStats} />}
      </div>
    </main>
  );
}
