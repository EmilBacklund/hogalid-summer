import { useState, useMemo, useCallback } from 'react';
import { COLORS } from '../constants';
import {
  PLAYER_CARDS, LEGEND_CARDS, ALL_CARDS,
  CARD_PACK_COST, LEGEND_PACK_COST,
  TOTAL_PLAYER_CARDS, TOTAL_LEGEND_CARDS,
} from '../constants/cards';
import { Card, ProgressBar, Confetti } from '../components/common';
import { CardFront, CardBack } from '../components/common/CollectorCard';
import { useUser } from '../context/UserContext';
import { ArrowLeft } from 'lucide-react';

// ── Helpers ──

function getCollectedPlayerCount(unlockedItems) {
  const ids = new Set(unlockedItems || []);
  return PLAYER_CARDS.filter(c => ids.has(c.id)).length;
}

function getCollectedLegendCount(unlockedItems) {
  const ids = new Set(unlockedItems || []);
  return LEGEND_CARDS.filter(c => ids.has(c.id)).length;
}

// Compute total points spent on cards (deterministic from unlockedItems)
function getSpentOnCards(unlockedItems) {
  const ids = new Set(unlockedItems || []);
  let spent = 0;
  for (const c of PLAYER_CARDS) {
    if (ids.has(c.id)) spent += CARD_PACK_COST;
  }
  for (const c of LEGEND_CARDS) {
    if (ids.has(c.id)) spent += LEGEND_PACK_COST;
  }
  return spent;
}

function getNextRandomCard(unlockedItems) {
  const ids = new Set(unlockedItems || []);
  const playerCount = PLAYER_CARDS.filter(c => ids.has(c.id)).length;
  const allPlayersCollected = playerCount >= TOTAL_PLAYER_CARDS;

  if (!allPlayersCollected) {
    const remaining = PLAYER_CARDS.filter(c => !ids.has(c.id));
    if (remaining.length === 0) return null;
    return remaining[Math.floor(Math.random() * remaining.length)];
  } else {
    const remaining = LEGEND_CARDS.filter(c => !ids.has(c.id));
    if (remaining.length === 0) return null;
    return remaining[Math.floor(Math.random() * remaining.length)];
  }
}

