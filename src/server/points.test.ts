import { describe, expect, it } from 'vitest';
import {
  bingoTilePoints,
  clampExercises,
  clampLineBonus,
  clampPenaltyScore,
  clampSummer,
  computeTrainingPoints,
  dailyChallengePoints,
  isBingoTile,
  isDailyChallenge,
  MAX_LINE_BONUS,
  trainingMinutes,
} from './points';

describe('computeTrainingPoints (SEC H1)', () => {
  it('scores touch exercises 1:1', () => {
    expect(computeTrainingPoints([{ id: 'toetaps', value: 100 }])).toBe(100);
  });

  it('scores free-training minutes at 5x', () => {
    expect(computeTrainingPoints([{ id: 'fritraning', value: 30 }])).toBe(150);
  });

  it('awards no direct points for skott', () => {
    expect(computeTrainingPoints([{ id: 'skott', value: 50 }])).toBe(0);
  });

  it('combines touch and minutes', () => {
    expect(
      computeTrainingPoints([
        { id: 'toetaps', value: 40 },
        { id: 'fritraning', value: 10 },
      ]),
    ).toBe(40 + 50);
  });

  it('ignores unknown exercise ids entirely', () => {
    expect(computeTrainingPoints([{ id: 'hax', value: 999999 }])).toBe(0);
  });
});

describe('clampExercises', () => {
  it('clamps values to the exercise max', () => {
    // toetaps max is 1000
    expect(clampExercises([{ id: 'toetaps', value: 10_000 }])).toEqual([
      { id: 'toetaps', value: 1000 },
    ]);
  });

  it('drops unknown ids and non-positive values', () => {
    expect(
      clampExercises([
        { id: 'nope', value: 5 },
        { id: 'toetaps', value: 0 },
        { id: 'toetaps', value: -3 },
      ]),
    ).toEqual([]);
  });

  it('floors fractional values', () => {
    expect(clampExercises([{ id: 'toetaps', value: 12.9 }])).toEqual([
      { id: 'toetaps', value: 12 },
    ]);
  });
});

describe('clampSummer', () => {
  it('clamps to the activity max', () => {
    expect(clampSummer('iceCream', 999)).toBe(10);
    expect(clampSummer('pages', 999)).toBe(500);
  });
});

describe('trainingMinutes', () => {
  it('reads free-training minutes from the entries', () => {
    expect(trainingMinutes([{ id: 'fritraning', value: 25 }])).toBe(25);
    expect(trainingMinutes([{ id: 'toetaps', value: 25 }])).toBe(0);
  });
});

describe('bonus point lookups', () => {
  it('validates and scores bingo tiles from constants', () => {
    expect(isBingoTile('classic', 'b01')).toBe(true);
    expect(isBingoTile('classic', 'does-not-exist')).toBe(false);
    expect(bingoTilePoints('classic', 'b01')).toBeGreaterThan(0);
    expect(bingoTilePoints('classic', 'nope')).toBe(0);
  });

  it('clamps the client line bonus to the ceiling', () => {
    expect(clampLineBonus(10)).toBe(10);
    expect(clampLineBonus(10_000)).toBe(MAX_LINE_BONUS);
    expect(clampLineBonus(-5)).toBe(0);
  });

  it('clamps penalty score to 0..10', () => {
    expect(clampPenaltyScore(7)).toBe(7);
    expect(clampPenaltyScore(99)).toBe(10);
  });

  it('validates and scores daily challenges from constants', () => {
    expect(isDailyChallenge('d01')).toBe(true);
    expect(isDailyChallenge('not-a-daily')).toBe(false);
    expect(dailyChallengePoints('d01')).toBe(20);
    expect(dailyChallengePoints('not-a-daily')).toBe(0);
  });
});
