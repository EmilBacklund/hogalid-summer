import { describe, expect, it } from 'vitest';
import { getWeeklyLevelInfo } from './challenges';

describe('getWeeklyLevelInfo', () => {
  it('is level 0 below the goal', () => {
    const info = getWeeklyLevelInfo(0, 1000);
    expect(info.level).toBe(0);
    expect(info.levelName).toBeNull();
    expect(info.progress).toBe(0);
  });

  it('reaches level 1 (Brons) at the goal', () => {
    const info = getWeeklyLevelInfo(1000, 1000);
    expect(info.level).toBe(1);
    expect(info.levelName).toBe('Brons');
  });

  it('caps at level 10 (max)', () => {
    const info = getWeeklyLevelInfo(10_000_000, 1000);
    expect(info.level).toBe(10);
    expect(info.isMaxLevel).toBe(true);
    expect(info.progress).toBe(100);
    expect(info.nextLevelName).toBeNull();
  });

  it('keeps progress within [0, 100]', () => {
    const info = getWeeklyLevelInfo(1500, 1000);
    expect(info.progress).toBeGreaterThanOrEqual(0);
    expect(info.progress).toBeLessThanOrEqual(100);
    expect(info.thresholds).toHaveLength(10);
  });
});
