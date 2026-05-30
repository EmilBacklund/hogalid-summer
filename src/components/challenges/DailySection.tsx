'use client';

import { type CSSProperties, forwardRef, useState } from 'react';
import { DAILY_CHALLENGES } from '@/constants';
import { Card, ButtonLoader, Confetti } from '@/components/common';
import { cn } from '@/lib/cn';
import type { DailyChallenge } from '@/types';

const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

interface DailySectionProps {
  daily: DailyChallenge;
  dailyDoneToday: boolean;
  completedDaily: Record<string, string>;
  completing: boolean;
  onComplete: () => Promise<void>;
}

/** Today's daily challenge card + the last few completed ones. */
export const DailySection = forwardRef<HTMLDivElement, DailySectionProps>(function DailySection(
  { daily, dailyDoneToday, completedDaily, completing, onComplete },
  ref,
) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const history = Object.entries(completedDaily)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)
    .map(([date, id]) => ({ date, challenge: DAILY_CHALLENGES.find((d) => d.id === id) }))
    .filter((e): e is { date: string; challenge: DailyChallenge } => Boolean(e.challenge));

  async function handleClick() {
    await onComplete();
    setJustCompleted(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }

  return (
    <>
      <Confetti active={showConfetti} />

      <div
        ref={ref}
        className="mb-2 scroll-mt-2 text-xs font-semibold tracking-wider text-white/50 uppercase"
      >
        📅 Dagens uppdrag
      </div>
      <Card
        className={cn(
          'mb-5 border-[1.5px]',
          dailyDoneToday
            ? 'border-hogalid-yellow bg-[rgba(240,220,0,0.08)]'
            : 'border-[rgba(240,220,0,0.3)] bg-white/[0.06]',
        )}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="text-4xl leading-none">{daily.icon}</div>
          <div className="flex-1">
            <div
              className={cn(
                'text-base leading-snug font-bold',
                dailyDoneToday ? 'text-white/50 line-through' : 'text-white',
              )}
            >
              {daily.label}
            </div>
            <div className="text-hogalid-yellow mt-[3px] text-[13px] font-bold">
              +{daily.points} poäng
            </div>
          </div>
        </div>

        {dailyDoneToday ? (
          <div className="rounded-2xl bg-[rgba(240,220,0,0.12)] px-3.5 py-4 text-center">
            {justCompleted ? (
              <>
                <div className="animate-daily-pop mb-1.5 text-4xl">{daily.icon}</div>
                <div
                  className="text-hogalid-yellow animate-daily-pop font-display text-[28px]"
                  style={delay(0.15)}
                >
                  +{daily.points}p
                </div>
                <div
                  className="text-hogalid-yellow animate-daily-slide mt-1 text-[15px] font-bold"
                  style={delay(0.3)}
                >
                  ✅ Bra jobbat!
                </div>
              </>
            ) : (
              <div className="text-hogalid-yellow text-[15px] font-bold">✅ Klarat idag!</div>
            )}
            <div
              className={cn(
                'mt-2 text-[11px] text-white/35',
                justCompleted && 'animate-daily-slide',
              )}
              style={justCompleted ? delay(0.5) : undefined}
            >
              Ny utmaning imorgon 🌅
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleClick()}
            disabled={completing}
            className={cn(
              'text-hogalid-dark font-display flex w-full items-center justify-center gap-1.5 rounded-xl py-3.5 text-lg transition-all',
              completing
                ? 'cursor-not-allowed bg-[rgba(240,220,0,0.5)] opacity-70'
                : 'bg-hogalid-yellow',
            )}
          >
            {completing ? (
              <>
                <ButtonLoader color="#001540" /> Sparar...
              </>
            ) : (
              '✅ Jag har gjort det!'
            )}
          </button>
        )}
      </Card>

      {history.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">
            ✨ Senaste klarade dagsuppdrag
          </div>
          <div className="flex flex-col gap-2">
            {history.map(({ date, challenge }) => (
              <div
                key={date}
                className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-2.5"
              >
                <div className="text-[22px]">{challenge.icon}</div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-white/60 line-through">
                    {challenge.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-white/30">{date}</div>
                </div>
                <div className="text-hogalid-yellow text-xs font-bold">+{challenge.points}p</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
});
