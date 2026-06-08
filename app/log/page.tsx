'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { COLORS, EXERCISES, SUMMER_ACTIVITIES } from '@/constants';
import { computeStats, getLevel, localToday } from '@/utils';
import { ButtonLoader, PenaltyGame, TopBar, LoadingSpinner } from '@/components/common';
import {
  WeekCalendar,
  ExerciseInput,
  ActivityInput,
  SaveSummary,
  type SaveSummaryData,
} from '@/components/log';
import { useUser } from '@/providers/UserProvider';
import { useLogMutations } from '@/hooks/useLogMutations';
import { cn } from '@/lib/cn';
import type { User } from '@/types';

const SECTION_LABEL = 'mb-2.5 text-xs font-semibold tracking-wider text-white/50 uppercase';

const PAIRED_BEFORE = ['toetaps', 'tvafotare', 'suldrag', 'cruyff'];
const PAIRED_AFTER = ['passningar', 'skott'];

function digitsOnly(val: string): string {
  return val.replace(/\D/g, '');
}

function clamp(val: string, min: number, max: number): string {
  if (val === '') return '';
  const n = Number(val);
  if (isNaN(n)) return '';
  return String(Math.min(Math.max(Math.round(n), min), max));
}

interface ExerciseField {
  id: string;
  value: string;
  highscore: string;
}

export default function LogPage() {
  const router = useRouter();
  const { user, isLeader, isLoading } = useUser();

  // Leaders (coaches) don't log training — send them to the team view.
  useEffect(() => {
    if (isLeader) router.replace('/team');
  }, [isLeader, router]);

  if (isLoading || !user || isLeader) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar..." />
      </main>
    );
  }
  return <LogContent user={user} />;
}

