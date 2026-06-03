'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface IntroPage {
  eyebrow: string;
  icon: string;
  title: string;
  body: string;
}

const INTRO_PAGES: IntroPage[] = [
  {
    eyebrow: 'Välkommen',
    icon: '⚽',
    title: 'Din sommarutmaning börjar nu',
    body: 'Här kan du träna, samla poäng och låsa upp nya grejer. Är du redo?',
  },
  {
    eyebrow: 'Dagboken',
    icon: '📕',
    title: 'Logga det du tränar',
    body: 'I Dagboken fyller du i touch, skott, jonglering eller fri träning. Allt du gör räknas.',
  },
  {
    eyebrow: 'Poäng',
    icon: '⭐',
    title: 'Poäng visar hur mycket du kämpar',
    body: 'När du tränar och loggar får du poäng. Poängen blir också mynt som du kan använda för att låsa upp samlarkort. Ju fler poäng du samlar, desto längre kommer du.',
  },
  {
    eyebrow: 'Streak',
    icon: '🔥',
    title: 'Träna flera dagar i rad',
    body: 'När du tränar flera dagar i rad bygger du en streak. Ju längre streak, desto snyggare jobbat.',
  },
  {
    eyebrow: 'Utmaningar',
    icon: '⚡',
    title: 'Det finns alltid något nytt att klara',
    body: 'Testa dagsutmaningar, lagutmaningar och roliga extrauppdrag. Vissa är snabba, andra riktigt kluriga.',
  },
  {
    eyebrow: 'Kompisutmaningar',
    icon: '🤝',
    title: 'Utmana en lagkompis',
    body: 'Klara uppdraget tillsammans och visa vad ni kan. Två är starkare än en, och det ger dubbla poäng!',
  },
  {
    eyebrow: 'Bingo',
    icon: '🌞',
    title: 'Kryssa rutor i bingot',
    body: 'I Bingo väntar massor av roliga uppdrag. Försök fylla hela brickan och se hur många rutor du kan ta.',
  },
  {
    eyebrow: 'Din profil',
    icon: '👧',
    title: 'Gör din figur unik',
    body: 'I Din profil kan du bygga din egen avatar. När du spelar och tränar kan du låsa upp fler saker.',
  },
  {
    eyebrow: 'Tips',
    icon: '📲',
    title: 'Lägg appen på hemskärmen',
    body: 'Vill du öppna Sommarlovet som en riktig app? På iPhone: tryck på Dela-knappen i webbläsaren och välj ”Lägg till på hemskärmen”. På Android: öppna webbläsarens meny (⋮) och välj ”Lägg till på hemskärmen” eller ”Installera app”. Då får du en egen ikon på mobilen!',
  },
  {
    eyebrow: 'Nu kör vi',
    icon: '🚀',
    title: 'Allt du gör räknas',
    body: 'Börja i Dagboken, testa en Utmaning eller kolla Bingo. Let’s go! Ha en riktigt härlig fotbollssommar!',
  },
];

/**
 * Onboarding modal walked through on first visit (and re-openable from Home).
 * Owns its own page index — the parent only toggles whether it is shown.
 */
export function IntroCarousel({ onClose }: { onClose: () => void }) {
  const [pageIndex, setPageIndex] = useState(0);
  const page = INTRO_PAGES[pageIndex]!;
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === INTRO_PAGES.length - 1;
  const touchStartXRef = useRef<number | null>(null);

  function goPrev() {
    setPageIndex((p) => Math.max(0, p - 1));
  }

  function goNext() {
    if (isLast) onClose();
    else setPageIndex((p) => Math.min(INTRO_PAGES.length - 1, p + 1));
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartXRef.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < 50) return;
    // Swipe right → previous page; swipe left → next page (or close on the last).
    if (deltaX > 0) goPrev();
    else goNext();
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label="Stäng"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 px-4 py-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={page.title}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="border-hogalid-yellow/30 w-full max-w-[380px] touch-pan-y rounded-3xl border-2 bg-[linear-gradient(160deg,rgba(0,20,64,0.98)_0%,rgba(0,40,100,0.96)_58%,rgba(220,40,40,0.88)_100%)] px-5 pt-[22px] pb-[18px] shadow-[0_18px_70px_rgba(0,0,0,0.45)]"
      >
        <div className="mb-[18px] flex items-start justify-between">
          <div>
            <div className="text-hogalid-yellow mb-1.5 text-[11px] font-extrabold tracking-wider uppercase">
              {page.eyebrow}
            </div>
            <div className="font-display max-w-[240px] text-[28px] leading-[1.1] text-white">
              {page.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="h-[34px] w-[34px] shrink-0 rounded-full bg-white/10 text-xl leading-none text-white/[0.78]"
          >
            ×
          </button>
        </div>

        <div className="mb-[18px] flex h-[88px] w-[88px] items-center justify-center rounded-3xl border border-white/15 bg-white/[0.08] text-[42px]">
          {page.icon}
        </div>

        <div className="mb-5 text-base leading-[1.5] font-bold text-white/90">
          {isFirst && (
            <div className="text-hogalid-yellow font-display mb-3.5 text-2xl leading-[1.1]">
              Heja Högans brudar!
            </div>
          )}
          {page.body}
        </div>

        <div className="mb-[18px] flex gap-1.5">
          {INTRO_PAGES.map((p, idx) => (
            <div
              key={p.eyebrow}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                idx === pageIndex ? 'bg-hogalid-yellow' : 'bg-white/15',
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            className="flex min-w-[92px] items-center justify-center gap-1.5 rounded-[14px] px-3.5 py-3 text-sm font-bold text-white enabled:bg-white/[0.14] disabled:cursor-default disabled:bg-white/[0.08] disabled:text-white/[0.28]"
          >
            <ArrowLeft size={16} /> Tillbaka
          </button>
          <div className="text-xs font-bold text-white/50">
            {pageIndex + 1}/{INTRO_PAGES.length}
          </div>
          <button
            type="button"
            onClick={goNext}
            className="bg-hogalid-yellow text-hogalid-dark font-display flex min-w-[108px] items-center justify-center gap-1.5 rounded-[14px] px-4 py-3 text-base"
          >
            {isLast ? (
              'Spela!'
            ) : (
              <>
                Nästa <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
