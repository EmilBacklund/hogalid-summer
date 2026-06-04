import { describe, expect, it } from 'vitest';
import { getBoardLineState, getBoardCounts, computeLineBonus, shuffleOpenFirst } from './bingo';
import type { BingoTile } from '../types';

// A 2×2 board: row 0 = [a, b], row 1 = [c, d]; column 0 = [a, c].
const BOARD: BingoTile[] = [
  { id: 'a', cat: '⚽', label: 'a', points: 10 },
  { id: 'b', cat: '☀️', label: 'b', points: 20 },
  { id: 'c', cat: '⚽', label: 'c', points: 30 },
  { id: 'd', cat: '☀️', label: 'd', points: 40 },
];

describe('getBoardLineState', () => {
  it('reports no lines when incomplete', () => {
    expect(getBoardLineState(BOARD, ['a', 'd'], 2)).toEqual({ rows: [], cols: [] });
  });

  it('detects a completed row', () => {
    expect(getBoardLineState(BOARD, ['a', 'b'], 2)).toEqual({ rows: [0], cols: [] });
  });

  it('detects a completed column', () => {
    expect(getBoardLineState(BOARD, ['a', 'c'], 2)).toEqual({ rows: [], cols: [0] });
  });

  it('detects all lines when the board is full', () => {
    expect(getBoardLineState(BOARD, ['a', 'b', 'c', 'd'], 2)).toEqual({
      rows: [0, 1],
      cols: [0, 1],
    });
  });
});

describe('getBoardCounts', () => {
  it('tallies football, summer and total points of done tiles', () => {
    expect(getBoardCounts(BOARD, ['a', 'b', 'c'])).toEqual({
      football: 2,
      summer: 1,
      totalPoints: 60,
    });
  });
});

describe('computeLineBonus', () => {
  const empty = { rows: [], cols: [] };

  it('awards the row bonus when marking the tile that completes a row', () => {
    const result = computeLineBonus(BOARD, ['a'], 'b', 2, 30, 50, empty);
    expect(result.bonus).toBe(30);
    expect(result.labels).toContain('Rad 1');
  });

  it('awards row + column when a tile completes both at once', () => {
    // 'd' completes row 1 (c,d) and column 1 (b,d).
    const result = computeLineBonus(BOARD, ['a', 'b', 'c'], 'd', 2, 30, 50, {
      rows: [0],
      cols: [0],
    });
    expect(result.bonus).toBe(80);
    expect(result.labels).toEqual(['Rad 2', 'Kolumn 2']);
  });

  it('does not re-award rows/columns already in the previous line state', () => {
    // 'a' completes row 0 (a,b) and column 0 (a,c), but both are already counted.
    const result = computeLineBonus(BOARD, ['b', 'c', 'd'], 'a', 2, 30, 50, {
      rows: [0],
      cols: [0],
    });
    expect(result.bonus).toBe(0);
    expect(result.labels).toEqual([]);
  });

  it('returns nothing for an unknown tile', () => {
    expect(computeLineBonus(BOARD, [], 'zzz', 2, 30, 50, empty)).toEqual({ bonus: 0, labels: [] });
  });
});

describe('shuffleOpenFirst', () => {
  it('puts every undone tile before every done tile', () => {
    const result = shuffleOpenFirst(BOARD, ['b']);
    expect(result).toHaveLength(4);
    expect(result[result.length - 1]!.id).toBe('b');
    expect(
      result
        .slice(0, 3)
        .map((t) => t.id)
        .sort(),
    ).toEqual(['a', 'c', 'd']);
  });
});
