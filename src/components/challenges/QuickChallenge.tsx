'use client';

import { useEffect, useState } from 'react';
import { EXERCISES } from '@/constants';
import { ButtonLoader } from '@/components/common';
import type { BuddyChallenge, Exercise, User } from '@/types';

const QUICK_AMOUNTS: Record<string, number[]> = {
  toetaps: [60, 80, 100, 120, 150],
  tvafotare: [50, 75, 100, 125, 150],
  jonglera: [50, 60, 75, 100],
  suldrag: [50, 75, 100, 125, 150],
  cruyff: [50, 60, 75, 100],
  passningar: [50, 60, 75, 100],
  skott: [15, 20, 25, 30],
  fritraning: [15, 20, 25, 30],
};

function pickRandom<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function minimumFor(ex: Exercise): number {
  if (ex.isTime) return 15;
  if (ex.unit === 'touch') return 50;
  return 15;
}

interface Suggestion {
  teammate: User;
  exercise: Exercise;
  amount: number;
}

interface QuickChallengeProps {
  user: User;
  teammates: User[];
  buddyChallenges: BuddyChallenge[];
  activeCountByAlias: Record<string, number>;
  getUserLabel: (u: User) => string;
  onCreate: (
    toAlias: string,
    exerciseId: string,
    amount: number,
  ) => Promise<{ ok: boolean; error?: string }>;
}

function build({
  user,
  teammates,
  buddyChallenges,
  activeCountByAlias,
}: Pick<
  QuickChallengeProps,
  'user' | 'teammates' | 'buddyChallenges' | 'activeCountByAlias'
>): Suggestion | null {
  const available = teammates.filter((tm) => {
    const count = activeCountByAlias[tm.alias] || 0;
    const hasPair = buddyChallenges.some(
      (c) =>
        ((c.fromAlias === user.alias && c.toAlias === tm.alias) ||
          (c.fromAlias === tm.alias && c.toAlias === user.alias)) &&
        ['pending', 'active'].includes(c.status),
    );
    return count < 3 && !hasPair;
  });
  if (available.length === 0) return null;

  const exercise = pickRandom(EXERCISES);
  const min = minimumFor(exercise);
  const fallback = Math.max(min, Math.round(exercise.max * 0.15));
  const amounts = (QUICK_AMOUNTS[exercise.id] || [fallback]).filter((a) => a >= min);
  return {
    teammate: pickRandom(available),
    exercise,
    amount: pickRandom(amounts.length ? amounts : [fallback]),
  };
}

/** One-tap "snabbutmaning" — picks a teammate, exercise, and sensible amount. */
export function QuickChallenge(props: QuickChallengeProps) {
  const { user, teammates, buddyChallenges, getUserLabel, onCreate } = props;
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSuggestion((prev) => prev ?? build(props));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.alias, teammates.length, buddyChallenges.length]);

  function refresh() {
    setSuggestion(build(props));
  }

  async function submit() {
    if (!suggestion) return;
    setBusy(true);
    const result = await onCreate(
      suggestion.teammate.alias,
      suggestion.exercise.id,
      suggestion.amount,
    );
    setBusy(false);
    refresh();
    return result;
  }

  return (
    <div className="mb-3.5 rounded-2xl border border-[rgba(240,220,0,0.22)] bg-[linear-gradient(135deg,rgba(240,220,0,0.16),rgba(255,255,255,0.04))] px-3.5 pt-3.5 pb-3">
      <div className="text-hogalid-yellow mb-1.5 text-[11px] font-extrabold tracking-wider uppercase">
        ⚡ Snabbutmaning
      </div>
      {suggestion ? (
        <>
          <div className="text-base leading-snug font-extrabold text-white">
            Utmana {getUserLabel(suggestion.teammate)} på {suggestion.amount}{' '}
            {suggestion.exercise.label.toLowerCase()}?
          </div>
          <div className="mt-1.5 text-xs text-white/55">
            Ett klick och klart. Vi väljer kompis, övning och rimlig mängd åt dig.
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="bg-hogalid-yellow text-hogalid-dark font-display flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-base"
            >
              {busy ? (
                <>
                  <ButtonLoader color="#001540" /> Skickar...
                </>
              ) : (
                'Ja, kör!'
              )}
            </button>
            <button
              type="button"
              onClick={refresh}
              disabled={busy}
              className="rounded-xl border border-white/[0.18] bg-white/[0.08] px-3.5 py-2.5 text-[13px] font-bold text-white/80"
            >
              Nej, ny
            </button>
          </div>
        </>
      ) : (
        <div className="text-[13px] leading-relaxed text-white/50">
          Alla möjliga kompisutmaningar är upptagna just nu. Testa igen lite senare eller skapa en
          egen.
        </div>
      )}
    </div>
  );
}
