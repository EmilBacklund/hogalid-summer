'use client';

import { useState } from 'react';
import { COLORS } from '@/constants';
import { Card } from '@/components/common';
import { cn } from '@/lib/cn';
import type { WeeklyHistoryEntry } from '@/types';

interface WeeklyHistoryCardProps {
  history: WeeklyHistoryEntry[];
}

/** "Förra veckan" summary + an expandable list of every completed week. */
export function WeeklyHistoryCard({ history }: WeeklyHistoryCardProps) {
  const [open, setOpen] = useState(false);
  if (history.length === 0) return null;
  const last = history[0]!;

  return (
    <Card className="mb-4">
      <div className={cn('flex items-center justify-between', history.length > 1 && 'mb-3')}>
        <div>
          <div className="mb-[3px] text-[11px] font-bold tracking-wider text-white/50 uppercase">
            Förra veckan
          </div>
          <div className="text-[13px] font-semibold text-white">{last.challenge.label}</div>
        </div>
        <div className="text-right">
          {last.levelInfo.level > 0 ? (
            <>
              <div className="text-lg">{last.levelInfo.isMaxLevel ? '🔥' : '✅'}</div>
              <div
                className="text-[13px] font-bold"
                style={{ color: last.levelInfo.isMaxLevel ? '#ff6a00' : COLORS.lime }}
              >
                Nivå {last.levelInfo.level} — {last.levelInfo.levelName}
              </div>
              <div className="text-[11px] text-white/40">
                {last.value} {last.challenge.type === 'touch' ? 'touch' : 'min'}
              </div>
            </>
          ) : (
            <>
              <div className="text-lg">❌</div>
              <div className="text-[13px] font-bold text-white/50">Ej klar</div>
              <div className="text-[11px] text-white/40">
                {last.value}/{last.challenge.goal}{' '}
                {last.challenge.type === 'touch' ? 'touch' : 'min'}
              </div>
            </>
          )}
        </div>
      </div>

      {history.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between border-t border-white/[0.08] pt-2.5"
          >
            <div className="text-xs font-semibold text-white/50">
              Alla veckor ({history.length})
            </div>
            <div className="text-base text-white/40">{open ? '▲' : '▼'}</div>
          </button>
          {open && (
            <div className="mt-2.5 flex flex-col gap-2">
              {history.map(({ weekStart, challenge, value, levelInfo }) => (
                <div
                  key={weekStart}
                  className="flex items-center gap-2.5 rounded-[10px] bg-white/[0.04] px-3 py-2"
                >
                  <div className="text-lg">
                    {levelInfo.level > 0 ? (levelInfo.isMaxLevel ? '🔥' : '✅') : '❌'}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] text-white/40">{weekStart}</div>
                    <div className="text-xs font-semibold text-white">{challenge.label}</div>
                  </div>
                  <div className="text-right">
                    {levelInfo.level > 0 ? (
                      <div
                        className="text-xs font-bold"
                        style={{ color: levelInfo.isMaxLevel ? '#ff6a00' : COLORS.lime }}
                      >
                        Nivå {levelInfo.level} — {levelInfo.levelName}
                      </div>
                    ) : (
                      <div className="text-xs text-white/40">Ej klar</div>
                    )}
                    <div className="text-[11px] text-white/30">
                      {value} {challenge.type === 'touch' ? 'touch' : 'min'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
