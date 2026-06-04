'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { EXERCISES, COLORS } from '@/constants';
import {
  getDailyChallenge,
  getWeeklyChallenge,
  getWeeklyLevelInfo,
  localToday,
  getWeekStart,
} from '@/utils';
import { Card, ProgressBar } from '@/components/common';
import { cn } from '@/lib/cn';
import type { User } from '@/types';

const MAX_FIRE = '#ff6a00';

interface ChallengesWidgetProps {
  user: User;
  allUsers: User[];
  seasonStart: string | null;
  loadingTeam: boolean;
  /** Navigate to the challenges screen, optionally scrolling to a section. */
  onNavigate: (target: 'daily' | 'weekly' | 'buddy' | null) => void;
}

/** Home widget summarising today's daily challenge and the team weekly challenge. */
export function ChallengesWidget({
  user,
  allUsers,
  seasonStart,
  loadingTeam,
  onNavigate,
}: ChallengesWidgetProps) {
  const today = localToday();
  const daily = getDailyChallenge(seasonStart);
  const weekly = getWeeklyChallenge(seasonStart);
  const dailyDone = (user.completedDaily || {})[today] === daily.id;
  const weekStart = getWeekStart(today);

  let weekTouch = 0;
  let weekMins = 0;
  if (!loadingTeam) {
    allUsers.forEach((u) => {
      (u.logs || []).forEach((l) => {
        if (!l.bingo && l.date >= weekStart && l.date <= today) {
          weekMins += l.minutes || 0;
          (l.exercises || []).forEach((e) => {
            const ex = EXERCISES.find((x) => x.id === e.id);
            if (ex && !ex.isTime && e.id !== 'skott') weekTouch += e.value || 0;
          });
        }
      });
    });
  }
  const weekVal = weekly.type === 'touch' ? weekTouch : weekMins;
  const weekDone = weekVal >= weekly.goal;
  const levelInfo = getWeeklyLevelInfo(weekVal, weekly.goal);
  const isMax = !loadingTeam && levelInfo.isMaxLevel;

  const [fireSeenThisWeek, setFireSeenThisWeek] = useState(true);
  useEffect(() => {
    setFireSeenThisWeek(!!localStorage.getItem(`fire_seen_${getWeekStart(localToday())}`));
  }, []);
  useEffect(() => {
    if (isMax && !fireSeenThisWeek) {
      localStorage.setItem(`fire_seen_${getWeekStart(localToday())}`, '1');
      setFireSeenThisWeek(true);
    }
  }, [isMax, fireSeenThisWeek]);
  const showFire = isMax && !fireSeenThisWeek;

  const weeklyColor = isMax ? MAX_FIRE : weekDone ? COLORS.lime : COLORS.yellow;

  return (
    <Card className="mb-3 px-4 py-4">
      {/* Header */}
      <div
        onClick={() => onNavigate(null)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate(null);
          }
        }}
        className="mb-3.5 flex cursor-pointer items-center justify-between"
      >
        <div className="text-[15px] font-bold text-white">⚡ Utmaningar</div>
        <div className="text-hogalid-yellow flex items-center gap-[3px] text-xs font-semibold">
          Se alla <ArrowRight size={13} />
        </div>
      </div>

      {/* Daily section */}
      <div onClick={() => onNavigate('daily')} role="presentation" className="mb-3 cursor-pointer">
        <div className="text-hogalid-yellow mb-1.5 text-[11px] font-bold tracking-wider uppercase">
          📅 Dagens utmaning
        </div>
        <div className="flex items-start gap-2.5">
          <span className="text-xl leading-[1.3]">{daily.icon}</span>
          <div
            className={cn(
              'flex-1 text-sm leading-snug font-semibold',
              dailyDone ? 'text-white/40 line-through' : 'text-white',
            )}
          >
            {daily.label}
          </div>
          <div className="text-hogalid-yellow shrink-0 text-[13px] font-bold">
            {dailyDone ? '✅' : `+${daily.points}p`}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mb-3 border-t border-white/[0.08]" />

      {/* Weekly section */}
      <div
        onClick={() => onNavigate('weekly')}
        role="presentation"
        className={cn(
          'cursor-pointer rounded-xl',
          isMax &&
            '-mx-0.5 border-2 border-[#ff6a00] bg-[rgba(255,100,0,0.08)] px-2.5 pt-2.5 pb-1.5',
          showFire && 'animate-fire-glow',
        )}
      >
        <div className="mb-1.5 flex items-center justify-between">
          <div className="text-[11px] font-bold tracking-wider text-white/50 uppercase">
            🤝 Lagets veckoutmaning
          </div>
          {!loadingTeam && levelInfo.level > 0 && (
            <div
              className={cn(
                'text-[11px] font-bold',
                isMax ? 'text-[#ff6a00]' : 'text-hogalid-yellow',
              )}
            >
              {isMax ? '🔥 ' : ''}
              {levelInfo.levelName}
            </div>
          )}
        </div>
        {loadingTeam ? (
          <div className="flex justify-between px-0 pt-2.5 pb-1">
            {[0, 0.1, 0.2, 0.3, 0.4].map((delay) => (
              <div
                key={delay}
                className="animate-football-bounce text-[22px] leading-none"
                style={{ animationDelay: `${delay}s` }}
              >
                ⚽
              </div>
            ))}
          </div>
        ) : (
          <>
            <div
              className={cn(
                'mb-2 text-[13px] leading-snug font-semibold',
                isMax ? 'text-[#ff6a00]' : weekDone ? 'text-hogalid-yellow' : 'text-white',
              )}
            >
              {weekly.label} {isMax ? '🔥' : weekDone ? '🎉' : ''}
            </div>
            <ProgressBar value={levelInfo.progress} color={weeklyColor} height={8} />
            <div className="mt-[5px] flex justify-between">
              <span className="text-xs text-white/50">
                {weekly.type === 'touch' ? `${weekVal} touch` : `${weekVal} min`}
              </span>
              <span
                className={cn(
                  'text-xs font-bold',
                  isMax ? 'text-[#ff6a00]' : 'text-hogalid-yellow',
                )}
              >
                {isMax
                  ? '🔥 Max!'
                  : levelInfo.level === 0
                    ? `${weekly.goal - weekVal} kvar till Nivå 1`
                    : `${levelInfo.nextThreshold - weekVal} kvar till ${levelInfo.nextLevelName}`}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
