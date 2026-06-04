'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  PLAYER_CARDS,
  LEGEND_CARDS,
  CARD_PACK_COST,
  LEGEND_PACK_COST,
  TOTAL_PLAYER_CARDS,
  TOTAL_LEGEND_CARDS,
} from '@/constants';
import { computeCoins, computeStats } from '@/utils';
import { Card, ProgressBar, Confetti, TopBar, LoadingSpinner, CardBack } from '@/components/common';
import {
  PackOpeningOverlay,
  CardDetailModal,
  CardCollectionGrid,
  type PackPhase,
} from '@/components/cards';
import { useUser } from '@/providers/UserProvider';
import { useCardMutations } from '@/hooks/useCardMutations';
import { cn } from '@/lib/cn';
import type { Card as CardType, User } from '@/types';

/** Draw the next uncollected card: players first, then legends once all 23 are in. */
function getNextRandomCard(unlockedItems: string[]): CardType | null {
  const ids = new Set(unlockedItems);
  const allPlayersCollected = PLAYER_CARDS.every((c) => ids.has(c.id));
  const pool = (allPlayersCollected ? LEGEND_CARDS : PLAYER_CARDS).filter((c) => !ids.has(c.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export default function CardsPage() {
  const { user, isLoading } = useUser();
  if (isLoading || !user) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar..." />
      </main>
    );
  }
  return <CardsContent user={user} />;
}

function CardsContent({ user }: { user: User }) {
  const router = useRouter();
  const { openPack } = useCardMutations();

  const [openingPhase, setOpeningPhase] = useState<PackPhase | null>(null);
  const [revealCard, setRevealCard] = useState<CardType | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewCard, setViewCard] = useState<CardType | null>(null);

  const unlockedItems = useMemo(() => user.unlockedItems || [], [user.unlockedItems]);
  const stats = useMemo(() => computeStats(user), [user]);
  const collectedIds = useMemo(() => new Set(unlockedItems), [unlockedItems]);

  const playerCount = PLAYER_CARDS.filter((c) => collectedIds.has(c.id)).length;
  const legendCount = LEGEND_CARDS.filter((c) => collectedIds.has(c.id)).length;
  const totalCollected = playerCount + legendCount;
  const allPlayersCollected = playerCount >= TOTAL_PLAYER_CARDS;
  const allCollected = allPlayersCollected && legendCount >= TOTAL_LEGEND_CARDS;

  // Economy: coins = total points − points already spent on opened packs.
  const coins = computeCoins(stats.totalPoints, unlockedItems);
  const cost = allPlayersCollected ? LEGEND_PACK_COST : CARD_PACK_COST;
  const canAfford = coins >= cost;
  const nextCard = useMemo(() => getNextRandomCard(unlockedItems), [unlockedItems]);
  const canOpen = canAfford && !!nextCard && !openingPhase;

  const handleOpenPack = useCallback(() => {
    if (!canOpen) return;
    const card = getNextRandomCard(unlockedItems);
    if (!card) return;
    setRevealCard(card);
    setOpeningPhase('shake');

    // Shake 1.2s → flip 0.8s → reveal with confetti.
    setTimeout(() => setOpeningPhase('flip'), 1200);
    setTimeout(() => {
      setOpeningPhase('reveal');
      setShowConfetti(true);
      openPack.mutate([...unlockedItems, card.id]);
      setTimeout(() => setShowConfetti(false), 3000);
    }, 2100);
  }, [canOpen, unlockedItems, openPack]);

  function handleFinishReveal() {
    setOpeningPhase(null);
    setRevealCard(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md">
      <TopBar />
      <div className="px-4 pt-5 pb-8">
        {showConfetti && <Confetti />}

        {openingPhase && revealCard && (
          <PackOpeningOverlay
            card={revealCard}
            phase={openingPhase}
            onFinish={handleFinishReveal}
          />
        )}

        {viewCard && <CardDetailModal card={viewCard} onClose={() => setViewCard(null)} />}

        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-hogalid-yellow mb-4 flex items-center gap-1 text-[15px] font-bold"
        >
          <ArrowLeft size={16} /> Tillbaka
        </button>

        <div className="mb-5 text-center">
          <div className="font-display mb-1 text-[26px] text-white">Samlarkort</div>
          <div className="text-hogalid-yellow text-[13px] font-bold tracking-wide uppercase">
            Damlandslaget 2026 — {TOTAL_PLAYER_CARDS} spelare
          </div>
        </div>

        {/* Coin balance */}
        <Card className="mb-3 flex items-center justify-between px-[18px] py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🪙</span>
            <div>
              <div className="text-[11px] font-bold tracking-wide text-white/50 uppercase">
                Ditt saldo
              </div>
              <div
                className={cn(
                  'font-display text-[22px] leading-tight',
                  canAfford ? 'text-hogalid-yellow' : 'text-white/50',
                )}
              >
                {coins} mynt
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-white/35">Nästa kort kostar</div>
            <div
              className={cn(
                'text-sm font-bold',
                canAfford ? 'text-hogalid-yellow' : 'text-white/40',
              )}
            >
              {allCollected ? '—' : `${cost} mynt`}
            </div>
          </div>
        </Card>

        {/* Collection progress */}
        <Card className="mb-4 px-[18px] py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[15px] font-bold text-white">Din samling</div>
            <div className="text-hogalid-yellow font-display text-lg">
              {totalCollected}/{TOTAL_PLAYER_CARDS + TOTAL_LEGEND_CARDS}
            </div>
          </div>

          <div className="mb-2.5">
            <div className="mb-1 flex justify-between">
              <span className="text-xs font-semibold text-white/60">
                ⚽ Spelare ({TOTAL_PLAYER_CARDS} st)
              </span>
              <span
                className={cn(
                  'text-xs font-bold',
                  allPlayersCollected ? 'text-hogalid-yellow' : 'text-white/50',
                )}
              >
                {playerCount}/{TOTAL_PLAYER_CARDS} {allPlayersCollected && '✅'}
              </span>
            </div>
            <ProgressBar
              value={(playerCount / TOTAL_PLAYER_CARDS) * 100}
              color="#f0dc00"
              height={8}
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between">
              <span className="text-xs font-semibold text-white/60">
                👑 Legendkort ({TOTAL_LEGEND_CARDS} st)
              </span>
              <span
                className={cn(
                  'text-xs font-bold',
                  allPlayersCollected
                    ? legendCount >= TOTAL_LEGEND_CARDS
                      ? 'text-[#ffd700]'
                      : 'text-white/50'
                    : 'text-white/30',
                )}
              >
                {allPlayersCollected
                  ? `${legendCount}/${TOTAL_LEGEND_CARDS} ${legendCount >= TOTAL_LEGEND_CARDS ? '✅' : ''}`
                  : `🔒 Samla alla ${TOTAL_PLAYER_CARDS} spelare först`}
              </span>
            </div>
            <ProgressBar
              value={allPlayersCollected ? (legendCount / TOTAL_LEGEND_CARDS) * 100 : 0}
              color={allPlayersCollected ? '#ffd700' : 'rgba(255,255,255,0.2)'}
              height={8}
            />
          </div>
        </Card>

        {/* Open pack */}
        {!allCollected ? (
          <Card
            className={cn(
              'mb-5 px-4 py-5 text-center',
              canOpen && 'border-[1.5px] border-[rgba(240,220,0,0.33)]',
            )}
          >
            <div className="mb-4 flex justify-center">
              <div className={cn(canOpen && 'animate-gentle-pulse')}>
                <CardBack size={0.9} />
              </div>
            </div>

            <div className="font-display mb-1 text-lg text-white">
              {allPlayersCollected ? 'Öppna legendkort' : 'Öppna nytt spelarkort'}
            </div>
            <div className="mb-3.5 text-xs text-white/50">
              {allPlayersCollected
                ? `${TOTAL_LEGEND_CARDS - legendCount} av ${TOTAL_LEGEND_CARDS} legendkort kvar`
                : `${TOTAL_PLAYER_CARDS - playerCount} av ${TOTAL_PLAYER_CARDS} spelare i Damlandslaget 2026 kvar`}
            </div>

            <button
              type="button"
              onClick={handleOpenPack}
              disabled={!canOpen}
              className={cn(
                'font-display rounded-2xl px-8 py-3.5 text-lg transition-all',
                canOpen
                  ? 'from-hogalid-yellow to-hogalid-yellow-glow text-hogalid-dark cursor-pointer bg-gradient-to-br shadow-[0_4px_20px_#f0dc0044]'
                  : 'cursor-not-allowed bg-white/10 text-white/35',
              )}
            >
              {canOpen ? `🪙 Öppna kort — ${cost} mynt` : `${cost} mynt krävs (du har ${coins})`}
            </button>

            {!canOpen && (
              <div className="mt-2.5 text-[11px] text-white/30">
                Träna och logga för att tjäna fler mynt!
              </div>
            )}
          </Card>
        ) : (
          <Card className="mb-5 border-2 border-[#ffd700] bg-gradient-to-br from-[rgba(255,215,0,0.08)] to-[rgba(255,215,0,0.02)] px-4 py-5 text-center">
            <div className="mb-2 text-[42px]">🏆</div>
            <div className="font-display mb-1 text-xl text-[#ffd700]">Komplett samling!</div>
            <div className="text-[13px] text-white/50">
              Du har samlat alla {TOTAL_PLAYER_CARDS} spelare + {TOTAL_LEGEND_CARDS} legender!
            </div>
          </Card>
        )}

        {/* Player collection */}
        <div className="mb-5">
          <div className="font-display mb-1 text-lg text-white">Damlandslaget 2026</div>
          <div className="mb-3 text-xs font-semibold text-white/40">
            {playerCount} av {TOTAL_PLAYER_CARDS} spelare samlade
          </div>
          <CardCollectionGrid
            cards={PLAYER_CARDS}
            collectedIds={collectedIds}
            onView={setViewCard}
          />
        </div>

        {/* Legend collection */}
        <div className="mb-5">
          <div
            className={cn(
              'font-display mb-1 text-lg',
              allPlayersCollected ? 'text-[#ffd700]' : 'text-white/35',
            )}
          >
            {allPlayersCollected ? '👑' : '🔒'} Legendkort
          </div>
          <div
            className={cn(
              'mb-3 text-xs font-semibold',
              allPlayersCollected ? 'text-[rgba(255,215,0,0.5)]' : 'text-white/25',
            )}
          >
            {allPlayersCollected
              ? `${legendCount} av ${TOTAL_LEGEND_CARDS} legender samlade`
              : `Samla alla ${TOTAL_PLAYER_CARDS} spelare för att låsa upp`}
          </div>

          {!allPlayersCollected ? (
            <Card className="px-4 py-4 text-center opacity-60">
              <div className="mb-1.5 text-[28px]">🔒</div>
              <div className="text-[13px] font-semibold text-white/50">
                Samla alla {TOTAL_PLAYER_CARDS} spelare i Damlandslaget 2026 för att låsa upp
                legendkorten
              </div>
              <div className="mt-1 text-xs text-white/30">
                {TOTAL_PLAYER_CARDS - playerCount} kort kvar
              </div>
            </Card>
          ) : (
            <CardCollectionGrid
              cards={LEGEND_CARDS}
              collectedIds={collectedIds}
              onView={setViewCard}
            />
          )}
        </div>
      </div>
    </main>
  );
}
