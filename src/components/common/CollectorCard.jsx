import { useState } from 'react';

const CARD_W = 180;
const CARD_H = 231; // Matches 750:963 ratio

const CARD_COLORS = {
  darkBlue: '#001a4d',
  blue: '#002868',
  lightBlue: '#003a8c',
  gold: '#f0dc00',
  goldLight: '#ffe533',
  goldDark: '#c4b300',
};

// ── Card Back (locked / unrevealed) ──
export function CardBack({ size = 1, style = {}, onClick }) {
  const w = CARD_W * size;
  const h = CARD_H * size;
  return (
    <div
      onClick={onClick}
      style={{
        width: w,
        height: h,
        borderRadius: 14 * size,
        background: `linear-gradient(145deg, ${CARD_COLORS.darkBlue} 0%, ${CARD_COLORS.blue} 40%, ${CARD_COLORS.lightBlue} 100%)`,
        border: `2.5px solid ${CARD_COLORS.gold}`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Diamond pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.06,
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.5) 12px, rgba(255,255,255,0.5) 13px),
                          repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.5) 12px, rgba(255,255,255,0.5) 13px)`,
      }} />
      {/* Inner border */}
      <div style={{
        position: 'absolute',
        inset: 6 * size,
        borderRadius: 10 * size,
        border: `1.5px solid ${CARD_COLORS.gold}44`,
      }} />
      {/* Crown / shield emblem */}
      <div style={{
        fontSize: 38 * size,
        lineHeight: 1,
        marginBottom: 6 * size,
        filter: 'drop-shadow(0 2px 8px rgba(240,220,0,0.3))',
      }}>
        ⚽
      </div>
      {/* Three crowns text */}
      <div style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 11 * size,
        color: CARD_COLORS.gold,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        opacity: 0.7,
      }}>
        Sverige
      </div>
      {/* Corner accents */}
      {[
        { top: 8 * size, left: 8 * size },
        { top: 8 * size, right: 8 * size },
        { bottom: 8 * size, left: 8 * size },
        { bottom: 8 * size, right: 8 * size },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...pos,
          width: 8 * size,
          height: 8 * size,
          borderTop: i < 2 ? `2px solid ${CARD_COLORS.gold}55` : 'none',
          borderBottom: i >= 2 ? `2px solid ${CARD_COLORS.gold}55` : 'none',
          borderLeft: i % 2 === 0 ? `2px solid ${CARD_COLORS.gold}55` : 'none',
          borderRight: i % 2 === 1 ? `2px solid ${CARD_COLORS.gold}55` : 'none',
        }} />
      ))}
    </div>
  );
}

// ── Card Front (unlocked player) ──
export function CardFront({ card, size = 1, style = {}, onClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const w = CARD_W * size;
  const h = CARD_H * size;
  const isLegend = card.type === 'legend';

  return (
    <div
      onClick={onClick}
      style={{
        width: w,
        height: h,
        borderRadius: 14 * size,
        background: isLegend
          ? `linear-gradient(145deg, #1a0a00 0%, #3d2000 40%, #5a3000 100%)`
          : `linear-gradient(145deg, ${CARD_COLORS.darkBlue} 0%, ${CARD_COLORS.blue} 50%, ${CARD_COLORS.lightBlue} 100%)`,
        border: `2.5px solid ${isLegend ? '#ffd700' : CARD_COLORS.gold}`,
        boxShadow: isLegend
          ? `0 4px 24px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
          : `0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Foil shimmer overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isLegend
          ? 'linear-gradient(135deg, transparent 30%, rgba(255,215,0,0.08) 50%, transparent 70%)'
          : 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />

      {/* Card number badge */}
      <div style={{
        position: 'absolute',
        top: 7 * size,
        left: 7 * size,
        zIndex: 4,
        background: isLegend
          ? 'linear-gradient(135deg, #ffd700, #ffaa00)'
          : `linear-gradient(135deg, ${CARD_COLORS.gold}, ${CARD_COLORS.goldDark})`,
        color: CARD_COLORS.darkBlue,
        fontFamily: "'Fredoka One', cursive",
        fontSize: 11 * size,
        fontWeight: 900,
        width: 22 * size,
        height: 22 * size,
        borderRadius: 7 * size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }}>
        {card.number}
      </div>

      {/* Legend badge */}
      {isLegend && (
        <div style={{
          position: 'absolute',
          top: 7 * size,
          right: 7 * size,
          zIndex: 4,
          fontSize: 16 * size,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }}>
          {card.emoji}
        </div>
      )}

      {/* Player image area */}
      {card.image ? (
        <div style={{
          width: '100%',
          height: h * 0.68,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <img
            src={card.image}
            alt={card.name}
            onLoad={() => setImgLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top center',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          />
          {/* Bottom gradient fade */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: isLegend
              ? 'linear-gradient(transparent, #3d2000)'
              : `linear-gradient(transparent, ${CARD_COLORS.blue})`,
          }} />
        </div>
      ) : (
        <div style={{
          width: '100%',
          height: h * 0.68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48 * size,
        }}>
          {card.emoji || '⚽'}
        </div>
      )}

      {/* Name plate */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: `${8 * size}px ${10 * size}px ${10 * size}px`,
        background: isLegend
          ? 'linear-gradient(180deg, transparent, rgba(26,10,0,0.95) 20%)'
          : `linear-gradient(180deg, transparent, rgba(0,20,64,0.95) 20%)`,
      }}>
        {/* Gold divider line */}
        <div style={{
          width: '60%',
          height: 1.5,
          margin: `0 auto ${5 * size}px`,
          background: isLegend
            ? 'linear-gradient(90deg, transparent, #ffd700, transparent)'
            : `linear-gradient(90deg, transparent, ${CARD_COLORS.gold}, transparent)`,
        }} />
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 12 * size,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.2,
          textShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}>
          {card.name}
        </div>
        {isLegend && (
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 8 * size,
            color: '#ffd700',
            textAlign: 'center',
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginTop: 2 * size,
          }}>
            Legend
          </div>
        )}
        {!isLegend && (
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: 8 * size,
            color: CARD_COLORS.gold,
            textAlign: 'center',
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginTop: 2 * size,
            opacity: 0.7,
          }}>
            Damlandslaget
          </div>
        )}
      </div>
    </div>
  );
}
