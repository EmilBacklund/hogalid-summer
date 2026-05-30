'use client';

import { CardFront } from '@/components/common';
import { cn } from '@/lib/cn';
import type { Card } from '@/types';

interface CardDetailModalProps {
  card: Card;
  onClose: () => void;
}

/** Tap-to-dismiss detail view: the full card front plus a readable info panel. */
export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const isLegend = card.type === 'legend';

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label="Stäng"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[1100] flex cursor-pointer flex-col items-center justify-center overflow-y-auto bg-black/[0.82] p-6"
    >
      <div className="flex w-full max-w-[340px] flex-col items-center">
        <CardFront card={card} size={1.6} />

        {/* Info panel — solid background for readability over the card art. */}
        <div
          className="mt-3 w-full rounded-[18px] px-[18px] py-4 backdrop-blur-md"
          style={{
            background: 'rgba(0, 20, 60, 0.95)',
            border: `1.5px solid ${isLegend ? 'rgba(255,215,0,0.3)' : 'rgba(240,220,0,0.2)'}`,
          }}
        >
          <div
            className="font-display mb-0.5 text-center text-xl"
            style={{ color: isLegend ? '#ffd700' : '#fff' }}
          >
            {card.name}
          </div>

          {card.position && (
            <div className="text-hogalid-yellow mb-0.5 text-center text-[13px] font-bold">
              {card.position}
            </div>
          )}
          {card.club && (
            <div
              className={cn('text-center text-xs text-white/65', card.youthClub ? 'mb-px' : 'mb-2')}
            >
              {card.club}
            </div>
          )}
          {card.youthClub && (
            <div className="mb-2 text-center text-[11px] text-white/40">
              Moderklubb: {card.youthClub}
            </div>
          )}

          {card.blurb && (
            <>
              <div className="mb-2.5 border-t border-white/10" />
              <div className="text-center text-[13px] leading-relaxed font-semibold text-white/85">
                {card.blurb}
              </div>
            </>
          )}

          <div
            className="mt-2.5 border-t border-white/[0.08] pt-2 text-center text-[10px] font-bold tracking-[1.5px] uppercase"
            style={{ color: isLegend ? 'rgba(255,215,0,0.5)' : 'rgba(240,220,0,0.45)' }}
          >
            Kort #{card.number} {isLegend ? '— Legend' : '— Damlandslaget 2026'}
          </div>
        </div>

        <div className="mt-3.5 text-[11px] text-white/30">Tryck var som helst</div>
      </div>
    </div>
  );
}
