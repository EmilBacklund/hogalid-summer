'use client';

import { ArrowRight } from 'lucide-react';
import {
  PLAYER_CARDS,
  LEGEND_CARDS,
  TOTAL_PLAYER_CARDS,
  TOTAL_LEGEND_CARDS,
  CARD_PACK_COST,
  LEGEND_PACK_COST,
} from '@/constants';
import { computeCoins } from '@/utils';
import { cn } from '@/lib/cn';
import type { Stats, User } from '@/types';

interface CollectorCardsCtaProps {
  stats: Stats;
  user: User;
  onClick: () => void;
}

/** Call-to-action linking to the collector-card shop, with collection progress. */
export function CollectorCardsCta({ stats, user, onClick }: CollectorCardsCtaProps) {
  const ids = new Set(user.unlockedItems || []);
  const pCount = PLAYER_CARDS.filter((c) => ids.has(c.id)).length;
  const lCount = LEGEND_CARDS.filter((c) => ids.has(c.id)).length;
  const total = pCount + lCount;
  const max = TOTAL_PLAYER_CARDS + TOTAL_LEGEND_CARDS;
  const coins = computeCoins(stats.totalPoints, user.unlockedItems || []);
  const nextCost = pCount >= TOTAL_PLAYER_CARDS ? LEGEND_PACK_COST : CARD_PACK_COST;
  const canBuy = coins >= nextCost;
  const highlight = canBuy && total < max;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mb-2.5 flex w-full items-center gap-3.5 rounded-2xl bg-[linear-gradient(135deg,rgba(0,26,77,0.6),rgba(0,40,104,0.5))] px-4 py-3.5 text-left',
        highlight ? 'border-[1.5px] border-[rgba(240,220,0,0.35)]' : 'border border-white/10',
      )}
    >
      <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-[#f0dc00] bg-[linear-gradient(145deg,#001a4d,#002868)] text-xl shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
        ⚽
      </div>
      <div className="flex-1">
        <div className="font-display text-base leading-tight text-white">Samlarkort</div>
        <div
          className={cn(
            'mt-0.5 text-xs font-semibold',
            total >= max ? 'text-[#ffd700]' : 'text-white/50',
          )}
        >
          {total >= max ? '🏆 Komplett samling!' : `${total}/${max} kort samlade`}
        </div>
      </div>
      <div
        className={cn(
          'flex shrink-0 items-center gap-[3px] text-xs font-bold',
          highlight ? 'text-[#f0dc00]' : 'text-white/35',
        )}
      >
        {total < max && (canBuy ? '🪙 Öppna kort!' : `🪙 ${nextCost}`)}
        <ArrowRight size={14} />
      </div>
    </button>
  );
}
