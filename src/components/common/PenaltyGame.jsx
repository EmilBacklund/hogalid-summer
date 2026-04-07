import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { COLORS } from '../../constants';
import { localToday } from '../../utils/date';

const LS_PREFIX = 'penalty_played_';
const TOTAL = 10;

function lsKey(alias) {
  return `${LS_PREFIX}${alias}_${localToday()}`;
}

export function hasPenaltyPlayedToday(alias) {
  return !!localStorage.getItem(lsKey(alias));
}

export function resetPenaltyToday(alias) {
  localStorage.removeItem(lsKey(alias));
}

function markPlayed(alias) {
  localStorage.setItem(lsKey(alias), '1');
}

function getResultText(score) {
  if (score === 10) return 'Perfekt! Du är en straffspecialist! 🌟';
  if (score >= 8) return 'Superbt! Nästan perfekt! 🎯';
  if (score >= 6) return 'Bra jobbat! Solid insats! 👏';
  if (score >= 4) return 'Halvtid! Fortsätt träna! 💪';
  if (score >= 2) return 'Hoppsan! Målvakten var het idag... 🧤';
  return '😅 Riktigt tufft. Träna på skotten imorgon!';
}

function getResultEmoji(score) {
  if (score === 10) return '🏆';
  if (score >= 8) return '🥇';
  if (score >= 6) return '⚽';
  if (score >= 4) return '💪';
  return '🧤';
}

