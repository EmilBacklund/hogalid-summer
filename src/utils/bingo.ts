import type { BingoTile } from '../types';

/** Completed rows/columns on a bingo board (indices). */
export interface LineState {
  rows: number[];
  cols: number[];
}

/** The bonus awarded for completing a line, plus human labels for the toast. */
export interface LineBonusResult {
  bonus: number;
  labels: string[];
}

/** Per-board tallies for the stats card. */
export interface BoardCounts {
  football: number;
  summer: number;
  totalPoints: number;
}

/**
 * Reorder a board so undone tiles come first (shuffled), then completed ones.
 * Uses Math.random — call once per mount and memoize.
 */
export function shuffleOpenFirst(items: BingoTile[], doneIds: string[]): BingoTile[] {
  const undone = items.filter((item) => !doneIds.includes(item.id));
  const doneItems = items.filter((item) => doneIds.includes(item.id));
  for (let i = undone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [undone[i], undone[j]] = [undone[j]!, undone[i]!];
  }
  return [...undone, ...doneItems];
}

/** Which rows and columns are fully completed for the given done-set. */
export function getBoardLineState(items: BingoTile[], doneIds: string[], cols: number): LineState {
  const doneSet = new Set(doneIds);
  const rows: number[] = [];
  const completedCols: number[] = [];
  const rowCount = Math.ceil(items.length / cols);

  for (let row = 0; row < rowCount; row++) {
    const rowItems = items.slice(row * cols, row * cols + cols);
    if (rowItems.length === cols && rowItems.every((item) => doneSet.has(item.id))) {
      rows.push(row);
    }
  }

  for (let col = 0; col < cols; col++) {
    const colItems: BingoTile[] = [];
    for (let row = 0; row < rowCount; row++) {
      const item = items[row * cols + col];
      if (item) colItems.push(item);
    }
    if (colItems.length === rowCount && colItems.every((item) => doneSet.has(item.id))) {
      completedCols.push(col);
    }
  }

  return { rows, cols: completedCols };
}

/** Football / summer / total-points tallies for the completed tiles. */
export function getBoardCounts(items: BingoTile[], doneIds: string[]): BoardCounts {
  return {
    football: doneIds.filter((id) => items.find((item) => item.id === id)?.cat === '⚽').length,
    summer: doneIds.filter((id) => items.find((item) => item.id === id)?.cat === '☀️').length,
    totalPoints: doneIds.reduce(
      (sum, id) => sum + (items.find((item) => item.id === id)?.points || 0),
      0,
    ),
  };
}

/**
 * The line-completion bonus for marking `nextId`, given the lines already
 * completed (`previousLineState`). Only newly-completed rows/columns count.
 * The server clamps the reported bonus (SEC H1, points.ts MAX_LINE_BONUS).
 */
export function computeLineBonus(
  items: BingoTile[],
  doneIds: string[],
  nextId: string,
  cols: number,
  rowBonus: number,
  colBonus: number,
  previousLineState: LineState,
): LineBonusResult {
  const nextDoneSet = new Set([...doneIds, nextId]);
  const index = items.findIndex((item) => item.id === nextId);
  if (index < 0) return { bonus: 0, labels: [] };

  const rowCount = Math.ceil(items.length / cols);
  const row = Math.floor(index / cols);
  const col = index % cols;
  let bonus = 0;
  const labels: string[] = [];

  const rowItems = items.slice(row * cols, row * cols + cols);
  const rowComplete =
    rowItems.length === cols && rowItems.every((item) => nextDoneSet.has(item.id));
  if (rowComplete && !previousLineState.rows.includes(row)) {
    bonus += rowBonus;
    labels.push(`Rad ${row + 1}`);
  }

  const colItems: BingoTile[] = [];
  for (let r = 0; r < rowCount; r++) {
    const item = items[r * cols + col];
    if (item) colItems.push(item);
  }
  const colComplete =
    colItems.length === rowCount && colItems.every((item) => nextDoneSet.has(item.id));
  if (colComplete && !previousLineState.cols.includes(col)) {
    bonus += colBonus;
    labels.push(`Kolumn ${col + 1}`);
  }

  return { bonus, labels };
}
