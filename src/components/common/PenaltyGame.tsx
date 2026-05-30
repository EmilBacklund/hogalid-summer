'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { localToday } from '@/utils/date';
import { cn } from '@/lib/cn';

const LS_PREFIX = 'penalty_played_';
const TOTAL = 10;

type Dir = 'left' | 'right';
interface Penalty {
  playerDir: Dir;
  keeperDir: Dir;
  isGoal: boolean;
}
type Phase = 'intro' | 'shooting' | 'showing' | 'done';

function lsKey(alias: string): string {
  return `${LS_PREFIX}${alias}_${localToday()}`;
}

export function hasPenaltyPlayedToday(alias: string): boolean {
  return Boolean(localStorage.getItem(lsKey(alias)));
}

export function resetPenaltyToday(alias: string): void {
  localStorage.removeItem(lsKey(alias));
}

function markPlayed(alias: string): void {
  localStorage.setItem(lsKey(alias), '1');
}

function getResultText(score: number): string {
  if (score === 10) return 'Perfekt! Du är en straffspecialist! 🌟';
  if (score >= 8) return 'Superbt! Nästan perfekt! 🎯';
  if (score >= 6) return 'Bra jobbat! Solid insats! 👏';
  if (score >= 4) return 'Halvtid! Fortsätt träna! 💪';
  if (score >= 2) return 'Hoppsan! Målvakten var het idag... 🧤';
  return '😅 Riktigt tufft. Träna på skotten imorgon!';
}

function getResultEmoji(score: number): string {
  if (score === 10) return '🏆';
  if (score >= 8) return '🥇';
  if (score >= 6) return '⚽';
  if (score >= 4) return '💪';
  return '🧤';
}

