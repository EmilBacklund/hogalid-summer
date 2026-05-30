'use client';

import { useState } from 'react';
import { COLORS, getCelebrationLine } from '@/constants';
import { WEEKLY_LEVEL_NAMES } from '@/utils';
import { Card, ProgressBar } from '@/components/common';
import { cn } from '@/lib/cn';
import type { WeeklyChallenge, WeeklyLevelInfo } from '@/types';

interface WeeklyTeamChallengeProps {
  weekly: WeeklyChallenge;
  weekStart: string;
  weekValue: number;
  weekDone: boolean;
  levelInfo: WeeklyLevelInfo;
}

/** The team's weekly challenge card with its 10-level ladder. */
export function WeeklyTeamChallenge({
  weekly,
  weekStart,
  weekValue,
  weekDone,
  levelInfo,
}: WeeklyTeamChallengeProps) {
  const [showAll, setShowAll] = useState(false);
  const isMax = levelInfo.isMaxLevel;
  const accent = isMax ? '#ff6a00' : weekDone ? COLORS.lime : COLORS.yellow;
  const unit = weekly.type === 'touch' ? 'touch' : 'min';

  const visible = showAll
    ? WEEKLY_LEVEL_NAMES.map((_, i) => i)
    : WEEKLY_LEVEL_NAMES.map((_, i) => i).filter((i) => {
        const isLastDone = i + 1 === levelInfo.level;
        const isCurrent = i + 1 === levelInfo.level + 1 && !isMax;
        return isLastDone || isCurrent || (isMax && i === 9);
      });

  return (
    <>
      <div className="mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
        🤝 Veckans lagutmaning
      </div>
      <Card
        className={cn('mb-4', isMax && 'animate-fire-glow')}
        style={{
          border: isMax
            ? '2px solid #ff6a00'
            : weekDone
              ? `1.5px solid ${COLORS.lime}`
              : '1px solid rgba(255,255,255,0.15)',
          background: isMax
            ? 'rgba(255,100,0,0.1)'
            : weekDone
              ? 'rgba(168,230,61,0.08)'
              : 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="mb-3 flex items-center gap-2.5">
          <div className="text-[32px]">{isMax ? '🔥' : weekly.type === 'touch' ? '🦶' : '⏱'}</div>
          <div className="flex-1">
            <div className="text-[15px] leading-snug font-bold text-white">{weekly.label}</div>
            <div className="mt-0.5 text-xs text-white/40">Vecka från {weekStart}</div>
          </div>
          {levelInfo.level > 0 && (
            <div
              className="rounded-[10px] px-2.5 py-1 text-center"
              style={{
                background: isMax
                  ? 'linear-gradient(135deg, #ff6a00, #ffae00)'
                  : weekDone
                    ? 'rgba(168,230,61,0.2)'
                    : 'rgba(255,255,255,0.1)',
                border: `1px solid ${isMax ? '#ff6a00' : weekDone ? COLORS.lime : 'rgba(255,255,255,0.2)'}`,
              }}
            >
              <div
                className="text-[10px] font-bold tracking-[0.5px] uppercase"
                style={{ color: isMax ? '#fff' : COLORS.lime }}
              >
                Nivå {levelInfo.level}
              </div>
              <div className="text-xs font-bold" style={{ color: isMax ? '#fff' : COLORS.lime }}>
                {isMax ? '🔥 ' : ''}
                {levelInfo.levelName}
                {isMax ? ' 🔥' : ''}
              </div>
            </div>
          )}
        </div>

        {weekDone && (
          <div
            className="mb-3 rounded-xl px-3.5 py-2.5 text-center"
            style={{
              background: isMax ? 'rgba(255,100,0,0.2)' : 'rgba(168,230,61,0.15)',
              border: `1px solid ${isMax ? '#ff6a00' : COLORS.lime}`,
            }}
          >
            <div className="mb-0.5 text-xl">{isMax ? '🔥' : '🎉'}</div>
            <div className="text-sm font-bold" style={{ color: isMax ? '#ff6a00' : COLORS.lime }}>
              {isMax ? 'Ni har nått Gudarnas nivå!' : 'Grattis! Ni har klarat veckans utmaning!'}
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

        <ProgressBar value={levelInfo.progress} color={accent} height={14} />
        <div className="mt-1.5 mb-3.5 flex justify-between">
          <span className="text-[13px] text-white/50">
            {weekValue} {unit}
          </span>
          <span className="text-[13px] font-bold" style={{ color: accent }}>
            {isMax
              ? '🔥 Max uppnådd!'
              : levelInfo.level === 0
                ? `${weekly.goal - weekValue} kvar till Nivå 1`
                : `${levelInfo.nextThreshold - weekValue} kvar till ${levelInfo.nextLevelName}`}
          </span>
        </div>

        <div className="flex flex-col gap-[5px]">
          {WEEKLY_LEVEL_NAMES.map((name, i) => {
            if (!visible.includes(i)) return null;
            const threshold = levelInfo.thresholds[i];
            const done = i + 1 <= levelInfo.level;
            const isCurrent = i + 1 === levelInfo.level + 1 && !isMax;
            const isMaxRow = i === 9;
            return (
              <div
                key={name}
                className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5"
                style={{
                  background: done
                    ? 'rgba(168,230,61,0.08)'
                    : isCurrent
                      ? 'rgba(255,255,255,0.06)'
                      : 'transparent',
                  border: done
                    ? `1px solid ${isMaxRow ? '#ff6a00' : COLORS.lime}44`
                    : isCurrent
                      ? '1px solid rgba(255,255,255,0.12)'
                      : 'none',
                  opacity: done || isCurrent ? 1 : 0.4,
                }}
              >
                <span className="w-5 text-center text-sm">
                  {done ? (isMaxRow ? '🔥' : '✅') : isCurrent ? '🎯' : '○'}
                </span>
                <span
                  className="flex-1 text-[13px]"
                  style={{
                    color: done
                      ? isMaxRow
                        ? '#ff6a00'
                        : COLORS.lime
                      : isCurrent
                        ? '#fff'
                        : 'rgba(255,255,255,0.5)',
                    fontWeight: done || isCurrent ? 700 : 400,
                  }}
                >
                  Nivå {i + 1} — {isMaxRow ? '🔥 ' : ''}
                  {name}
                </span>
                <span className="text-[11px] text-white/30">
                  {threshold} {unit}
                </span>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-1 text-center text-xs text-white/40"
          >
            {showAll ? '▲ Visa färre' : '▼ Visa alla 10 nivåer'}
          </button>
        </div>

        <div className="mt-2.5 text-center text-[11px] text-white/35">
          Träna och logga — det räknas automatiskt!
        </div>
      </Card>
    </>
  );
}
