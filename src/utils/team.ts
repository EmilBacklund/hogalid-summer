import { EXERCISES } from '../constants';
import { computeStats } from './stats';
import { localToday } from './date';
import type { Stats, User } from '../types';

/** Per-player stats plus the bits the team views need alongside them. */
export type TeamMemberStats = Stats & { alias: string; bingo: string[] };

/** Aggregated, team-wide totals derived from every player's logs. */
export interface TeamAggregate {
  allStats: TeamMemberStats[];
  totalMinutes: number;
  totalTouch: number;
  totalLogs: number;
  totalBingo: number;
  uniqueBingo: number;
  totalIceCream: number;
  totalSwim: number;
  totalPages: number;
  /** Touch + minutes×5 — the team-level points used for team levels. */
  points: number;
  streak: number;
}

function logQualifies(log: User['logs'][number]): boolean {
  if (log.bingoFootball) return true;
  if (log.bingo) return false;
  const mins = (log.exercises || []).find((e) => e.id === 'fritraning')?.value || 0;
  const touch = (log.exercises || []).reduce((s, e) => {
    const ex = EXERCISES.find((x) => x.id === e.id);
    return s + (ex && !ex.isTime && e.id !== 'skott' ? e.value || 0 : 0);
  }, 0);
  return mins >= 5 || touch >= 30;
}

/** The team's current activity streak (consecutive days with a qualifying log). */
function computeTeamStreak(allUsers: User[]): number {
  const activeDays = new Set(
    allUsers.flatMap((u) =>
      (u.logs || [])
        .filter(logQualifies)
        .map((l) => l.date)
        .filter(Boolean),
    ),
  );
  const sorted = [...activeDays].sort();
  let cur = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) cur = 1;
    else {
      const diff = (new Date(sorted[i]!).getTime() - new Date(sorted[i - 1]!).getTime()) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    }
  }
  if (sorted.length === 0) return 0;
  const last = sorted[sorted.length - 1]!;
  const diffToday = (new Date(localToday()).getTime() - new Date(last).getTime()) / 86400000;
  return diffToday <= 1 ? cur : 0;
}

/** Aggregate every player's logs into team totals + the team streak. */
export function computeTeamAggregate(allUsers: User[]): TeamAggregate {
  const allStats: TeamMemberStats[] = allUsers.map((u) => ({
    alias: u.alias,
    bingo: u.bingo || [],
    ...computeStats(u),
  }));

  const totalMinutes = allStats.reduce((s, u) => s + u.totalMinutes, 0);
  const totalTouch = allStats.reduce((s, u) => s + u.totalTouch, 0);
  const totalLogs = allStats.reduce((s, u) => s + u.totalLogs, 0);
  const totalBingo = allStats.reduce((s, u) => s + u.bingo.length, 0);
  const uniqueBingo = new Set(allStats.flatMap((u) => u.bingo)).size;
  const sumLogs = (pick: (l: User['logs'][number]) => number) =>
    allUsers.reduce((s, u) => s + (u.logs || []).reduce((a, l) => a + pick(l), 0), 0);

  return {
    allStats,
    totalMinutes,
    totalTouch,
    totalLogs,
    totalBingo,
    uniqueBingo,
    totalIceCream: sumLogs((l) => l.iceCream || 0),
    totalSwim: sumLogs((l) => l.swim || 0),
    totalPages: sumLogs((l) => l.pages || 0),
    points: totalTouch + totalMinutes * 5,
    streak: computeTeamStreak(allUsers),
  };
}
