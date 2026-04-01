import { DAILY_CHALLENGES, WEEKLY_CHALLENGES } from '../constants';
import { localToday } from './date';

// Get today's daily challenge (same for all players, cycles through all 70)
export function getDailyChallenge() {
  const today = localToday();
  const dayNum = Math.floor(new Date(today).getTime() / 86400000);
  return DAILY_CHALLENGES[dayNum % DAILY_CHALLENGES.length];
}

// Get this week's team challenge
export function getWeeklyChallenge() {
  const today = localToday();
  const weekNum = Math.floor(new Date(today).getTime() / (86400000 * 7));
  return WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length];
}
