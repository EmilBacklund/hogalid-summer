import { describe, expect, it } from 'vitest';
import { getWeekStart, localToday } from './date';

describe('getWeekStart', () => {
  it('always returns a Monday', () => {
    for (const d of ['2026-05-25', '2026-05-27', '2026-05-31', '2026-06-01']) {
      expect(new Date(getWeekStart(d)).getDay()).toBe(1);
    }
  });

  it('is idempotent', () => {
    const ws = getWeekStart('2026-05-27');
    expect(getWeekStart(ws)).toBe(ws);
  });

  it('maps every day of one week to the same Monday', () => {
    const week = ['2026-05-25', '2026-05-26', '2026-05-29', '2026-05-31'];
    const mondays = new Set(week.map((d) => getWeekStart(d)));
    expect(mondays.size).toBe(1);
  });
});

describe('localToday', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(localToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
