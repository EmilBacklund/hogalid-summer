import { describe, expect, it } from 'vitest';
import { computeCoins } from './cards';
import { PLAYER_CARDS, LEGEND_CARDS, CARD_PACK_COST, LEGEND_PACK_COST } from '../constants';

describe('computeCoins', () => {
  it('returns the full point total when nothing is unlocked', () => {
    expect(computeCoins(1000, [])).toBe(1000);
  });

  it('subtracts a player-pack cost per owned player card', () => {
    const owned = [PLAYER_CARDS[0]!.id, PLAYER_CARDS[1]!.id];
    expect(computeCoins(1000, owned)).toBe(1000 - 2 * CARD_PACK_COST);
  });

  it('subtracts the legend-pack cost for legend cards', () => {
    const owned = [PLAYER_CARDS[0]!.id, LEGEND_CARDS[0]!.id];
    expect(computeCoins(2000, owned)).toBe(2000 - CARD_PACK_COST - LEGEND_PACK_COST);
  });

  it('ignores unlocked ids that are not cards (e.g. avatar items)', () => {
    expect(computeCoins(500, ['some_avatar_reward', 'sticker_x'])).toBe(500);
  });
});
