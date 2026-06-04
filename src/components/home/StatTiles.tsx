'use client';

import { EXERCISES } from '@/constants';
import { computeCoins, getWeekStart, localToday } from '@/utils';
import { Card } from '@/components/common';
import { cn } from '@/lib/cn';
import type { Log, Stats, User } from '@/types';

const STREAK_DAY_LABELS = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/** Days that count toward the streak: a real session (5 min OR 30 touch) or football bingo. */
function getQualifyingFootballDays(logs: Log[]): string[] {
  return [
    ...new Set(
      logs
        .filter((l) => {
          if (l.bingoFootball) return true;
          if (l.bingo) return false;
          const mins = (l.exercises || []).find((e) => e.id === 'fritraning')?.value || 0;
          const touch = (l.exercises || []).reduce((sum, e) => {
            const ex = EXERCISES.find((x) => x.id === e.id);
            return sum + (ex && !ex.isTime && e.id !== 'skott' ? e.value || 0 : 0);
          }, 0);
          return mins >= 5 || touch >= 30;
        })
        .map((l) => l.date),
    ),
  ].sort();
}

interface StatTilesProps {
  stats: Stats;
  user: User;
  onOpenLog: () => void;
}

/** The streak tile + points/coins tile shown side by side on Home. */
export function StatTiles({ stats, user, onOpenLog }: StatTilesProps) {
  const todayStr = localToday();
  const streakWeekStart = getWeekStart(todayStr);
  const qualifyingDaySet = new Set(getQualifyingFootballDays(user.logs || []));
  const hasStreakToday = qualifyingDaySet.has(todayStr);
  const streakStatusText = hasStreakToday
    ? '✅ Du har säkrat streaken idag!'
    : stats.streak > 0
      ? '⏳ Logga en träning idag för att behålla streaken'
      : '⏳ Logga en träning idag för att starta en streak!';
  const streakWeekDays = Array.from({ length: 7 }, (_, i) => addDaysStr(streakWeekStart, i));
  const coins = computeCoins(stats.totalPoints, user.unlockedItems || []);

  return (
    <div className="mb-4 grid grid-cols-2 gap-3">
      {/* Streak tile */}
      <Card onClick={onOpenLog} className="px-3.5 py-4">
        <div className="mb-2.5 flex items-center gap-2.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(240,220,0,0.14)] text-2xl">
            🔥
          </div>
          <div className="min-w-0">
            <div className="text-hogalid-yellow font-display text-[28px] leading-none">
              {stats.streak}
            </div>
            <div className="text-xs font-bold text-white/60">dagars streak</div>
          </div>
        </div>
        <div
          className={cn(
            'mb-3 rounded-xl border px-2.5 py-2 text-xs leading-snug font-bold',
            hasStreakToday
              ? 'text-hogalid-yellow border-[rgba(240,220,0,0.3)] bg-[rgba(240,220,0,0.14)]'
              : 'border-white/[0.12] bg-white/[0.08] text-white',
          )}
        >
          {streakStatusText}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {streakWeekDays.map((dayDate, idx) => {
            const isDone = qualifyingDaySet.has(dayDate);
            const isToday = dayDate === todayStr;
            const isFuture = dayDate > todayStr;
            return (
              <div key={dayDate} className="min-w-0 text-center">
                <div
                  className={cn(
                    'mb-1.5 text-[10px] font-extrabold',
                    isToday ? 'text-hogalid-yellow' : 'text-white/45',
                  )}
                >
                  {STREAK_DAY_LABELS[idx]}
                </div>
                <div
                  className={cn(
                    'mx-auto flex h-[22px] w-[22px] items-center justify-center rounded-full text-[13px] font-black',
                    isDone
                      ? 'bg-hogalid-yellow text-hogalid-dark'
                      : isToday
                        ? 'bg-[rgba(240,220,0,0.18)]'
                        : 'bg-white/[0.12]',
                    isToday && !isDone
                      ? 'border-hogalid-yellow border-[1.5px]'
                      : 'border border-transparent',
                    !isDone && (isFuture ? 'text-white/[0.28]' : 'text-white'),
                  )}
                >
                  {isDone ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Points + coins tile */}
      <Card className="flex flex-col items-center justify-center gap-1.5 px-3 py-3.5 text-center">
        <div>
          <div className="mb-1 text-[28px] leading-none">⭐</div>
          <div className="text-hogalid-yellow font-display text-[28px] leading-none">
            {stats.totalPoints}
          </div>
          <div className="text-[11px] font-bold text-white/50">poäng</div>
        </div>
        <div className="w-4/5 border-t border-white/10" />
        <div>
          <div className="mb-[3px] text-xl leading-none">🪙</div>
          <div className="text-hogalid-yellow font-display text-[22px] leading-none">{coins}</div>
          <div className="text-[10px] font-bold text-white/40">mynt</div>
        </div>
      </Card>
    </div>
  );
}