/** The goal + animated keeper (the "Goalie" piece of the game). */
function GoalNet({ keeperSide, animate }: { keeperSide: Dir | null; animate: boolean }) {
  const tx = keeperSide === 'left' ? -70 : keeperSide === 'right' ? 70 : 0;
  return (
    <svg width="220" height="130" viewBox="0 0 220 130" className="block overflow-visible">
      <rect x="0" y="112" width="220" height="18" fill="#1d5e1d" />
      <rect x="0" y="112" width="220" height="3" fill="#2a7a2a" />
      <rect x="10" y="20" width="200" height="93" fill="rgba(255,255,255,0.03)" />
      {[33, 46, 59, 72, 85, 98].map((y) => (
        <line
          key={y}
          x1="10"
          y1={y}
          x2="210"
          y2={y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      {[28, 46, 64, 82, 100, 118, 136, 154, 172, 192].map((x) => (
        <line
          key={x}
          x1={x}
          y1="20"
          x2={x}
          y2="113"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      <rect x="7" y="16" width="6" height="98" rx="3" fill="#e8e8e8" />
      <rect x="207" y="16" width="6" height="98" rx="3" fill="#e8e8e8" />
      <rect x="7" y="16" width="206" height="6" rx="3" fill="#e8e8e8" />
      <g
        style={{
          transform: `translateX(${tx}px)`,
          transition: animate ? 'transform 0.22s ease-out' : 'none',
        }}
      >
        <rect x="90" y="68" width="40" height="44" rx="8" fill="#dc2626" />
        <circle cx="110" cy="56" r="14" fill="#fcd34d" />
        <circle cx="105" cy="53" r="2.5" fill="#1e293b" />
        <circle cx="115" cy="53" r="2.5" fill="#1e293b" />
        <path
          d="M104 61 Q110 66 116 61"
          stroke="#1e293b"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="79" cy="88" rx="10" ry="8" fill="#fcd34d" />
        <ellipse cx="141" cy="88" rx="10" ry="8" fill="#fcd34d" />
        <rect x="90" y="100" width="18" height="12" rx="4" fill="#1e293b" />
        <rect x="112" y="100" width="18" height="12" rx="4" fill="#1e293b" />
      </g>
    </svg>
  );
}

const PRIMARY_BTN =
  'bg-hogalid-yellow text-hogalid-dark font-display rounded-2xl shadow-[0_4px_20px_#f0dc0055]';

interface PenaltyGameProps {
  alias: string;
  /** Called with the final score on finish, or with no arg when dismissed. */
  onClose: (score?: number) => void;
}

/** Hidden easter-egg penalty shootout (10 shots, once per day). */
export function PenaltyGame({ onClose, alias }: PenaltyGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [alreadyPlayed, setAlreadyPlayed] = useState(() => hasPenaltyPlayedToday(alias));
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [score, setScore] = useState(0);
  const [keeperDir, setKeeperDir] = useState<Dir | null>(null);
  const [resultMsg, setResultMsg] = useState('');
  const [isGoalResult, setIsGoalResult] = useState(false);

  const shoot = useCallback(
    (dir: Dir) => {
      if (phase !== 'shooting') return;
      const kDir: Dir = Math.random() < 0.5 ? 'left' : 'right';
      const goal = dir !== kDir;

      setKeeperDir(kDir);
      setResultMsg(goal ? '⚽ MÅL!' : '🧤 Räddad!');
      setIsGoalResult(goal);

      const newPenalties = [...penalties, { playerDir: dir, keeperDir: kDir, isGoal: goal }];
      setPenalties(newPenalties);
      setScore((s) => s + (goal ? 1 : 0));
      setPhase('showing');

      if (newPenalties.length >= TOTAL) {
        setTimeout(() => setPhase('done'), 2200);
      }
    },
    [phase, penalties],
  );

  useEffect(() => {
    if (phase !== 'shooting') return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        shoot('left');
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        shoot('right');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, shoot]);

  function start() {
    markPlayed(alias);
    setPenalties([]);
    setScore(0);
    setKeeperDir(null);
    setResultMsg('');
    setIsGoalResult(false);
    setPhase('shooting');
  }

  function next() {
    setKeeperDir(null);
    setResultMsg('');
    setIsGoalResult(false);
    setPhase('shooting');
  }

  const isLast = penalties.length === TOTAL;

  const overlay = (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/[0.93] px-5 py-6">
      {phase === 'intro' && (
        <div className="max-w-[320px] text-center">
          <div className="mb-3 text-6xl leading-none">🎯</div>
          <div className="font-display mb-2 text-[28px] text-white">Hemlig penaltyround!</div>
          <div className="mb-2 text-sm leading-relaxed text-white/60">
            37 skott? Nu är det dags att omsätta dem på pliktpunkten...
          </div>
          <div className="mb-8 text-xs text-white/35">
            10 straffar · vänster eller höger · en gång om dagen
          </div>
          {alreadyPlayed ? (
            <>
              <div className="mb-4 text-sm text-[#fbbf24]">Du har redan spelat idag 🏅</div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    resetPenaltyToday(alias);
                    setAlreadyPlayed(false);
                  }}
                  className="rounded-xl border border-white/20 bg-white/[0.08] px-6 py-3 text-sm text-white/60"
                >
                  Spela igen (test)
                </button>
                <button
                  onClick={() => onClose()}
                  className={cn(PRIMARY_BTN, 'px-6 py-3 text-base')}
                >
                  Stäng
                </button>
              </div>
            </>
          ) : (
            <button onClick={start} className={cn(PRIMARY_BTN, 'px-12 py-4 text-[22px]')}>
              Starta! ⚽
            </button>
          )}
        </div>
      )}

      {(phase === 'shooting' || phase === 'showing') && (
        <div className="w-full max-w-[340px] text-center">
          <div className="mb-2.5 flex items-center justify-center gap-4">
            <span className="text-[13px] text-white/40">
              Straff {Math.min(penalties.length + (phase === 'shooting' ? 1 : 0), TOTAL)} / {TOTAL}
            </span>
            <span className="text-hogalid-yellow font-display text-xl">⚽ {score}</span>
          </div>

          <div className="mb-[18px] flex justify-center gap-[5px]">
            {Array.from({ length: TOTAL }, (_, i) => {
              const p = penalties[i];
              const isActive = i === penalties.length && phase === 'shooting';
              return (
                <div
                  key={i}
                  className={cn(
                    'box-border h-[13px] w-[13px] rounded-full border-2 transition-colors',
                    isActive ? 'border-white/70' : 'border-transparent',
                    p ? (p.isGoal ? 'bg-hogalid-yellow' : 'bg-[#ef4444]') : 'bg-white/[0.12]',
                  )}
                />
              );
            })}
          </div>

          <div className="mb-3 flex justify-center">
            <GoalNet keeperSide={keeperDir} animate={phase === 'showing'} />
          </div>

          <div
            className={cn(
              'font-display mb-2.5 min-h-[42px] text-3xl transition-colors',
              isGoalResult ? 'text-hogalid-yellow' : 'text-[#ef4444]',
            )}
          >
            {phase === 'showing' ? resultMsg : ''}
          </div>

          {phase === 'shooting' && (
            <>
              <div className="mb-3.5 text-xs text-white/35">
                Välj riktning — piltangenterna fungerar också
              </div>
              <div className="flex justify-center gap-4">
                {(
                  [
                    ['left', '← Vänster'],
                    ['right', 'Höger →'],
                  ] as [Dir, string][]
                ).map(([dir, label]) => (
                  <button
                    key={dir}
                    onClick={() => shoot(dir)}
                    className="flex-1 rounded-2xl border-2 border-white/20 bg-white/[0.07] py-[18px] text-base font-bold text-white"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === 'showing' && !isLast && (
            <button
              onClick={next}
              className="rounded-[14px] border border-white/[0.18] bg-white/[0.07] px-9 py-[13px] text-[15px] text-white/75"
            >
              Nästa straff →
            </button>
          )}
          {phase === 'showing' && isLast && (
            <div className="text-[13px] text-white/35">Summerar...</div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="max-w-[320px] text-center">
          <div className="mb-3 text-6xl leading-none">{getResultEmoji(score)}</div>
          <div className="font-display mb-1.5 text-[34px] text-white">
            {score} / {TOTAL} mål!
          </div>
          <div className="mb-[22px] text-[15px] leading-relaxed text-white/60">
            {getResultText(score)}
          </div>
          <div className="mb-7 flex justify-center gap-[5px]">
            {penalties.map((p, i) => (
              <div
                key={i}
                className={cn(
                  'h-4 w-4 rounded-full',
                  p.isGoal ? 'bg-hogalid-yellow' : 'bg-[#ef4444]',
                )}
              />
            ))}
          </div>
          <button
            onClick={() => onClose(score)}
            className={cn(PRIMARY_BTN, 'px-12 py-4 text-[22px]')}
          >
            Stäng
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}