// ── Pack Opening Overlay ──
// Uses a real 3D flip: both card faces exist in the same container,
// and backface-visibility hides whichever side faces away.
function PackOpeningOverlay({ card, phase, onFinish }) {
  const isFlipOrReveal = phase === 'flip' || phase === 'reveal';

  return (
    <div
      onClick={phase === 'reveal' ? onFinish : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        cursor: phase === 'reveal' ? 'pointer' : 'default',
      }}
    >
      <style>{`
        @keyframes cardShake {
          0%, 100% { transform: rotate(0deg) scale(1); }
          10% { transform: rotate(-3deg) scale(1.02); }
          20% { transform: rotate(3deg) scale(1.02); }
          30% { transform: rotate(-4deg) scale(1.04); }
          40% { transform: rotate(4deg) scale(1.04); }
          50% { transform: rotate(-5deg) scale(1.06); }
          60% { transform: rotate(5deg) scale(1.06); }
          70% { transform: rotate(-3deg) scale(1.04); }
          80% { transform: rotate(3deg) scale(1.04); }
          90% { transform: rotate(-1deg) scale(1.02); }
        }
        @keyframes cardFlipToFront {
          0% { transform: perspective(800px) rotateY(0deg) scale(1); }
          100% { transform: perspective(800px) rotateY(180deg) scale(1.15); }
        }
        @keyframes revealPulse {
          0%, 100% { transform: perspective(800px) rotateY(180deg) scale(1.15); }
          50% { transform: perspective(800px) rotateY(180deg) scale(1.18); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
      `}</style>

      {phase === 'reveal' && (
        <>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * 360;
            const dist = 120 + Math.random() * 40;
            const x = Math.cos(angle * Math.PI / 180) * dist;
            const y = Math.sin(angle * Math.PI / 180) * dist;
            return (
              <div key={i} style={{
                position: 'absolute',
                left: '50%',
                top: '45%',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: card.type === 'legend' ? '#ffd700' : '#f0dc00',
                transform: `translate(${x}px, ${y}px)`,
                animation: `sparkle 1.2s ease-in-out ${i * 0.1}s infinite`,
                boxShadow: `0 0 10px ${card.type === 'legend' ? '#ffd700' : '#f0dc00'}`,
              }} />
            );
          })}
        </>
      )}

      {/* 3D flip container — perspective on outer, transformStyle on inner */}
      <div style={{ perspective: 800 }}>
        <div style={{
          transformStyle: 'preserve-3d',
          animation: phase === 'shake'
            ? 'cardShake 1.2s ease-in-out'
            : phase === 'flip'
              ? 'cardFlipToFront 0.8s ease-out forwards'
              : 'revealPulse 2s ease-in-out infinite',
          position: 'relative',
          width: 180 * 1.6,
          height: 231 * 1.6,
        }}>
          {/* Back face (visible at 0°) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}>
            <CardBack size={1.6} />
          </div>
          {/* Front face (pre-rotated 180°, visible when container flips to 180°) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}>
            <CardFront card={card} size={1.6} />
          </div>
        </div>
      </div>

      {phase === 'reveal' && (
        <div style={{
          animation: 'fadeInUp 0.5s ease-out 0.3s both',
          textAlign: 'center',
          marginTop: 24,
        }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 22,
            color: card.type === 'legend' ? '#ffd700' : '#fff',
            marginBottom: 4,
          }}>
            {card.name}
          </div>
          <div style={{
            color: card.type === 'legend' ? '#ffd700' : '#f0dc00',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
          }}>
            {card.type === 'legend' ? 'Legendkort!' : 'Nytt kort!'}
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12,
            marginTop: 16,
          }}>
            Tryck var som helst
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card Detail Modal ──
function CardDetailModal({ card, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0, 0, 0, 0.82)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        cursor: 'pointer',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 340, width: '100%' }}>
        <CardFront card={card} size={1.6} />

        {/* Info panel — solid background for readability */}
        <div style={{
          width: '100%',
          marginTop: 12,
          borderRadius: 18,
          background: 'rgba(0, 20, 60, 0.95)',
          border: `1.5px solid ${card.type === 'legend' ? 'rgba(255,215,0,0.3)' : 'rgba(240,220,0,0.2)'}`,
          padding: '16px 18px',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 20,
            color: card.type === 'legend' ? '#ffd700' : '#fff',
            textAlign: 'center',
            marginBottom: 2,
          }}>
            {card.name}
          </div>

          {card.position && (
            <div style={{
              color: '#f0dc00',
              fontSize: 13,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 2,
            }}>
              {card.position}
            </div>
          )}
          {card.club && (
            <div style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 12,
              textAlign: 'center',
              marginBottom: card.youthClub ? 1 : 8,
            }}>
              {card.club}
            </div>
          )}
          {card.youthClub && (
            <div style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
              textAlign: 'center',
              marginBottom: 8,
            }}>
              Moderklubb: {card.youthClub}
            </div>
          )}

          {card.blurb && (
            <>
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                marginBottom: 10,
              }} />
              <div style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                lineHeight: 1.6,
                textAlign: 'center',
                fontWeight: 600,
              }}>
                {card.blurb}
              </div>
            </>
          )}

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            marginTop: 10,
            paddingTop: 8,
            color: card.type === 'legend' ? 'rgba(255,215,0,0.5)' : 'rgba(240,220,0,0.45)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}>
            Kort #{card.number} {card.type === 'legend' ? '— Legend' : '— Damlandslaget 2026'}
          </div>
        </div>

        <div style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: 11,
          marginTop: 14,
        }}>
          Tryck var som helst
        </div>
      </div>
    </div>
  );
}

