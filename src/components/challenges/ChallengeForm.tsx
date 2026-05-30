'use client';

import { useState } from 'react';
import { EXERCISES } from '@/constants';
import { Card, ButtonLoader } from '@/components/common';
import { cn } from '@/lib/cn';
import type { BuddyChallenge, User } from '@/types';

interface ChallengeFormProps {
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

/** The "skicka utmaning" form: pick a teammate, exercise, and amount. */
export function ChallengeForm({
  user,
  teammates,
  buddyChallenges,
  activeCountByAlias,
  getUserLabel,
  onCreate,
}: ChallengeFormProps) {
  const [formTo, setFormTo] = useState('');
  const [formExercise, setFormExercise] = useState(EXERCISES[0]!.id);
  const [formAmount, setFormAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedEx = EXERCISES.find((e) => e.id === formExercise);

  function pairExists(tmAlias: string): boolean {
    return buddyChallenges.some(
      (c) =>
        ((c.fromAlias === user.alias && c.toAlias === tmAlias) ||
          (c.fromAlias === tmAlias && c.toAlias === user.alias)) &&
        ['pending', 'active'].includes(c.status),
    );
  }

  async function submit() {
    if (!formTo || !formAmount || Number(formAmount) <= 0) return;
    setBusy(true);
    setError('');
    const result = await onCreate(formTo, formExercise, Number(formAmount));
    setBusy(false);
    if (result.ok) {
      setFormTo('');
      setFormAmount('');
    } else {
      setError(result.error || 'Något gick fel');
    }
  }

  return (
    <Card className="border-hogalid-yellow/[0.27] mb-3.5 border-[1.5px]">
      <div className="mb-3 text-sm font-bold text-white">Skicka utmaning</div>

      <div className="mb-2.5">
        <div className="mb-1.5 text-xs text-white/50">Utmana vem?</div>
        <div className="flex flex-wrap gap-2">
          {teammates.map((tm) => {
            const full = (activeCountByAlias[tm.alias] || 0) >= 3;
            const hasPair = pairExists(tm.alias);
            const disabled = full || hasPair;
            return (
              <button
                key={tm.alias}
                type="button"
                onClick={() => !disabled && setFormTo(tm.alias)}
                disabled={disabled}
                className={cn(
                  'rounded-[20px] px-3 py-1.5 text-[13px] font-semibold',
                  formTo === tm.alias
                    ? 'bg-hogalid-yellow text-hogalid-dark'
                    : disabled
                      ? 'bg-white/5 text-white/25'
                      : 'bg-white/10 text-white',
                )}
              >
                {getUserLabel(tm)}
                {full && <span className="ml-1 text-[10px] opacity-60">full</span>}
                {hasPair && <span className="ml-1 text-[10px] opacity-60">aktiv</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-2.5">
        <div className="mb-1.5 text-xs text-white/50">Övning</div>
        <div className="flex flex-wrap gap-1.5">
          {EXERCISES.map((ex) => {
            const selected = formExercise === ex.id;
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setFormExercise(ex.id)}
                style={
                  selected
                    ? { borderColor: ex.color, color: ex.color, background: `${ex.color}22` }
                    : undefined
                }
                className={cn(
                  'rounded-[10px] border-[1.5px] px-2.5 py-1.5 text-xs font-semibold',
                  !selected && 'border-transparent bg-white/[0.07] text-white/60',
                )}
              >
                {ex.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1.5 text-xs text-white/50">
          Antal {selectedEx?.unit} (max {selectedEx?.max})
        </div>
        <input
          type="number"
          min="1"
          max={selectedEx?.max}
          value={formAmount}
          onChange={(e) => setFormAmount(e.target.value)}
          placeholder={`0–${selectedEx?.max}`}
          aria-label={`Antal ${selectedEx?.unit ?? ''}`}
          className="focus:ring-hogalid-yellow/40 w-30 rounded-[10px] border-[1.5px] border-white/20 bg-white/[0.08] px-3 py-[9px] text-sm text-white outline-none focus:ring-2"
        />
      </div>

      {error && <div className="text-hogalid-red mb-2 text-[13px] font-semibold">⚠️ {error}</div>}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy || !formTo || !formAmount}
        className={cn(
          'font-display flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-[17px]',
          !formTo || !formAmount
            ? 'cursor-not-allowed bg-white/10 text-white/30'
            : 'bg-hogalid-yellow text-hogalid-dark',
        )}
      >
        {busy ? (
          <>
            <ButtonLoader color="#001540" /> Skickar...
          </>
        ) : (
          '📤 Skicka utmaning'
        )}
      </button>

      <div className="mt-3 flex flex-col gap-1.5 rounded-[10px] bg-white/5 px-3.5 py-2.5">
        {[
          `🤝 Ni ska klara ${formAmount ? `${formAmount} ${selectedEx?.unit}` : 'övningen'} var`,
          '⏰ Ni har 48h på er efter att kompisen accepterat',
          '🌟 Dubbla poäng när ni båda är klara!',
          '📊 Max tre aktiva utmaningar per person',
        ].map((line) => (
          <div key={line} className="text-xs font-semibold text-white/45">
            {line}
          </div>
        ))}
      </div>
    </Card>
  );
}
