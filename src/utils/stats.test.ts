import { describe, expect, it } from 'vitest';
import { computeStats } from './stats';
import type { Log, User } from '../types';

function makeUser(partial: Partial<User> = {}): User {
  return {
    alias: 'test',
    displayAlias: 'Test',
    role: 'player',
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

function makeLog(partial: Partial<Log> = {}): Log {
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
    createdAt: '',
    ...partial,
  };
}

describe('computeStats', () => {
  it('returns zeroed stats for a user with no logs', () => {
    const s = computeStats(makeUser());
    expect(s.totalPoints).toBe(0);
    expect(s.totalLogs).toBe(0);
    expect(s.streak).toBe(0);
    expect(s.totalTouch).toBe(0);
  });

  it('sums points and counts logs', () => {
    const s = computeStats(
      makeUser({ logs: [makeLog({ points: 50 }), makeLog({ id: 2, points: 30 })] }),
    );
    expect(s.totalPoints).toBe(80);
    expect(s.totalLogs).toBe(2);
  });

  it('counts touch but excludes shots and free-training minutes', () => {
    const s = computeStats(
      makeUser({
        logs: [
          makeLog({
            exercises: [
              { id: 'toetaps', value: 100 },
              { id: 'skott', value: 10 },
              { id: 'fritraning', value: 30 },
            ],
          }),
        ],
      }),
    );
    expect(s.totalTouch).toBe(100);
    expect(s.totalMinutes).toBe(30);
  });

  it('reflects completed bingo tiles', () => {
    const s = computeStats(makeUser({ bingo: ['b01', 'b02'] }));
    expect(s.bingoCount).toBe(2);
  });
});