// ── Main Screen ──
export function CardsScreen() {
  const { user, stats, setScreen, handleUnlock } = useUser();
  const [openingPhase, setOpeningPhase] = useState(null);
  const [revealCard, setRevealCard] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewCard, setViewCard] = useState(null);

  const unlockedItems = user.unlockedItems || [];
  const playerCount = getCollectedPlayerCount(unlockedItems);
  const legendCount = getCollectedLegendCount(unlockedItems);
  const totalCollected = playerCount + legendCount;
  const allPlayersCollected = playerCount >= TOTAL_PLAYER_CARDS;
  const allCollected = allPlayersCollected && legendCount >= TOTAL_LEGEND_CARDS;

  const collectedIds = useMemo(() => new Set(unlockedItems), [unlockedItems]);

  // Economy: coins = totalPoints - spent on cards
  const spentOnCards = getSpentOnCards(unlockedItems);
  const coins = stats.totalPoints - spentOnCards;

  const cost = allPlayersCollected ? LEGEND_PACK_COST : CARD_PACK_COST;
  const canAfford = coins >= cost;
  const nextCard = useMemo(() => getNextRandomCard(unlockedItems), [unlockedItems]);
  const canOpen = canAfford && nextCard && !openingPhase;

  const handleOpenPack = useCallback(async () => {
    if (!canOpen) return;
    const card = getNextRandomCard(unlockedItems);
    if (!card) return;
    setRevealCard(card);
    setOpeningPhase('shake');

    // Shake 1.2s → flip 0.8s → reveal with confetti
    setTimeout(() => setOpeningPhase('flip'), 1200);
    setTimeout(async () => {
      setOpeningPhase('reveal');
      setShowConfetti(true);
      await handleUnlock(card.id, card.type === 'legend' ? LEGEND_PACK_COST : CARD_PACK_COST);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 2100);
  }, [canOpen, unlockedItems, handleUnlock]);

  function handleFinishReveal() {
    setOpeningPhase(null);
    setRevealCard(null);
  }

  return (
    <div style={{ padding: '20px 16px', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>

      {showConfetti && <Confetti />}

      {openingPhase && revealCard && (
        <PackOpeningOverlay
          card={revealCard}
          phase={openingPhase}
          onFinish={handleFinishReveal}
        />
      )}

      {viewCard && (
        <CardDetailModal card={viewCard} onClose={() => setViewCard(null)} />
      )}

      {/* Back button */}
      <button
        onClick={() => setScreen('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          color: COLORS.lime,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 16,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Tillbaka
      </button>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 26,
          color: '#fff',
          marginBottom: 4,
        }}>
          Samlarkort
        </div>
        <div style={{
          color: '#f0dc00',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          Damlandslaget 2026 — {TOTAL_PLAYER_CARDS} spelare
        </div>
      </div>

      {/* Coin balance */}
      <Card style={{
        marginBottom: 12,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🪙</span>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Ditt saldo
            </div>
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 22,
              color: coins >= cost ? COLORS.lime : 'rgba(255,255,255,0.5)',
              lineHeight: 1.1,
            }}>
              {coins} mynt
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            Nästa kort kostar
          </div>
          <div style={{
            color: coins >= cost ? COLORS.yellow : 'rgba(255,255,255,0.4)',
            fontWeight: 700,
            fontSize: 14,
          }}>
            {allCollected ? '—' : `${cost} mynt`}
          </div>
        </div>
      </Card>

      {/* Collection progress */}
      <Card style={{ marginBottom: 16, padding: '16px 18px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
            Din samling
          </div>
          <div style={{
            color: COLORS.lime,
            fontFamily: "'Fredoka One', cursive",
            fontSize: 18,
          }}>
            {totalCollected}/{TOTAL_PLAYER_CARDS + TOTAL_LEGEND_CARDS}
          </div>
        </div>

        {/* Player cards progress */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>
              ⚽ Spelare ({TOTAL_PLAYER_CARDS} st)
            </span>
            <span style={{
              color: allPlayersCollected ? COLORS.lime : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 700,
            }}>
              {playerCount}/{TOTAL_PLAYER_CARDS} {allPlayersCollected && '✅'}
            </span>
          </div>
          <ProgressBar
            value={(playerCount / TOTAL_PLAYER_CARDS) * 100}
            color={COLORS.lime}
            height={8}
          />
        </div>

        {/* Legend cards progress */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>
              👑 Legendkort ({TOTAL_LEGEND_CARDS} st)
            </span>
            <span style={{
              color: allPlayersCollected
                ? legendCount >= TOTAL_LEGEND_CARDS ? '#ffd700' : 'rgba(255,255,255,0.5)'
                : 'rgba(255,255,255,0.3)',
              fontSize: 12,
              fontWeight: 700,
            }}>
              {allPlayersCollected
                ? `${legendCount}/${TOTAL_LEGEND_CARDS} ${legendCount >= TOTAL_LEGEND_CARDS ? '✅' : ''}`
                : '🔒 Samla alla 23 spelare först'}
            </span>
          </div>
          <ProgressBar
            value={allPlayersCollected ? (legendCount / TOTAL_LEGEND_CARDS) * 100 : 0}
            color={allPlayersCollected ? '#ffd700' : 'rgba(255,255,255,0.2)'}
            height={8}
          />
        </div>
      </Card>

      {/* Open pack button */}
      {!allCollected ? (
        <Card style={{
          marginBottom: 20,
          padding: '20px 16px',
          textAlign: 'center',
          border: canOpen ? `1.5px solid ${COLORS.lime}55` : undefined,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <div style={{
              animation: canOpen ? 'gentlePulse 2s ease-in-out infinite' : 'none',
            }}>
              <CardBack size={0.9} />
            </div>
          </div>

          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 18,
            color: '#fff',
            marginBottom: 4,
          }}>
            {allPlayersCollected ? 'Öppna legendkort' : 'Öppna nytt spelarkort'}
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 12,
            marginBottom: 14,
          }}>
            {allPlayersCollected
              ? `${TOTAL_LEGEND_CARDS - legendCount} av ${TOTAL_LEGEND_CARDS} legendkort kvar`
              : `${TOTAL_PLAYER_CARDS - playerCount} av ${TOTAL_PLAYER_CARDS} spelare i Damlandslaget 2026 kvar`}
          </div>

          <button
            onClick={handleOpenPack}
            disabled={!canOpen}
            style={{
              padding: '14px 32px',
              borderRadius: 16,
              border: 'none',
              background: canOpen
                ? `linear-gradient(135deg, ${COLORS.lime}, ${COLORS.limeGlow})`
                : 'rgba(255,255,255,0.1)',
              color: canOpen ? COLORS.dark : 'rgba(255,255,255,0.35)',
              fontFamily: "'Fredoka One', cursive",
              fontSize: 18,
              cursor: canOpen ? 'pointer' : 'not-allowed',
              boxShadow: canOpen ? `0 4px 20px ${COLORS.lime}44` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {canOpen
              ? `🪙 Öppna kort — ${cost} mynt`
              : `${cost} mynt krävs (du har ${coins})`}
          </button>

          {!canOpen && !allCollected && (
            <div style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 11,
              marginTop: 10,
            }}>
              Träna och logga för att tjäna fler mynt!
            </div>
          )}
        </Card>
      ) : (
        <Card style={{
          marginBottom: 20,
          padding: '20px 16px',
          textAlign: 'center',
          border: `2px solid #ffd700`,
          background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))',
        }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🏆</div>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 20,
            color: '#ffd700',
            marginBottom: 4,
          }}>
            Komplett samling!
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 13,
          }}>
            Du har samlat alla {TOTAL_PLAYER_CARDS} spelare + {TOTAL_LEGEND_CARDS} legender!
          </div>
        </Card>
      )}

      {/* My collection — Player cards */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 18,
          color: '#fff',
          marginBottom: 4,
        }}>
          Damlandslaget 2026
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 12,
        }}>
          {playerCount} av {TOTAL_PLAYER_CARDS} spelare samlade
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10,
          justifyItems: 'center',
        }}>
          {PLAYER_CARDS.map((card) => {
            const collected = collectedIds.has(card.id);
            return collected ? (
              <CardFront
                key={card.id}
                card={card}
                size={0.6}
                onClick={() => setViewCard(card)}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <CardBack
                key={card.id}
                size={0.6}
                style={{ opacity: 0.5 }}
              />
            );
          })}
        </div>
      </div>

      {/* Legend cards section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 18,
          color: allPlayersCollected ? '#ffd700' : 'rgba(255,255,255,0.35)',
          marginBottom: 4,
        }}>
          {allPlayersCollected ? '👑' : '🔒'} Legendkort
        </div>
        <div style={{
          color: allPlayersCollected ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.25)',
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 12,
        }}>
          {allPlayersCollected
            ? `${legendCount} av ${TOTAL_LEGEND_CARDS} legender samlade`
            : `Samla alla ${TOTAL_PLAYER_CARDS} spelare för att låsa upp`}
        </div>

        {!allPlayersCollected ? (
          <Card style={{
            padding: '16px 16px',
            textAlign: 'center',
            opacity: 0.6,
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
            <div style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 13,
              fontWeight: 600,
            }}>
              Samla alla {TOTAL_PLAYER_CARDS} spelare i Damlandslaget 2026 för att låsa upp legendkorten
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: 12,
              marginTop: 4,
            }}>
              {TOTAL_PLAYER_CARDS - playerCount} kort kvar
            </div>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            justifyItems: 'center',
          }}>
            {LEGEND_CARDS.map((card) => {
              const collected = collectedIds.has(card.id);
              return collected ? (
                <CardFront
                  key={card.id}
                  card={card}
                  size={0.6}
                  onClick={() => setViewCard(card)}
                  style={{ cursor: 'pointer' }}
                />
              ) : (
                <CardBack
                  key={card.id}
                  size={0.6}
                  style={{ opacity: 0.5 }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
