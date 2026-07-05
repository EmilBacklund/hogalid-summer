import { describe, expect, it } from 'vitest';
import { calcProgress, getLevel, getLevelIndex, getNextLevel } from './levels';
import { LEVELS } from '../constants';

const LAST = LEVELS[LEVELS.length - 1]!;

describe('levels', () => {
  it('getLevel returns the first level at 0 points', () => {
    expect(getLevel(0)).toEqual(LEVELS[0]);
  });

  it('getLevel returns the highest level past the last threshold', () => {
    expect(getLevel(LAST.min + 1000)).toEqual(LAST);
  });

  it('getNextLevel is null at max', () => {
    expect(getNextLevel(LAST.min)).toBeNull();
  });

  it('calcProgress is 100 at max level', () => {
    expect(calcProgress(LAST.min)).toBe(100);
  });

  it('calcProgress is between 0 and 100 mid-level', () => {
    const p = calcProgress(200);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(100);
  });

  it('getLevelIndex increases with points', () => {
    expect(getLevelIndex(0)).toBe(0);
    expect(getLevelIndex(LAST.min)).toBe(LEVELS.length - 1);
  });

  it('prestige levels continue past Sommarlegend (19 050)', () => {
    // Calibrated mid-season 2026: the top player (~43 000 p at halftime)
    // must land mid-prestige with the next level within reach.
    expect(getLevel(19050).name).toBe('Sommarlegend');
    expect(getNextLevel(19050)).not.toBeNull();
    expect(getLevel(43298).name).toBe('Sommar-GOAT');
    expect(getNextLevel(43298)?.min).toBe(44000);
    expect(LAST.min).toBe(68000);
  });
});