function GoalNet({ keeperSide, animate }) {
  // Keeper starts centered at x=90, translates ±70 to reach post areas
  const tx = keeperSide === 'left' ? -70 : keeperSide === 'right' ? 70 : 0;
  return (
    <svg
      width="220"
      height="130"
      viewBox="0 0 220 130"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Field */}
      <rect x="0" y="112" width="220" height="18" fill="#1d5e1d" />
      <rect x="0" y="112" width="220" height="3" fill="#2a7a2a" />

      {/* Net background */}
      <rect x="10" y="20" width="200" height="93" fill="rgba(255,255,255,0.03)" />

      {/* Net lines horizontal */}
      {[33, 46, 59, 72, 85, 98].map(y => (
        <line key={y} x1="10" y1={y} x2="210" y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}
      {/* Net lines vertical */}
      {[28, 46, 64, 82, 100, 118, 136, 154, 172, 192].map(x => (
        <line key={x} x1={x} y1="20" x2={x} y2="113" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}

      {/* Posts */}
      <rect x="7" y="16" width="6" height="98" rx="3" fill="#e8e8e8" />
      <rect x="207" y="16" width="6" height="98" rx="3" fill="#e8e8e8" />
      {/* Crossbar */}
      <rect x="7" y="16" width="206" height="6" rx="3" fill="#e8e8e8" />

      {/* Keeper group — animated translation */}
      <g
        style={{
          transform: `translateX(${tx}px)`,
          transition: animate ? 'transform 0.22s ease-out' : 'none',
        }}
      >
        {/* Jersey */}
        <rect x="90" y="68" width="40" height="44" rx="8" fill="#dc2626" />
        {/* Head */}
        <circle cx="110" cy="56" r="14" fill="#fcd34d" />
        {/* Eyes */}
        <circle cx="105" cy="53" r="2.5" fill="#1e293b" />
        <circle cx="115" cy="53" r="2.5" fill="#1e293b" />
        {/* Smile */}
        <path d="M104 61 Q110 66 116 61" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Gloves */}
        <ellipse cx="79" cy="88" rx="10" ry="8" fill="#fcd34d" />
        <ellipse cx="141" cy="88" rx="10" ry="8" fill="#fcd34d" />
        {/* Shorts */}
        <rect x="90" y="100" width="18" height="12" rx="4" fill="#1e293b" />
        <rect x="112" y="100" width="18" height="12" rx="4" fill="#1e293b" />
      </g>
    </svg>
  );
}

export function PenaltyGame({ onClose, alias }) {
  const [phase, setPhase] = useState('intro'); // intro | shooting | showing | done
  const [alreadyPlayed, setAlreadyPlayed] = useState(() => hasPenaltyPlayedToday(alias));
  const [penalties, setPenalties] = useState([]);
  const [score, setScore] = useState(0);
  const [keeperDir, setKeeperDir] = useState(null);
  const [resultMsg, setResultMsg] = useState('');
  const [isGoalResult, setIsGoalResult] = useState(false);

  const shoot = useCallback(
    dir => {
      if (phase !== 'shooting') return;
      const kDir = Math.random() < 0.5 ? 'left' : 'right';
      const goal = dir !== kDir;

      setKeeperDir(kDir);
      setResultMsg(goal ? '⚽ MÅL!' : '🧤 Räddad!');
      setIsGoalResult(goal);

      const newPenalties = [...penalties, { playerDir: dir, keeperDir: kDir, isGoal: goal }];
      const newScore = score + (goal ? 1 : 0);
      setPenalties(newPenalties);
      setScore(newScore);
      setPhase('showing');

      if (newPenalties.length >= TOTAL) {
        setTimeout(() => setPhase('done'), 2200);
      }
    },
    [phase, penalties, score],
  );

  // Keyboard support
  useEffect(() => {
    if (phase !== 'shooting') return;
    function onKey(e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); shoot('left'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); shoot('right'); }
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', sans-serif",
        padding: '24px 20px',
      }}
    >
      {/* ─── INTRO ─── */}
      {phase === 'intro' && (
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>🎯</div>
          <div
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 28,
              color: '#fff',
              marginBottom: 8,
            }}
          >
            Hemlig penaltyround!
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 14,
              lineHeight: 1.5,
              marginBottom: 8,
            }}
          >
            37 skott? Nu är det dags att omsätta dem på pliktpunkten...
          </div>
          <div
            style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 32 }}
          >
            10 straffar · vänster eller höger · en gång om dagen
          </div>
          {alreadyPlayed ? (
            <>
              <div style={{ color: '#fbbf24', fontSize: 14, marginBottom: 16 }}>
                Du har redan spelat idag 🏅
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => { resetPenaltyToday(alias); setAlreadyPlayed(false); }}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    padding: '12px 24px',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 14,
                    cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  Spela igen (test)
                </button>
                <button
                  onClick={onClose}
                  style={{
                    background: COLORS.lime,
                    color: COLORS.dark,
                    border: 'none',
                    borderRadius: 12,
                    padding: '12px 24px',
                    fontFamily: "'Fredoka One', cursive",
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  Stäng
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={start}
              style={{
                background: COLORS.lime,
                color: COLORS.dark,
                border: 'none',
                borderRadius: 16,
                padding: '16px 48px',
                fontFamily: "'Fredoka One', cursive",
                fontSize: 22,
                cursor: 'pointer',
                boxShadow: `0 4px 20px ${COLORS.lime}55`,
              }}
            >
              Starta! ⚽
            </button>
          )}
        </div>
      )}

      {/* ─── SHOOTING / SHOWING ─── */}
      {(phase === 'shooting' || phase === 'showing') && (
        <div style={{ textAlign: 'center', width: '100%', maxWidth: 340 }}>
          {/* Counter + score */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 10,
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Straff {Math.min(penalties.length + (phase === 'shooting' ? 1 : 0), TOTAL)} / {TOTAL}
            </span>
            <span
              style={{
                color: COLORS.lime,
                fontFamily: "'Fredoka One', cursive",
                fontSize: 20,
              }}
            >
              ⚽ {score}
            </span>
          </div>

          {/* Progress dots */}
          <div
            style={{
              display: 'flex',
              gap: 5,
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            {Array.from({ length: TOTAL }, (_, i) => {
              const p = penalties[i];
              const isActive = i === penalties.length && phase === 'shooting';
              return (
                <div
                  key={i}
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: '50%',
                    background: p
                      ? p.isGoal
                        ? COLORS.lime
                        : '#ef4444'
                      : 'rgba(255,255,255,0.12)',
                    border: isActive
                      ? '2px solid rgba(255,255,255,0.7)'
                      : '2px solid transparent',
                    boxSizing: 'border-box',
                    transition: 'background 0.3s',
                  }}
                />
              );
            })}
          </div>

          {/* Goal graphic */}
          <div
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}
          >
            <GoalNet keeperSide={keeperDir} animate={phase === 'showing'} />
          </div>

          {/* Result message */}
          <div
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 30,
              color: isGoalResult ? COLORS.lime : '#ef4444',
              minHeight: 42,
              marginBottom: 10,
              transition: 'color 0.2s',
            }}
          >
            {phase === 'showing' ? resultMsg : ''}
          </div>

          {/* Shoot buttons */}
          {phase === 'shooting' && (
            <>
              <div
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                Välj riktning — piltangenterna fungerar också
              </div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                {[
                  ['left', '← Vänster'],
                  ['right', 'Höger →'],
                ].map(([dir, label]) => (
                  <button
                    key={dir}
                    onClick={() => shoot(dir)}
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '2px solid rgba(255,255,255,0.22)',
                      borderRadius: 16,
                      padding: '18px 0',
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer',
                      flex: 1,
                      fontFamily: "'Nunito', sans-serif",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Next penalty button */}
          {phase === 'showing' && !isLast && (
            <button
              onClick={next}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 14,
                padding: '13px 36px',
                color: 'rgba(255,255,255,0.75)',
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              Nästa straff →
            </button>
          )}

          {phase === 'showing' && isLast && (
            <div
              style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}
            >
              Summerar...
            </div>
          )}
        </div>
      )}

      {/* ─── DONE ─── */}
      {phase === 'done' && (
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1 }}>
            {getResultEmoji(score)}
          </div>
          <div
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 34,
              color: '#fff',
              marginBottom: 6,
            }}
          >
            {score} / {TOTAL} mål!
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 15,
              lineHeight: 1.5,
              marginBottom: 22,
            }}
          >
            {getResultText(score)}
          </div>
          {/* Dot summary */}
          <div
            style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 28 }}
          >
            {penalties.map((p, i) => (
              <div
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: p.isGoal ? COLORS.lime : '#ef4444',
                }}
              />
            ))}
          </div>
          <button
            onClick={() => onClose(score)}
            style={{
              background: COLORS.lime,
              color: COLORS.dark,
              border: 'none',
              borderRadius: 16,
              padding: '16px 48px',
              fontFamily: "'Fredoka One', cursive",
              fontSize: 22,
              cursor: 'pointer',
              boxShadow: `0 4px 20px ${COLORS.lime}55`,
            }}
          >
            Stäng
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}
