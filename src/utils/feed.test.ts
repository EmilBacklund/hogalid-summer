import { describe, expect, it } from 'vitest';
import { generateFeed } from './feed';
import type { TeamMessage, User } from '../types';

function makeUser(alias: string): User {
  return {
    alias,
    role: 'player',
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
  };
}

function makeMessage(over: Partial<TeamMessage> = {}): TeamMessage {
  return {
    id: 1,
    alias: 'tova',
    authorName: 'Tränare Tova',
    body: 'Träning imorgon kl 18!',
    createdAt: '2026-06-03T10:00:00.000Z',
    ...over,
  };
}

describe('generateFeed — leader announcements', () => {
  it('surfaces a posted message as an announcement event', () => {
    const feed = generateFeed([makeUser('maja')], 'maja', null, [], [makeMessage()]);
    const announcement = feed.find((e) => e.type === 'announcement');
    expect(announcement).toBeTruthy();
    expect(announcement!.text).toBe('Träning imorgon kl 18!');
    expect(announcement!.alias).toBe('Tränare Tova');
    expect(announcement!.icon).toBe('📣');
  });

  it('marks the message as mine when I am the author', () => {
    const feed = generateFeed(
      [makeUser('tova')],
      'tova',
      null,
      [],
      [makeMessage({ alias: 'tova' })],
    );
    expect(feed.find((e) => e.type === 'announcement')!.isMe).toBe(true);
  });

  it('omits announcements when there are no messages', () => {
    const feed = generateFeed([makeUser('maja')], 'maja', null, []);
    expect(feed.some((e) => e.type === 'announcement')).toBe(false);
  });

  it('orders a newer announcement ahead of an older one', () => {
    const feed = generateFeed(
      [makeUser('maja')],
      'maja',
      null,
      [],
      [
        makeMessage({ id: 1, body: 'gammalt', createdAt: '2026-06-01T08:00:00.000Z' }),
        makeMessage({ id: 2, body: 'nytt', createdAt: '2026-06-03T08:00:00.000Z' }),
      ],
    );
    const announcements = feed.filter((e) => e.type === 'announcement');
    expect(announcements[0]!.text).toBe('nytt');
    expect(announcements[1]!.text).toBe('gammalt');
  });
});
