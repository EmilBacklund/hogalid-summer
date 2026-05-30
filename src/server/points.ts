import {
  EXERCISES,
  SUMMER_ACTIVITIES,
  BINGO,
  BONUS_BINGO,
  BINGO_TWO,
  ADULT_BINGO,
  DAILY_CHALLENGES,
} from '@/constants';
import type { ExerciseEntry } from '@/types';

/**
 * Server-authoritative scoring (SEC H1). The client never gets to decide how
 * many points a log is worth — these functions are the single source of truth.
 */

const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
const SUMMER_BY_ID = new Map(SUMMER_ACTIVITIES.map((a) => [a.id, a]));

/**
 * Clamp + sanitize client-submitted exercise entries: drop unknown ids,
 * floor to integers, and clamp each value to that exercise's configured max.
 */
export function clampExercises(entries: ExerciseEntry[]): ExerciseEntry[] {
  const out: ExerciseEntry[] = [];
  for (const entry of entries) {
    const def = EXERCISE_BY_ID.get(entry.id);
    if (!def) continue;
    const value = Math.max(0, Math.min(Math.floor(Number(entry.value) || 0), def.max));
    if (value > 0) out.push({ id: entry.id, value });
  }
  return out;
}

/** Clamp a summer-activity value (ice cream / swim / pages) to its max. */
export function clampSummer(field: 'iceCream' | 'swim' | 'pages', value: number): number {
  const def = SUMMER_BY_ID.get(field);
  const max = def?.max ?? 0;
  return Math.max(0, Math.min(Math.floor(Number(value) || 0), max));
}

/** Free-training minutes derived authoritatively from the clamped exercises. */
export function trainingMinutes(entries: ExerciseEntry[]): number {
  return entries.find((e) => e.id === 'fritraning')?.value ?? 0;
}

/**
 * Points for a normal training log: touch (every non-time, non-`skott`
 * exercise) + free-training minutes × 5. `skott` and time entries award no
 * direct points. Mirrors the original client formula, now enforced server-side.
 */
export function computeTrainingPoints(entries: ExerciseEntry[]): number {
  let touch = 0;
  for (const entry of entries) {
    const def = EXERCISE_BY_ID.get(entry.id);
    if (!def) continue;
    if (def.isTime || entry.id === 'skott') continue;
    touch += entry.value;
  }
  const mins = trainingMinutes(entries);
  return touch + mins * 5;
}

export type BingoBoard = 'classic' | 'adult' | 'bonus' | 'bingoTwo';

const BOARD_TILES = {
  classic: BINGO,
  adult: ADULT_BINGO,
  bonus: BONUS_BINGO,
  bingoTwo: BINGO_TWO,
} as const;

/** Whether a challenge id is a real tile on the given board. */
export function isBingoTile(board: BingoBoard, challengeId: string): boolean {
  return BOARD_TILES[board].some((t) => t.id === challengeId);
}

/** A bingo tile's base bonus points, authoritative from constants (0 if none). */
export function bingoTilePoints(board: BingoBoard, challengeId: string): number {
  const tile = BOARD_TILES[board].find((t) => t.id === challengeId);
  return tile?.points ?? 0;
}

/** Whether the tile is in the football (⚽) category — sets the streak flag. */
export function isFootballTile(board: BingoBoard, challengeId: string): boolean {
  const tile = BOARD_TILES[board].find((t) => t.id === challengeId);
  return tile?.cat === '⚽';
}

/**
 * Hard ceiling for a single bingo line-completion bonus (SEC H1). The full
 * row/column bonus engine still lives client-side (ported in S9); until then we
 * accept the client's reported line bonus but clamp it so it can't be abused.
 * TODO(S9): recompute the line bonus server-side from a shared util.
 */
export const MAX_LINE_BONUS = 500;

export function clampLineBonus(value: number): number {
  return Math.max(0, Math.min(Math.floor(Number(value) || 0), MAX_LINE_BONUS));
}

/** Penalty easter-egg score: goals scored out of 10. */
export const MAX_PENALTY_SCORE = 10;

export function clampPenaltyScore(value: number): number {
  return Math.max(0, Math.min(Math.floor(Number(value) || 0), MAX_PENALTY_SCORE));
}

/** A daily challenge's points, authoritative from constants (0 if unknown id). */
export function dailyChallengePoints(challengeId: string): number {
  return DAILY_CHALLENGES.find((c) => c.id === challengeId)?.points ?? 0;
}

export function isDailyChallenge(challengeId: string): boolean {
  return DAILY_CHALLENGES.some((c) => c.id === challengeId);
}
