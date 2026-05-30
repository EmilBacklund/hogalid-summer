'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EXERCISES } from '@/constants';
import {
  localToday,
  getWeekStart,
  getDailyChallenge,
  getWeeklyChallenge,
  getWeeklyLevelInfo,
} from '@/utils';
import { TopBar, LoadingSpinner } from '@/components/common';
import { DailySection, WeeklySection, BuddySection } from '@/components/challenges';
import { useUser } from '@/providers/UserProvider';
import { useConfig } from '@/hooks/useConfig';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useBuddyChallenges } from '@/hooks/useBuddyChallenges';
import { useChallengeMutations } from '@/hooks/useChallengeMutations';
import type { User } from '@/types';

export default function ChallengesPage() {
  const { user, isLoading } = useUser();
  if (isLoading || !user) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar..." />
      </main>
    );
  }
  return <ChallengesContent user={user} />;
}

function ChallengesContent({ user }: { user: User }) {
  const router = useRouter();
  const { data: config } = useConfig();
  const { data: allUsersData, isLoading: loadingTeam } = useAllUsers();
  const { data: buddyData } = useBuddyChallenges();
  const { completeDaily, createBuddy, respondBuddy, cancelBuddy } = useChallengeMutations();

  const seasonStart = config?.seasonStart ?? null;
  const allUsers = allUsersData ?? [];
  const buddyChallenges = buddyData ?? [];

  const dailyRef = useRef<HTMLDivElement>(null);
  const weeklyRef = useRef<HTMLDivElement>(null);
  const buddyRef = useRef<HTMLDivElement>(null);

  // Scroll to the section requested via ?target= (set by the Home nav helpers).
  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get('target');
    if (!target) return;
    const ref = { daily: dailyRef, weekly: weeklyRef, buddy: buddyRef }[target];
    if (!ref) return;
    const timer = setTimeout(
      () => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      100,
    );
    return () => clearTimeout(timer);
  }, []);

  const today = localToday();
  const weekStart = getWeekStart(today);
  const daily = getDailyChallenge(seasonStart);
  const weekly = getWeeklyChallenge(seasonStart);
  const completedDaily = user.completedDaily || {};
  const dailyDoneToday = completedDaily[today] === daily.id;

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

  return (
    <main className="mx-auto min-h-screen max-w-md">
      <TopBar />
      <div className="px-4 pt-5 pb-8">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-hogalid-yellow mb-4 flex items-center gap-1 text-[15px] font-bold"
        >
          <ArrowLeft size={16} /> Tillbaka
        </button>

        <div className="font-display mb-0.5 text-[26px] text-white">Utmaningar ⚡</div>
        <div className="mb-5 text-[13px] text-white/50">
          Dagens uppdrag · lagutmaning · kompisutmaningar
        </div>

        <DailySection
          ref={dailyRef}
          daily={daily}
          dailyDoneToday={dailyDoneToday}
          completedDaily={completedDaily}
          completing={completeDaily.isPending}
          onComplete={async () => {
            await completeDaily.mutateAsync(daily.id);
          }}
        />

        <WeeklySection
          ref={weeklyRef}
          weekly={weekly}
          weekStart={weekStart}
          weekValue={weekValue}
          weekDone={weekDone}
          levelInfo={levelInfo}
          loadingTeam={loadingTeam}
        />

        <div ref={buddyRef} className="scroll-mt-2" />
        <BuddySection
          user={user}
          allUsers={allUsers}
          buddyChallenges={buddyChallenges}
          onCreate={async (toAlias, exerciseId, amount) => {
            await createBuddy.mutateAsync({ toAlias, exerciseId, amount });
          }}
          onRespond={async (challengeId, response) => {
            await respondBuddy.mutateAsync({ challengeId, response });
          }}
          onCancel={(challengeId) => cancelBuddy.mutate(challengeId)}
        />
      </div>
    </main>
  );
}
