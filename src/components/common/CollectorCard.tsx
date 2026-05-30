'use client';

import Image from 'next/image';
import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { Card } from '@/types';

/** Button semantics + keyboard activation for a clickable card face (a11y). */
function clickableProps(onClick?: () => void) {
  if (!onClick) return {};
  return {
    role: 'button',
    tabIndex: 0,
    onClick,
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.currentTarget.click();
      }
    },
  };
}

// Everything scales off `size`, so dimensions stay as computed inline styles.
const CARD_W = 180;
const CARD_H = 231; // 750:963 ratio

const C = {
  darkBlue: '#001a4d',
  blue: '#002868',
  lightBlue: '#003a8c',
  gold: '#f0dc00',
  goldDark: '#c4b300',
};

interface FaceProps {
  size?: number;
  style?: CSSProperties;
  onClick?: () => void;
}

/** Card back — locked / unrevealed. */
export function CardBack({ size = 1, style, onClick }: FaceProps) {
  const w = CARD_W * size;
  const h = CARD_H * size;
  const corners: CSSProperties[] = [
    { top: 8 * size, left: 8 * size },
    { top: 8 * size, right: 8 * size },
    { bottom: 8 * size, left: 8 * size },
    { bottom: 8 * size, right: 8 * size },
  ];
  return (
    <div
      {...clickableProps(onClick)}
      className="relative flex shrink-0 flex-col items-center justify-center overflow-hidden"
      style={{
        width: w,
        height: h,
        borderRadius: 14 * size,
        background: `linear-gradient(145deg, ${C.darkBlue} 0%, ${C.blue} 40%, ${C.lightBlue} 100%)`,
        border: `2.5px solid ${C.gold}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.5) 12px, rgba(255,255,255,0.5) 13px), repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.5) 12px, rgba(255,255,255,0.5) 13px)`,
        }}
      />
      <div
        className="absolute"
        style={{ inset: 6 * size, borderRadius: 10 * size, border: `1.5px solid ${C.gold}44` }}
      />
      <div
        className="leading-none"
        style={{
          fontSize: 38 * size,
          marginBottom: 6 * size,
          filter: 'drop-shadow(0 2px 8px rgba(240,220,0,0.3))',
        }}
      >
        ⚽
      </div>
      <div
        className="font-display uppercase opacity-70"
        style={{ fontSize: 11 * size, color: C.gold, letterSpacing: 2.5 }}
      >
        Sverige
      </div>
      {corners.map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            ...pos,
            width: 8 * size,
            height: 8 * size,
            borderTop: i < 2 ? `2px solid ${C.gold}55` : 'none',
            borderBottom: i >= 2 ? `2px solid ${C.gold}55` : 'none',
            borderLeft: i % 2 === 0 ? `2px solid ${C.gold}55` : 'none',
            borderRight: i % 2 === 1 ? `2px solid ${C.gold}55` : 'none',
          }}
        />
      ))}
    </div>
  );
}

/** Card front — unlocked player / legend. */
export function CardFront({ card, size = 1, style, onClick }: FaceProps & { card: Card }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const w = CARD_W * size;
  const h = CARD_H * size;
  const isLegend = card.type === 'legend';

  return (
    <div
      {...clickableProps(onClick)}
      className="relative shrink-0 overflow-hidden"
      style={{
        width: w,
        height: h,
        borderRadius: 14 * size,
        background: isLegend
          ? 'linear-gradient(145deg, #1a0a00 0%, #3d2000 40%, #5a3000 100%)'
          : `linear-gradient(145deg, ${C.darkBlue} 0%, ${C.blue} 50%, ${C.lightBlue} 100%)`,
        border: `2.5px solid ${isLegend ? '#ffd700' : C.gold}`,
        boxShadow: isLegend
          ? '0 4px 24px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background: isLegend
            ? 'linear-gradient(135deg, transparent 30%, rgba(255,215,0,0.08) 50%, transparent 70%)'
            : 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)',
        }}
      />

      <div
        className="font-display absolute z-[4] flex items-center justify-center font-black"
        style={{
          top: 7 * size,
          left: 7 * size,
          background: isLegend
            ? 'linear-gradient(135deg, #ffd700, #ffaa00)'
            : `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`,
          color: C.darkBlue,
          fontSize: 11 * size,
          width: 22 * size,
          height: 22 * size,
          borderRadius: 7 * size,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        {card.number}
      </div>

      {isLegend && (
        <div
          className="absolute z-[4]"
          style={{
            top: 7 * size,
            right: 7 * size,
            fontSize: 16 * size,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          }}
        >
          {card.emoji}
        </div>
      )}

      {card.image ? (
        <div className="relative w-full overflow-hidden" style={{ height: h * 0.68 }}>
          <Image
            src={card.image}
            alt={card.name}
            fill
            sizes="(max-width: 480px) 50vw, 200px"
            onLoad={() => setImgLoaded(true)}
            className="object-cover object-top transition-opacity duration-300"
            style={{ opacity: imgLoaded ? 1 : 0 }}
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: '40%',
              background: isLegend
                ? 'linear-gradient(transparent, #3d2000)'
                : `linear-gradient(transparent, ${C.blue})`,
            }}
          />
        </div>
      ) : (
        <div
          className="flex w-full items-center justify-center"
          style={{ height: h * 0.68, fontSize: 48 * size }}
        >
          {card.emoji || '⚽'}
        </div>
      )}

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          padding: `${8 * size}px ${10 * size}px ${10 * size}px`,
          background: isLegend
            ? 'linear-gradient(180deg, transparent, rgba(26,10,0,0.95) 20%)'
            : 'linear-gradient(180deg, transparent, rgba(0,20,64,0.95) 20%)',
        }}
      >
        <div
          className="mx-auto"
          style={{
            width: '60%',
            height: 1.5,
            marginBottom: 5 * size,
            background: isLegend
              ? 'linear-gradient(90deg, transparent, #ffd700, transparent)'
              : `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
          }}
        />
        <div
          className="font-display text-center leading-tight text-white"
          style={{ fontSize: 12 * size, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
        >
          {card.name}
        </div>
        <div
          className="text-center font-bold uppercase"
          style={{
            fontSize: 8 * size,
            marginTop: 2 * size,
            letterSpacing: isLegend ? 2 : 1.5,
            color: isLegend ? '#ffd700' : C.gold,
            opacity: isLegend ? 1 : 0.7,
          }}
        >
          {isLegend ? 'Legend' : card.position || 'Damlandslaget'}
        </div>
      </div>
    </div>
  );
}
