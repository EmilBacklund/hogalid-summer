import { EXERCISES, WEEKLY_CHALLENGES } from '../constants';
import { getWeekStart } from './date';
import { getWeeklyLevelInfo } from './challenges';
import { apiPost } from './api';
import type { User, WeeklyChallenge, WeeklyHistoryEntry } from '../types';

function addDays(dateStr: string, days: number): string {
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

export function getWeeklyChallengeForDate(
  date: string,
  seasonStart?: string | null,
): WeeklyChallenge {
  const base = seasonStart || date;
  const weekNum = Math.floor(
    (new Date(date).getTime() - new Date(base).getTime()) / (86400000 * 7),
  );
  const index =
    ((weekNum % WEEKLY_CHALLENGES.length) + WEEKLY_CHALLENGES.length) % WEEKLY_CHALLENGES.length;
  return WEEKLY_CHALLENGES[index]!;
}

function computeWeekValue(
  allUsers: User[],
  weekStart: string,
  weekEnd: string,
  challengeType: string,
): number {
  let touch = 0;
  let minutes = 0;
  allUsers.forEach((u) => {
    (u.logs || []).forEach((l) => {
      if (!l.bingo && l.date >= weekStart && l.date <= weekEnd) {
        minutes += l.minutes || 0;
        (l.exercises || []).forEach((e) => {
          const ex = EXERCISES.find((x) => x.id === e.id);
          if (ex && !ex.isTime && e.id !== 'skott') touch += e.value || 0;
        });
      }
    });
  });
  return challengeType === 'touch' ? touch : minutes;
}

// Returns all completed weeks since season start, most recent first.
export function computeWeeklyHistory(
  allUsers: User[],
  seasonStart?: string | null,
): WeeklyHistoryEntry[] {
  if (!seasonStart || !allUsers || allUsers.length === 0) return [];

  const today = new Date();
  const todayStr =
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0');
  const thisWeekStart = getWeekStart(todayStr);
  const seasonWeekStart = getWeekStart(seasonStart);

  const results: WeeklyHistoryEntry[] = [];
  let weekStart = seasonWeekStart;

  while (weekStart < thisWeekStart) {
    const weekEnd = addDays(weekStart, 6);
    const challenge = getWeeklyChallengeForDate(weekStart, seasonStart);
    const value = computeWeekValue(allUsers, weekStart, weekEnd, challenge.type);
    const levelInfo = getWeeklyLevelInfo(value, challenge.goal);
    results.push({ weekStart, weekEnd, challenge, value, levelInfo });
    weekStart = addDays(weekStart, 7);
  }

  return results.reverse();
}

// Saves the previous week's result to the DB (called as a background task).
export async function saveWeeklyResult(
  allUsers: User[],
  seasonStart?: string | null,
): Promise<void> {
  if (!seasonStart || !allUsers || allUsers.length === 0) return;

  const today = new Date();
  const todayStr =
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0');
  const thisWeekStart = getWeekStart(todayStr);
  const prevWeekStart = addDays(thisWeekStart, -7);
  const prevWeekEnd = addDays(thisWeekStart, -1);

  if (prevWeekStart < getWeekStart(seasonStart)) return;

  const challenge = getWeeklyChallengeForDate(prevWeekStart, seasonStart);
  const value = computeWeekValue(allUsers, prevWeekStart, prevWeekEnd, challenge.type);
  const levelInfo = getWeeklyLevelInfo(value, challenge.goal);

  await apiPost('/users?action=saveweeklyresult', {
    weekStart: prevWeekStart,
    challengeLabel: challenge.label,
    challengeType: challenge.type,
    value,
    goal: challenge.goal,
    level: levelInfo.level,
    levelName: levelInfo.levelName,
  });
}
