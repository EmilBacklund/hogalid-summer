'use client';

import { ArrowRight } from 'lucide-react';
import { COLORS, TEAM_LEVELS } from '@/constants';
import { Card, ProgressBar } from '@/components/common';
import type { TeamMemberStats } from '@/utils';
import type { TeamLevel } from '@/types';

/** Current team level + progress to the next. */
export function TeamLevelCard({
  teamLevel,
  nextTeamLevel,
  teamProgress,
  teamPoints,
}: {
  teamLevel: TeamLevel;
  nextTeamLevel: TeamLevel | null;
  teamProgress: number;
  teamPoints: number;
}) {
  const color = teamLevel.color || COLORS.lime;
  return (
    <Card
      className="mb-4"
      style={{ border: `2px solid ${color}`, background: 'rgba(0,40,100,0.4)' }}
    >
      <div className="mb-2.5 flex items-center gap-3">
        <div className="text-[44px] leading-none">{teamLevel.icon}</div>
        <div>
          <div className="text-xs font-semibold tracking-wider text-white/60 uppercase">
            Lagets nivå
          </div>
          <div className="font-display text-2xl leading-[1.1]" style={{ color }}>
            {teamLevel.name}
          </div>
        </div>
      </div>
      <ProgressBar value={teamProgress} color={color} height={14} />
      <div className="mt-1.5 flex justify-between">
        <span className="text-xs text-white/40">{teamPoints.toLocaleString('sv')} poäng</span>
        {nextTeamLevel ? (
          <span className="inline-flex items-center gap-[3px] text-xs text-white/40">
            <ArrowRight size={14} /> {nextTeamLevel.icon} {nextTeamLevel.name} (
            {(nextTeamLevel.min - teamPoints).toLocaleString('sv')} kvar)
          </span>
        ) : (
          <span className="text-hogalid-yellow text-xs">🏆 Maxnivå!</span>
        )}
      </div>
    </Card>
  );
}

/** Teaser of the next few team levels ahead. */
export function UpcomingLevels({ teamLevel }: { teamLevel: TeamLevel }) {
  const currentIdx = TEAM_LEVELS.findIndex((l) => l.name === teamLevel.name);
  const upcoming = TEAM_LEVELS.slice(currentIdx + 1, currentIdx + 4);
  if (upcoming.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
        Kommande nivåer
      </div>
      <div className="flex gap-2">
        {upcoming.map((lvl, i) => (
          <div
            key={lvl.name}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-2 py-2.5 text-center"
            style={{ opacity: 1 - i * 0.2 }}
          >
            <div className="text-[22px]">{lvl.icon}</div>
            <div className="mt-[3px] text-[11px] font-semibold text-white/60">{lvl.name}</div>
            <div className="mt-0.5 text-[10px] text-white/30">{lvl.min.toLocaleString('sv')} p</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Consecutive-day team streak with an encouraging message. */
export function TeamStreakCard({ streak }: { streak: number }) {
  const message =
    streak === 0
      ? 'Ingen har loggat idag — håll strecket vid liv! 💪'
      : streak === 1
        ? 'Bra start — kom tillbaka imorgon! 🌱'
        : streak < 7
          ? 'Bra jobbat laget — fortsätt! 🌟'
          : streak < 14
            ? 'Över en vecka — ni är oslagbara! 🏆'
            : 'Legendarisk streak — WOW! 👑';
  return (
    <Card className="mb-4 flex items-center gap-4">
      <div className="text-[44px] leading-none">🔥</div>
      <div className="flex-1">
        <div className="text-xs font-semibold tracking-wider text-white/60 uppercase">
          Lagstreak
        </div>
        <div className="text-hogalid-yellow font-display text-[32px] leading-[1.1]">
          {streak}{' '}
          <span className="text-lg text-white/50">dag{streak !== 1 ? 'ar' : ''} i rad</span>
        </div>
        <div className="mt-[3px] text-xs text-white/35">{message}</div>
      </div>
    </Card>
  );
}

interface StatRow {
  label: string;
  val: string | number;
  icon: string;
}

/** Whole-team totals list. */
export function TeamTotals({ rows }: { rows: StatRow[] }) {
  return (
    <Card className="mb-4">
      <div className="mb-2.5 text-[13px] font-semibold text-white/70">Lagets totaler</div>
      {rows.map(({ label, val, icon }) => (
        <div key={label} className="mb-2 flex items-center justify-between">
          <span className="text-sm text-white/60">
            {icon} {label}
          </span>
          <span className="text-[15px] font-bold text-white">{val}</span>
        </div>
      ))}
    </Card>
  );
}

/** The current player's personal contribution to the team. */
export function MyContribution({ stats }: { stats: TeamMemberStats }) {
  const rows: StatRow[] = [
    { label: 'Mina träningsminuter', val: stats.totalMinutes, icon: '⏱' },
    { label: 'Mina touch', val: stats.totalTouch, icon: '🦶' },
    { label: 'Mina pass', val: stats.totalLogs, icon: '📅' },
    { label: 'Mina bingo-uppdrag', val: stats.bingoCount || 0, icon: '🌞' },
  ];
  return (
    <Card style={{ border: `1.5px solid ${COLORS.lime}` }}>
      <div className="text-hogalid-yellow mb-2.5 text-sm font-bold">Mitt bidrag till laget</div>
      {rows.map(({ label, val, icon }) => (
        <div key={label} className="mb-1.5 flex items-center justify-between">
          <span className="text-[13px] text-white/60">
            {icon} {label}
          </span>
          <span className="text-hogalid-yellow text-[15px] font-bold">{val}</span>
        </div>
      ))}
    </Card>
  );
}
