'use client';

import { forwardRef, useState } from 'react';
import { COLORS, getCelebrationLine } from '@/constants';
import { WEEKLY_LEVEL_NAMES } from '@/utils';
import { Card, ProgressBar, SkeletonBar } from '@/components/common';
import { cn } from '@/lib/cn';
import type { WeeklyChallenge, WeeklyLevelInfo } from '@/types';

const FIRE = '#ff6a00';

interface WeeklySectionProps {
  weekly: WeeklyChallenge;
  weekStart: string;
  weekValue: number;
  weekDone: boolean;
  levelInfo: WeeklyLevelInfo;
  loadingTeam: boolean;
}

/** The team's weekly challenge: progress to the next tier + the 10-level ladder. */
export const WeeklySection = forwardRef<HTMLDivElement, WeeklySectionProps>(function WeeklySection(
  { weekly, weekStart, weekValue, weekDone, levelInfo, loadingTeam },
  ref,
) {
  const [showAllLevels, setShowAllLevels] = useState(false);
  const isMax = !loadingTeam && levelInfo.isMaxLevel;
  const done = !loadingTeam && weekDone;
  const unit = weekly.type === 'touch' ? 'touch' : 'min';

  return (
    <>
      <div ref={ref} className="scroll-mt-2" />
      <div className="mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
        🤝 Veckans lagutmaning
      </div>
      <Card
        className={cn(
          'mb-5',
          isMax
            ? 'animate-fire-glow border-2 border-[#ff6a00] bg-[rgba(255,100,0,0.1)]'
            : done
              ? 'border-hogalid-yellow border-[1.5px] bg-[rgba(168,230,61,0.08)]'
              : 'border border-white/15 bg-white/[0.06]',
        )}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <div className="text-[32px]">{isMax ? '🔥' : weekly.type === 'touch' ? '🦶' : '⏱'}</div>
          <div className="flex-1">
            <div className="text-[15px] leading-snug font-bold text-white">{weekly.label}</div>
            <div className="mt-0.5 text-xs text-white/45">Vecka från {weekStart}</div>
          </div>
          {!loadingTeam && levelInfo.level > 0 && (
            <div
              className={cn(
                'rounded-[10px] border px-2.5 py-1 text-center',
                isMax
                  ? 'border-[#ff6a00] bg-[linear-gradient(135deg,#ff6a00,#ffae00)]'
                  : done
                    ? 'border-hogalid-yellow bg-[rgba(168,230,61,0.2)]'
                    : 'border-white/20 bg-white/10',
              )}
            >
              <div
                className={cn(
                  'text-[10px] font-bold tracking-wide uppercase',
                  isMax ? 'text-white' : done ? 'text-hogalid-yellow' : 'text-white/70',
                )}
              >
                Nivå {levelInfo.level}
              </div>
              <div
                className={cn(
                  'text-xs font-bold',
                  isMax ? 'text-white' : done ? 'text-hogalid-yellow' : 'text-white/90',
                )}
              >
                {isMax ? '🔥 ' : ''}
                {levelInfo.levelName}
                {isMax ? ' 🔥' : ''}
              </div>
            </div>
          )}
        </div>

        {loadingTeam ? (
          <div>
            <SkeletonBar height={14} width="60%" borderRadius={6} />
            <div className="mt-3">
              <SkeletonBar height={14} />
            </div>
            <div className="mt-2 mb-3.5 flex justify-between">
              <SkeletonBar height={12} width="25%" borderRadius={4} />
              <SkeletonBar height={12} width="40%" borderRadius={4} />
            </div>
          </div>
        ) : (
          <>
            {weekDone && (
              <div
                className={cn(
                  'mb-3 rounded-xl border px-3.5 py-2.5 text-center',
                  isMax
                    ? 'border-[#ff6a00] bg-[rgba(255,100,0,0.2)]'
                    : 'border-hogalid-yellow bg-[rgba(168,230,61,0.15)]',
                )}
              >
                <div className="mb-0.5 text-xl">{isMax ? '🔥' : '🎉'}</div>
                <div
                  className={cn(
                    'text-sm font-bold',
                    isMax ? 'text-[#ff6a00]' : 'text-hogalid-yellow',
                  )}
                >
                  {isMax
                    ? 'Ni har nått Gudarnas nivå!'
                    : 'Grattis! Ni har klarat veckans utmaning!'}
                </div>
                <div className="text-hogalid-yellow mt-1 text-xs font-extrabold">
                  {getCelebrationLine('brudar', weekly.id)}
                </div>
                {!isMax && (
                  <div className="mt-[3px] text-xs text-white/50">
                    Fortsätt träna för att klättra till nästa nivå 💪
                  </div>
                )}
              </div>
            )}

            <ProgressBar
              value={levelInfo.progress}
              color={isMax ? FIRE : weekDone ? COLORS.lime : COLORS.yellow}
              height={14}
            />
            <div className="mt-1.5 mb-3.5 flex justify-between">
              <span className="text-[13px] text-white/50">
                {weekValue} {unit}
              </span>
              <span
                className={cn(
                  'text-[13px] font-bold',
                  isMax ? 'text-[#ff6a00]' : 'text-hogalid-yellow',
                )}
              >
                {isMax
                  ? '🔥 Max uppnådd!'
                  : levelInfo.level === 0
                    ? `${weekly.goal - weekValue} kvar till Nivå 1`
                    : `${levelInfo.nextThreshold - weekValue} kvar till ${levelInfo.nextLevelName}`}
              </span>
            </div>
          </>
        )}

        {/* Level ladder */}
        <div className="flex flex-col gap-1.5">
          {WEEKLY_LEVEL_NAMES.map((name, i) => {
            const levelDone = i + 1 <= levelInfo.level;
            const isCurrent = i + 1 === levelInfo.level + 1 && !levelInfo.isMaxLevel;
            const isMaxRow = i === 9;
            const visible =
              showAllLevels || levelDone || isCurrent || (levelInfo.isMaxLevel && isMaxRow);
            if (!visible) return null;
            return (
              <div
                key={name}
                className={cn(
                  'flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5',
                  levelDone
                    ? cn(
                        'border bg-[rgba(168,230,61,0.08)]',
                        isMaxRow ? 'border-[#ff6a00]/[0.27]' : 'border-hogalid-yellow/[0.27]',
                      )
                    : isCurrent
                      ? 'border border-white/[0.12] bg-white/[0.06]'
                      : 'border-none opacity-40',
                )}
              >
                <span className="w-5 text-center text-sm">
                  {levelDone ? (isMaxRow ? '🔥' : '✅') : isCurrent ? '🎯' : '○'}
                </span>
                <span
                  className={cn(
                    'flex-1 text-[13px]',
                    levelDone
                      ? cn('font-bold', isMaxRow ? 'text-[#ff6a00]' : 'text-hogalid-yellow')
                      : isCurrent
                        ? 'font-bold text-white'
                        : 'text-white/50',
                  )}
                >
                  Nivå {i + 1} — {isMaxRow ? '🔥 ' : ''}
                  {name}
                </span>
                <span className="text-[11px] text-white/30">
                  {levelInfo.thresholds[i]} {unit}
                </span>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAllLevels((v) => !v)}
            className="mt-1 text-center text-xs text-white/40"
          >
            {showAllLevels ? '▲ Visa färre' : '▼ Visa alla 10 nivåer'}
          </button>
        </div>

        <div className="mt-2.5 text-center text-[11px] text-white/35">
          Träna och logga — det räknas automatiskt!
        </div>
      </Card>
    </>
  );
});
