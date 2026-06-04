import { LEVELS, TEAM_LEVELS } from '../constants';
import type { Level, TeamLevel } from '../types';

export function getLevel(points: number): Level {
  let lvl: Level = LEVELS[0]!;
  for (const l of LEVELS) if (points >= l.min) lvl = l;
  return lvl;
}

export function getLevelIndex(points: number): number {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i]!.min) idx = i;
  return idx;
}

export function getNextLevel(points: number): Level | null {
  return LEVELS.find((l) => l.min > points) ?? null;
}

export function calcProgress(points: number): number {
  const cur = getLevel(points);
  const next = getNextLevel(points);
  if (!next) return 100;
  const range = next.min - cur.min;
  const done = points - cur.min;
  return Math.round((done / range) * 100);
}

export function getTeamLevel(points: number): TeamLevel {
  let lvl: TeamLevel = TEAM_LEVELS[0]!;
  for (const l of TEAM_LEVELS) if (points >= l.min) lvl = l;
  return lvl;
}

export function getNextTeamLevel(points: number): TeamLevel | null {
  return TEAM_LEVELS.find((l) => l.min > points) ?? null;
}

export function calcTeamProgress(points: number): number {
  const cur = getTeamLevel(points);
  const next = getNextTeamLevel(points);
  if (!next) return 100;
  return Math.round(((points - cur.min) / (next.min - cur.min)) * 100);
}
