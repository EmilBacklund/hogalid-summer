'use client';

import { useState } from 'react';
import { COLORS } from '@/constants';
import { useConfig } from '@/hooks/useConfig';
import { useAdminMutations } from '@/hooks/useAdmin';
import { cn } from '@/lib/cn';

const PANEL = 'mb-3 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5';
const LABEL = 'mb-1 text-xs font-bold tracking-wider text-white/50 uppercase';
const INPUT =
  'flex-1 rounded-[10px] border border-white/20 bg-white/[0.08] px-3 py-2 text-[13px] text-white';

function SaveButton({
  onClick,
  disabled,
  saving,
  saved,
}: {
  onClick: () => void;
  disabled: boolean;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-[10px] px-4 py-2 text-[13px] font-bold whitespace-nowrap',
        disabled ? 'bg-white/10 text-white/35' : 'bg-hogalid-yellow text-hogalid-dark',
      )}
    >
      {saving ? 'Sparar...' : saved ? '✅ Sparat!' : 'Spara'}
    </button>
  );
}

/** Season reset (destructive) + countdown-date and season-start editors. */
export function SeasonControls() {
  const { data: config } = useConfig();
  const { resetSeason, setSeasonStart, setCountdownDate } = useAdminMutations();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [countdownInput, setCountdownInput] = useState('');
  const [countdownSaved, setCountdownSaved] = useState(false);
  const [seasonInput, setSeasonInput] = useState('');
  const [seasonSaved, setSeasonSaved] = useState(false);

  async function handleReset() {
    try {
      await resetSeason.mutateAsync();
      setResetDone(true);
      setShowResetConfirm(false);
    } catch (e) {
      alert('Kunde inte nollställa: ' + (e instanceof Error ? e.message : ''));
    }
  }

  async function handleCountdown() {
    if (!countdownInput) return;
    try {
      await setCountdownDate.mutateAsync(countdownInput);
      setCountdownSaved(true);
      setTimeout(() => setCountdownSaved(false), 3000);
    } catch (e) {
      alert('Kunde inte uppdatera: ' + (e instanceof Error ? e.message : ''));
    }
  }

  async function handleSeason() {
    if (!seasonInput) return;
    try {
      await setSeasonStart.mutateAsync(seasonInput);
      setSeasonSaved(true);
      setTimeout(() => setSeasonSaved(false), 3000);
    } catch (e) {
      alert('Kunde inte uppdatera: ' + (e instanceof Error ? e.message : ''));
    }
  }

  return (
    <>
      {resetDone ? (
        <div className="mb-5 rounded-2xl border border-[#f0dc00] bg-[rgba(168,230,61,0.1)] p-4 text-center">
          <div className="mb-1.5 text-[28px]">✅</div>
          <div className="text-hogalid-yellow text-base font-bold">Säsongen är nollställd!</div>
          <div className="mt-1 text-[13px] text-white/50">
            Alla spelare och träningar är borttagna. Utmaningarna börjar nu om från vecka 1.
          </div>
        </div>
      ) : showResetConfirm ? (
        <div className="mb-5 rounded-2xl border border-[rgba(220,40,40,0.5)] bg-[rgba(220,40,40,0.1)] p-4">
          <div className="mb-1.5 text-2xl">⚠️</div>
          <div className="mb-1.5 text-base font-bold text-[#f87171]">Är du helt säker?</div>
          <div className="mb-4 text-[13px] leading-relaxed text-white/60">
            Detta tar bort <strong className="text-white">alla spelare</strong>,{' '}
            <strong className="text-white">alla träningar</strong>, all bingo och alla dagliga
            utmaningar. Det går inte att ångra.
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleReset()}
              disabled={resetSeason.isPending}
              className="font-display flex-1 rounded-xl py-3 text-base text-white"
              style={{ background: COLORS.red, opacity: resetSeason.isPending ? 0.6 : 1 }}
            >
              {resetSeason.isPending ? 'Nollställer...' : 'Ja, nollställ allt'}
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="rounded-xl border border-white/20 px-4 py-3 text-sm text-white/60"
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="mb-5 w-full rounded-2xl border border-[rgba(220,40,40,0.4)] bg-[rgba(220,40,40,0.08)] py-3 text-sm font-bold text-[#f87171]"
        >
          🔄 Nollställ säsong inför sommarlovet
        </button>
      )}

      <div className={PANEL}>
        <div className={LABEL}>⏱️ Nedräkning — &quot;Första träningen&quot;</div>
        <div className="mb-2 text-xs text-white/40">
          Nuvarande:{' '}
          <span className="text-hogalid-yellow font-bold">
            {config?.countdownDate || '2026-08-17'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={countdownInput}
            onChange={(e) => setCountdownInput(e.target.value)}
            className={INPUT}
          />
          <SaveButton
            onClick={() => void handleCountdown()}
            disabled={!countdownInput || setCountdownDate.isPending}
            saving={setCountdownDate.isPending}
            saved={countdownSaved}
          />
        </div>
      </div>

      <div className={cn(PANEL, 'mb-4')}>
        <div className={LABEL}>📅 Ändra säsongstart</div>
        <div className="mb-2.5 text-xs leading-snug text-white/40">
          Ändrar startdatumet för säsongen utan att radera träningsdata. Påverkar dags- och
          veckoutmaningar.
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={seasonInput}
            onChange={(e) => setSeasonInput(e.target.value)}
            className={INPUT}
          />
          <SaveButton
            onClick={() => void handleSeason()}
            disabled={!seasonInput || setSeasonStart.isPending}
            saving={setSeasonStart.isPending}
            saved={seasonSaved}
          />
        </div>
      </div>
    </>
  );
}
