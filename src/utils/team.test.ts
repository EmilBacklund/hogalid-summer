import { describe, expect, it } from 'vitest';
import { computeTeamAggregate } from './team';
import type { Log, User } from '../types';

function log(partial: Partial<Log>): Log {
  return {
    id: 1,
    date: '2026-06-01',
    exercises: [],
    points: 0,
    minutes: 0,
    bingo: false,
    bingoFootball: false,
    dailyChallenge: false,
    iceCream: 0,
    swim: 0,
    pages: 0,
    title: '',
    createdAt: '2026-06-01T00:00:00.000Z',
    ...partial,
  };
}

function user(alias: string, partial: Partial<User>): User {
  return {
    alias,
    displayAlias: alias,
    avatarConfig: {},
    unlockedItems: [],
    highscores: {},
    secretFlags: {},
    joinedAt: null,
    photoCount: 0,
    logs: [],
    bingo: [],
    bonusBingo: [],
    bingoTwo: [],
    adultBingo: [],
    completedDaily: {},
    ...partial,
  };
}

describe('computeTeamAggregate', () => {
  it('sums minutes, touch, logs and summer activities across players', () => {
    const users = [
      user('a', {
        logs: [
          log({ exercises: [{ id: 'fritraning', value: 30 }], minutes: 30, iceCream: 1, swim: 2 }),
          log({ exercises: [{ id: 'toetaps', value: 100 }], pages: 10 }),
        ],
      }),
      user('b', {
        logs: [log({ exercises: [{ id: 'fritraning', value: 10 }], minutes: 10, swim: 1 })],
        bingo: ['b01', 'b02'],
      }),
    ];
    const agg = computeTeamAggregate(users);
    expect(agg.totalMinutes).toBe(40); // 30 + 10 free-training minutes
    expect(agg.totalTouch).toBe(100); // toetaps only (fritraning is time, skott excluded)
    expect(agg.totalLogs).toBe(3);
    expect(agg.totalIceCream).toBe(1);
    expect(agg.totalSwim).toBe(3);
    expect(agg.totalPages).toBe(10);
    expect(agg.totalBingo).toBe(2);
    expect(agg.uniqueBingo).toBe(2);
    expect(agg.points).toBe(100 + 40 * 5); // touch + minutes×5
    expect(agg.allStats).toHaveLength(2);
  });

  it('counts unique bingo tiles across overlapping players', () => {
    const users = [user('a', { bingo: ['b01', 'b02'] }), user('b', { bingo: ['b02', 'b03'] })];
    const agg = computeTeamAggregate(users);
    expect(agg.totalBingo).toBe(4);
    expect(agg.uniqueBingo).toBe(3);
  });

  it('returns zeroed totals for an empty team', () => {
    const agg = computeTeamAggregate([]);
    expect(agg.points).toBe(0);
    expect(agg.streak).toBe(0);
    expect(agg.allStats).toEqual([]);
  });
});
