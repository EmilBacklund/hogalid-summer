import { PLAYER_CARDS, LEGEND_CARDS, CARD_PACK_COST, LEGEND_PACK_COST } from '../constants';

/**
 * Coins available to spend in the card shop: total points earned minus the cost
 * of every pack already opened (one pack == one unlocked card). Player cards and
 * legend cards have different pack costs.
 */
export function computeCoins(totalPoints: number, unlockedItems: string[]): number {
  const ids = new Set(unlockedItems);
  let spent = 0;
  for (const c of PLAYER_CARDS) if (ids.has(c.id)) spent += CARD_PACK_COST;
  for (const c of LEGEND_CARDS) if (ids.has(c.id)) spent += LEGEND_PACK_COST;
  return totalPoints - spent;
}
