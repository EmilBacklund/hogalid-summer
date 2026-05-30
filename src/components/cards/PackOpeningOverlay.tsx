'use client';

import { type CSSProperties } from 'react';
import { getCelebrationLine } from '@/constants';
import { CardFront, CardBack } from '@/components/common';
import { cn } from '@/lib/cn';
import type { Card } from '@/types';

export type PackPhase = 'shake' | 'flip' | 'reveal';

const FLIP_SIZE = 1.6;
const CARD_W = 180 * FLIP_SIZE;
const CARD_H = 231 * FLIP_SIZE;

/** Hidden back-face of the flip container (visible at 0°). */
const FACE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
};

interface PackOpeningOverlayProps {
  card: Card;
  phase: PackPhase;
  onFinish: () => void;
}

/**
 * Full-screen pack-opening sequence. Uses a real 3D flip: both card faces live
 * in the same container and `backface-visibility` hides whichever faces away.
 * The animation shorthand is phase-driven, so it stays inline.
 */
export function PackOpeningOverlay({ card, phase, onFinish }: PackOpeningOverlayProps) {
  const isLegend = card.type === 'legend';
  const sparkColor = isLegend ? '#ffd700' : '#f0dc00';

  const flipAnimation =
    phase === 'shake'
      ? 'card-shake 1.2s ease-in-out'
      : phase === 'flip'
        ? 'card-flip-to-front 0.8s ease-out forwards'
        : 'reveal-pulse 2s ease-in-out infinite';

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label={phase === 'reveal' ? 'Stäng' : undefined}
      onClick={phase === 'reveal' ? onFinish : undefined}
      onKeyDown={(e) => {
        if (phase === 'reveal' && e.key === 'Escape') onFinish();
      }}
      className={cn(
        'fixed inset-0 z-[1200] flex flex-col items-center justify-center bg-black/85 p-6',
        phase === 'reveal' ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      {phase === 'reveal' &&
        Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * 360;
          const dist = 120 + Math.random() * 40;
          const x = Math.cos((angle * Math.PI) / 180) * dist;
          const y = Math.sin((angle * Math.PI) / 180) * dist;
          return (
            <div
              key={i}
              className="absolute top-[45%] left-1/2 h-2 w-2 rounded-full"
              style={{
                background: sparkColor,
                transform: `translate(${x}px, ${y}px)`,
                animation: `sparkle 1.2s ease-in-out ${i * 0.1}s infinite`,
                boxShadow: `0 0 10px ${sparkColor}`,
              }}
            />
          );
        })}

      {/* 3D flip container — perspective on the outer, transform-style on the inner. */}
      <div style={{ perspective: 800 }}>
        <div
          className="relative"
          style={{
            transformStyle: 'preserve-3d',
            animation: flipAnimation,
            width: CARD_W,
            height: CARD_H,
          }}
        >
          <div style={FACE}>
            <CardBack size={FLIP_SIZE} />
          </div>
          <div style={{ ...FACE, transform: 'rotateY(180deg)' }}>
            <CardFront card={card} size={FLIP_SIZE} />
          </div>
        </div>
      </div>

      {phase === 'reveal' && (
        <div className="animate-fade-in-up mt-6 text-center">
          <div
            className="font-display mb-1 text-[22px]"
            style={{ color: isLegend ? '#ffd700' : '#fff' }}
          >
            {card.name}
          </div>
          <div
            className="text-[13px] font-bold tracking-[1.5px] uppercase"
            style={{ color: sparkColor }}
          >
            {isLegend ? 'Legendkort!' : 'Nytt kort!'}
          </div>
          <div className="mt-2 text-[13px] font-extrabold text-white/80">
            {getCelebrationLine('drive', card.id)}
          </div>
          <div className="mt-4 text-xs text-white/40">Tryck var som helst</div>
        </div>
      )}
    </div>
  );
}
