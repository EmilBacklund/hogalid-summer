import { describe, expect, it } from 'vitest';
import { getPhotoChallenge, getWeeklyLevelInfo } from './challenges';
import { PHOTO_CHALLENGES } from '../constants';

describe('getPhotoChallenge', () => {
  it('starts with Sommarens glass the anchor week', () => {
    expect(getPhotoChallenge('2026-07-06').id).toBe('glass');
    // Same challenge all week, through Sunday.
    expect(getPhotoChallenge('2026-07-12').id).toBe('glass');
  });

  it('clamps weeks before the anchor to the first challenge', () => {
    expect(getPhotoChallenge('2026-06-29').id).toBe('glass');
    expect(getPhotoChallenge('2026-06-01').id).toBe('glass');
  });

  it('advances one challenge per week in the configured order', () => {
    expect(getPhotoChallenge('2026-07-13').id).toBe('guldtimmen');
    expect(getPhotoChallenge('2026-07-20').id).toBe('sommarmys');
    // Week 9 (last of the ten).
    expect(getPhotoChallenge('2026-09-07').id).toBe('minstingen');
  });

  it('cycles back to the first challenge after the last', () => {
    expect(getPhotoChallenge('2026-09-14').id).toBe(PHOTO_CHALLENGES[0]!.id);
  });
});

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
