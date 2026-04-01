import { LEVELS, TEAM_LEVELS } from '../constants';

export function getLevel(points) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) { if (points >= l.min) lvl = l; }
  return lvl;
}

export function getLevelIndex(points) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) { if (points >= LEVELS[i].min) idx = i; }
  return idx;
}

export function getNextLevel(points) {
  return LEVELS.find((l) => l.min > points) || null;
}

export function calcProgress(points) {
  const cur = getLevel(points);
  const next = getNextLevel(points);
  if (!next) return 100;
  const range = next.min - cur.min;
  const done = points - cur.min;
  return Math.round((done / range) * 100);
}

export function getTeamLevel(points) {
  let lvl = TEAM_LEVELS[0];
  for (const l of TEAM_LEVELS) { if (points >= l.min) lvl = l; }
  return lvl;
}

export function getNextTeamLevel(points) {
  return TEAM_LEVELS.find((l) => l.min > points) || null;
}

export function calcTeamProgress(points) {
  const cur = getTeamLevel(points);
  const next = getNextTeamLevel(points);
  if (!next) return 100;
  return Math.round(((points - cur.min) / (next.min - cur.min)) * 100);
}
