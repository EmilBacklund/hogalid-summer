import { DAILY_CHALLENGES, WEEKLY_CHALLENGES } from '../constants';
import { localToday } from './date';

// Get today's daily challenge (same for all players, cycles through all)
// If seasonStart is provided, day 0 = first day of season
export function getDailyChallenge(seasonStart) {
  const today = localToday();
  const base = seasonStart || today;
  const dayNum = Math.floor((new Date(today).getTime() - new Date(base).getTime()) / 86400000);
  const index = ((dayNum % DAILY_CHALLENGES.length) + DAILY_CHALLENGES.length) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[index];
}

// Get this week's team challenge
// If seasonStart is provided, week 0 = first week of season
export function getWeeklyChallenge(seasonStart) {
  const today = localToday();
  const base = seasonStart || today;
  const weekNum = Math.floor((new Date(today).getTime() - new Date(base).getTime()) / (86400000 * 7));
  const index = ((weekNum % WEEKLY_CHALLENGES.length) + WEEKLY_CHALLENGES.length) % WEEKLY_CHALLENGES.length;
  return WEEKLY_CHALLENGES[index];
}