function LogContent({ user }: { user: User }) {
  const router = useRouter();
  const { isDemo } = useUser();
  const { saveLog, editLog, savePenalty, recordSecretProgress } = useLogMutations();
  const saving = saveLog.isPending || editLog.isPending;

  const today = localToday();
  const [date, setDate] = useState(today);
  const [exercises, setExercises] = useState<ExerciseField[]>(
    EXERCISES.map((e) => ({ id: e.id, value: '', highscore: '' })),
  );
  const [summer, setSummer] = useState({ iceCream: '', swim: '', pages: '' });
  const [saved, setSaved] = useState(false);
  const [saveSummary, setSaveSummary] = useState<SaveSummaryData | null>(null);
  const [tooLittle, setTooLittle] = useState(false);
  const [btnVisible, setBtnVisible] = useState(true);
  const [showPenalty, setShowPenalty] = useState(false);
  const lastScrollY = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const beforeCards = EXERCISES.filter((ex) => PAIRED_BEFORE.includes(ex.id));
  const afterCards = EXERCISES.filter((ex) => PAIRED_AFTER.includes(ex.id));
  const freeTraining = EXERCISES.find((ex) => ex.id === 'fritraning');
  const jonglera = EXERCISES.find((ex) => ex.id === 'jonglera');

  const selectedDateLog =
    (user.logs || [])
      .filter((l) => l.date === date && !l.bingo && !l.dailyChallenge)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0] || null;

  // Fill the form from the selected date's existing log (or clear it).
  useEffect(() => {
    const log = (user.logs || [])
      .filter((l) => l.date === date && !l.bingo && !l.dailyChallenge)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0];
    if (log) {
      setExercises(
        EXERCISES.map((ex) => {
          const found = (log.exercises || []).find((e) => e.id === ex.id);
          return { id: ex.id, value: found ? String(found.value) : '', highscore: '' };
        }),
      );
      setSummer({
        iceCream: log.iceCream ? String(log.iceCream) : '',
        swim: log.swim ? String(log.swim) : '',
        pages: log.pages ? String(log.pages) : '',
      });
    } else {
      setExercises(EXERCISES.map((e) => ({ id: e.id, value: '', highscore: '' })));
      setSummer({ iceCream: '', swim: '', pages: '' });
    }
  }, [date, user.logs]);

  // Scroll-aware sticky save button: hide while scrolling up away from its anchor.
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const scrollingDown = y > lastScrollY.current;
      const sentinel = sentinelRef.current;
      if (sentinel) {
        const naturalPosVisible = sentinel.getBoundingClientRect().top < window.innerHeight;
        setBtnVisible(naturalPosVisible || scrollingDown);
      }
      lastScrollY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function setVal(id: string, field: 'value' | 'highscore', val: string) {
    const ex = EXERCISES.find((e) => e.id === id);
    const clamped = ex ? clamp(digitsOnly(val), 0, ex.max) : digitsOnly(val);
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: clamped } : e)));
  }

  function setSummerVal(id: 'iceCream' | 'swim' | 'pages', val: string) {
    const act = SUMMER_ACTIVITIES.find((a) => a.id === id);
    const clamped = act ? clamp(digitsOnly(val), 0, act.max) : digitsOnly(val);
    setSummer((prev) => ({ ...prev, [id]: clamped }));
  }

  function openPenaltyGame() {
    recordSecretProgress.mutate({ foundPenaltyGame: true });
    setShowPenalty(true);
  }

  function getField(id: string): ExerciseField {
    return exercises.find((e) => e.id === id) ?? { id, value: '', highscore: '' };
  }

  async function handleSave() {
    if (saving) return;
    const filled = exercises.filter((e) => e.value !== '' && Number(e.value) > 0);
    const summerFilled = Object.values(summer).some((v) => v !== '' && Number(v) > 0);
    if (filled.length === 0 && !summerFilled) return;

    const freeEx = exercises.find((e) => e.id === 'fritraning');
    const totalMins = freeEx && freeEx.value !== '' ? Number(freeEx.value) : 0;
    const totalTouch = filled.reduce((s, e) => {
      const ex = EXERCISES.find((x) => x.id === e.id);
      return s + (ex?.isTime || e.id === 'skott' ? 0 : Number(e.value));
    }, 0);

    if (filled.length > 0 && !summerFilled) {
      const meetsThreshold = totalMins >= 5 || totalTouch >= 30;
      if (!meetsThreshold) {
        // Easter egg: exactly 37 skott alone opens the penalty shootout (never a real log).
        const skottOnly =
          filled.length === 1 && filled[0]!.id === 'skott' && Number(filled[0]!.value) === 37;
        if (skottOnly) {
          openPenaltyGame();
          return;
        }
        setTooLittle(true);
        setTimeout(() => setTooLittle(false), 3000);
        return;
      }
    }

    const points = totalTouch + totalMins * 5;
    const statsBefore = computeStats(user);
    const levelBefore = getLevel(statsBefore.totalPoints);

    const newHighscores = { ...user.highscores };
    let hasNewRecord = false;
    exercises.forEach((e) => {
      if (e.highscore && Number(e.highscore) > 0) {
        if (!newHighscores[e.id] || Number(e.highscore) > newHighscores[e.id]!) {
          newHighscores[e.id] = Number(e.highscore);
          hasNewRecord = true;
        }
      }
    });

    // Never persist the magic 37 skott — they only unlock the Easter egg.
    const filledToSave = filled.filter((e) => !(e.id === 'skott' && Number(e.value) === 37));
    const log = {
      date,
      exercises: filledToSave.map((e) => ({ id: e.id, value: Number(e.value) })),
      iceCream: Number(summer.iceCream) || 0,
      swim: Number(summer.swim) || 0,
      pages: Number(summer.pages) || 0,
    };

    try {
      if (selectedDateLog) {
        await editLog.mutateAsync({ logId: selectedDateLog.id, log });
      } else {
        await saveLog.mutateAsync({ log, highscores: newHighscores });
      }
    } catch {
      // The mutation error is logged server-side; let the user retry.
      return;
    }

    const levelAfter = getLevel(statsBefore.totalPoints + points);
    setSaveSummary({
      points,
      touch: totalTouch,
      mins: totalMins,
      newRecord: hasNewRecord,
      leveledUp: levelAfter.name !== levelBefore.name ? levelAfter : null,
      isEdit: !!selectedDateLog,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSaveSummary(null);
    }, 4000);

    // Easter egg: 37 skott alongside a real log still triggers the shootout.
    const skottVal = filled.find((e) => e.id === 'skott');
    if (skottVal && Number(skottVal.value) === 37) openPenaltyGame();
  }

  function closeSummary() {
    setSaved(false);
    setSaveSummary(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md">
      <TopBar />

      {saveSummary && saved && <SaveSummary summary={saveSummary} onClose={closeSummary} />}

      <div className="px-4 pt-5 pb-[calc(116px+env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-hogalid-yellow mb-4 flex items-center gap-1 text-[15px] font-bold"
        >
          <ArrowLeft size={16} /> Tillbaka
        </button>

        <div className="font-display mb-1 text-[26px] text-white">Dagbok 📕</div>
        <div className="mb-4 text-[13px] text-white/50">Fyll i vad du gjort!</div>

        <WeekCalendar
          selectedDate={date}
          today={today}
          logDates={
            new Set(
              (user.logs || []).filter((l) => !l.bingo && !l.dailyChallenge).map((l) => l.date),
            )
          }
          onSelect={setDate}
        />

        {/* Training */}
        <div className={SECTION_LABEL}>⚽ Träning</div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          {beforeCards.map((ex) => {
            const f = getField(ex.id);
            return (
              <ExerciseInput
                key={ex.id}
                exercise={ex}
                value={f.value}
                highscore={f.highscore}
                onValue={(v) => setVal(ex.id, 'value', v)}
                onHighscore={(v) => setVal(ex.id, 'highscore', v)}
                layout="stacked"
              />
            );
          })}
        </div>
        {freeTraining && (
          <div className="mb-3">
            <ExerciseInput
              exercise={freeTraining}
              value={getField('fritraning').value}
              highscore=""
              onValue={(v) => setVal('fritraning', 'value', v)}
              onHighscore={() => {}}
              layout="inline"
            />
          </div>
        )}
        {jonglera && (
          <div className="mb-6">
            <ExerciseInput
              exercise={jonglera}
              value={getField('jonglera').value}
              highscore={getField('jonglera').highscore}
              onValue={(v) => setVal('jonglera', 'value', v)}
              onHighscore={(v) => setVal('jonglera', 'highscore', v)}
              layout="inline"
            />
          </div>
        )}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {afterCards.map((ex) => {
            const f = getField(ex.id);
            return (
              <ExerciseInput
                key={ex.id}
                exercise={ex}
                value={f.value}
                highscore={f.highscore}
                onValue={(v) => setVal(ex.id, 'value', v)}
                onHighscore={(v) => setVal(ex.id, 'highscore', v)}
                layout="stacked"
              />
            );
          })}
        </div>

        {/* Summer activities */}
        <div className={SECTION_LABEL}>☀️ Sommargrejer</div>
        <div className="mb-6 grid grid-cols-3 gap-2.5">
          {SUMMER_ACTIVITIES.map((act) => (
            <ActivityInput
              key={act.id}
              activity={act}
              value={summer[act.id as 'iceCream' | 'swim' | 'pages'] || ''}
              onChange={(v) => setSummerVal(act.id as 'iceCream' | 'swim' | 'pages', v)}
            />
          ))}
        </div>

        {tooLittle && (
          <div className="border-hogalid-red text-hogalid-red mb-4 rounded-xl border bg-[rgba(220,40,40,0.15)] px-4 py-3 text-sm font-semibold">
            ⚠️ Minst 5 minuter eller 30 touch krävs!
          </div>
        )}

        <div ref={sentinelRef} />
      </div>

      {/* Sticky save button */}
      <div
        className={cn(
          'fixed bottom-0 left-1/2 z-[100] w-full max-w-md -translate-x-1/2 px-4 pt-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))]',
          'bg-[linear-gradient(to_bottom,transparent_0%,#001540dd_30%)] backdrop-blur-md transition-all duration-300',
          btnVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
        )}
      >
        {isDemo && (
          <div className="mb-3 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-center text-[13px] font-semibold text-white/75">
            🎮 I demoläget sparas inga pass — skapa ett konto för att logga på riktigt.
          </div>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || isDemo}
          className={cn(
            'text-hogalid-dark font-display flex w-full items-center justify-center gap-1.5 rounded-2xl py-4 text-xl shadow-[0_4px_24px_#f0dc0055] transition-colors',
            saving || isDemo ? 'cursor-not-allowed bg-[rgba(240,220,0,0.5)]' : 'bg-hogalid-yellow',
          )}
        >
          {saving ? (
            <>
              <ButtonLoader color={COLORS.dark} /> Sparar...
            </>
          ) : saved ? (
            '✅ Sparat!'
          ) : selectedDateLog ? (
            <>
              Uppdatera <ArrowRight size={20} />
            </>
          ) : (
            <>
              Spara <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>

      {showPenalty && (
        <PenaltyGame
          alias={user.alias}
          onClose={async (score) => {
            setShowPenalty(false);
            if (typeof score === 'number') {
              try {
                await recordSecretProgress.mutateAsync({ penaltyBest: score });
                await savePenalty.mutateAsync(score);
              } catch {
                // Navigate home regardless of save errors.
              }
              router.push('/');
            }
          }}
        />
      )}
    </main>
  );
}
