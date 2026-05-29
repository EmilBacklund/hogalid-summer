import { DAILY_CHALLENGES, WEEKLY_CHALLENGES } from '../constants';
import { localToday } from './date';
import type { DailyChallenge, WeeklyChallenge, WeeklyLevelInfo } from '../types';

export const WEEKLY_LEVEL_NAMES = [
  'Brons',
  'Silver',
  'Guld',
  'Platina',
  'Diamant',
  'Mästare',
  'Elite',
  'Legend',
  'Odödlig',
  'Gudarnas nivå',
];

function parseDateKey(dateKey: string): { year: number; month: number; day: number } | null {
  const [year, month, day] = (dateKey || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

function dateKeyToDayNumber(dateKey: string): number {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return 0;
  return Math.floor(Date.UTC(parsed.year, parsed.month - 1, parsed.day) / 86400000);
}

export function getWeeklyLevelInfo(value: number, goal: number): WeeklyLevelInfo {
  // Build thresholds for all 10 levels: goal, goal*1.2, goal*1.2², ...
  const thresholds: number[] = [];
  let t = goal;
  for (let i = 0; i < 10; i++) {
    thresholds.push(Math.round(t));
    t *= 1.2;
  }

  // Find current level (how many thresholds have been passed)
  let level = 0;
  for (let i = 0; i < 10; i++) {
    if (value >= thresholds[i]!) level = i + 1;
    else break;
  }

  const isMaxLevel = level === 10;
  const levelName = level > 0 ? (WEEKLY_LEVEL_NAMES[level - 1] ?? null) : null;
  const nextLevelName = level < 10 ? (WEEKLY_LEVEL_NAMES[level] ?? null) : null;

  let progress: number;
  if (isMaxLevel) {
    progress = 100;
  } else if (level === 0) {
    progress = Math.round((value / thresholds[0]!) * 100);
  } else {
    const from = thresholds[level - 1]!;
    const to = thresholds[level]!;
    progress = Math.round(((value - from) / (to - from)) * 100);
  }

  return {
    level,
    levelName,
    nextLevelName,
    isMaxLevel,
    progress: Math.min(100, Math.max(0, progress)),
    nextThreshold: isMaxLevel ? thresholds[9]! : thresholds[level]!,
    thresholds,
  };
}

// Today's daily challenge (same for all players). If seasonStart is provided,
// day 0 = first day of season.
export function getDailyChallenge(seasonStart?: string | null): DailyChallenge {
  const today = localToday();
  const dayNum = seasonStart
    ? dateKeyToDayNumber(today) - dateKeyToDayNumber(seasonStart)
    : dateKeyToDayNumber(today);
  const index =
    ((dayNum % DAILY_CHALLENGES.length) + DAILY_CHALLENGES.length) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[index]!;
}

// This week's team challenge. If seasonStart is provided, week 0 = first week.
export function getWeeklyChallenge(seasonStart?: string | null): WeeklyChallenge {
  const today = localToday();
  const dayNum = seasonStart
    ? dateKeyToDayNumber(today) - dateKeyToDayNumber(seasonStart)
    : dateKeyToDayNumber(today);
  const weekNum = Math.floor(dayNum / 7);
  const index =
    ((weekNum % WEEKLY_CHALLENGES.length) + WEEKLY_CHALLENGES.length) % WEEKLY_CHALLENGES.length;
  return WEEKLY_CHALLENGES[index]!;
}
