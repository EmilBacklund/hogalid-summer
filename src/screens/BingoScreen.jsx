import { useState, useMemo, useRef } from 'react';
import { COLORS, BINGO, BADGES } from '../constants';
import { localToday } from '../utils';
import { Card, ProgressBar, Confetti, ButtonLoader } from '../components/common';
import { useUser } from '../context/UserContext';
import { ArrowLeft } from 'lucide-react';

export function BingoScreen() {
  const { user, setScreen, handleBingoDone, handleSaveLog } = useUser();

  const done = user.bingo || [];
  const remaining = BINGO.filter(b => !done.includes(b.id));
  const [filter, setFilter] = useState("all"); // all | ⚽ | ☀️
  const [randomPick, setRandomPick] = useState(null);
  const [wheelNum, setWheelNum] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const spinTimerRef = useRef(null);
  const [justDone, setJustDone] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const footballCount = done.filter(id => BINGO.find(b => b.id === id)?.cat === "⚽").length;
  const summerCount   = done.filter(id => BINGO.find(b => b.id === id)?.cat === "☀️").length;
  const totalPoints   = done.reduce((s, id) => s + (BINGO.find(b => b.id === id)?.points || 0), 0);

  // Row/column completion (10 cols × 5 rows)
  const doneSet = new Set(done);
  const completedRows = [];
  const completedCols = [];
  for (let row = 0; row < 5; row++) {
    const allDone = Array.from({ length: 10 }, (_, col) => BINGO[row * 10 + col])
      .every(b => b && doneSet.has(b.id));
    if (allDone) completedRows.push(row);
  }
  for (let col = 0; col < 10; col++) {
    const allDone = Array.from({ length: 5 }, (_, row) => BINGO[row * 10 + col])
      .every(b => b && doneSet.has(b.id));
    if (allDone) completedCols.push(col);
  }
  const ROW_BONUS = 30;
  const COL_BONUS = 50;
  const lineBonus = completedRows.length * ROW_BONUS + completedCols.length * COL_BONUS;
  const completedRowSet = new Set(completedRows);
  const completedColSet = new Set(completedCols);

  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [busy, setBusy] = useState(false);

  function startSpin() {
    const pool = remaining.filter(b => filter === "all" || b.cat === filter);
    if (pool.length === 0 || spinning) return;

    const target = pool[Math.floor(Math.random() * pool.length)];
    const targetNum = BINGO.findIndex(b => b.id === target.id) + 1;

    setSpinning(true);
    setRandomPick(null);

    const totalSteps = 28;
    // Pre-calculate start so sequential scrolling naturally lands on targetNum
    const startNum = ((targetNum - totalSteps - 1) % 50 + 50) % 50 + 1;
    let current = startNum;
    let step = 0;

    function tick() {
      step++;
      current = (current % 50) + 1;
      setWheelNum(current);

      if (step < totalSteps) {
        const progress = step / totalSteps;
        const delay = 30 + progress * progress * 220;
        spinTimerRef.current = setTimeout(tick, delay);
      } else {
        setSpinning(false);
        spinTimerRef.current = setTimeout(() => setRandomPick(target), 500);
      }
    }

    spinTimerRef.current = setTimeout(tick, 50);
  }

  async function markDone(id) {
    if (busy) return;
    setBusy(true);
    const challenge = BINGO.find(b => b.id === id);
    await handleBingoDone(id, challenge?.points || 0);

    // Check if this completion fills a new row or column
    const newDone = new Set([...done, id]);
    const idx = BINGO.findIndex(b => b.id === id);
    let bonus = 0;
    const bonusLabels = [];
    if (idx >= 0) {
      const row = Math.floor(idx / 10);
      const col = idx % 10;
      const rowComplete = Array.from({ length: 10 }, (_, c) => BINGO[row * 10 + c])
        .every(b => b && newDone.has(b.id));
      const colComplete = Array.from({ length: 5 }, (_, r) => BINGO[r * 10 + col])
        .every(b => b && newDone.has(b.id));
      // Only award if not already completed before
      if (rowComplete && !completedRowSet.has(row)) { bonus += ROW_BONUS; bonusLabels.push(`Rad ${row + 1}`); }
      if (colComplete && !completedColSet.has(col)) { bonus += COL_BONUS; bonusLabels.push(`Kolumn ${col + 1}`); }
    }
    if (bonus > 0) {
      await handleSaveLog(
        { date: localToday(), exercises: [], points: bonus, minutes: 0, bingo: true, title: `🎯 Bingobonus: ${bonusLabels.join(' + ')}` },
        user.highscores || {},
      );
    }

    setJustDone(id);
    setRandomPick(null);
    setShowConfetti(true);
    setBusy(false);
    setTimeout(() => { setJustDone(null); setShowConfetti(false); }, 2500);
  }

  // Shuffle once per screen open — undone items random, done items at bottom
  const shuffledBingo = useMemo(() => {
    const undone = BINGO.filter(b => !done.includes(b.id));
    const doneItems = BINGO.filter(b => done.includes(b.id));
    for (let i = undone.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [undone[i], undone[j]] = [undone[j], undone[i]];
    }
    return [...undone, ...doneItems];
  }, []); // empty deps = only runs once on mount

  const displayList = shuffledBingo
    .filter(b => filter === "all" || b.cat === filter);

  return (
    <div style={{ padding: "20px 16px 32px", fontFamily: "'Nunito', sans-serif" }}>
      <Confetti active={showConfetti} />
      <button onClick={() => setScreen("home")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}><ArrowLeft size={16} />Tillbaka</button>

      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 2 }}>Sommarlovsbingo 🌞</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 18 }}>50 utmaningar — en hel sommar att klara dem!</div>

      {/* Progress summary */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: COLORS.lime }}>{done.length}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>av 50 klara</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#60a5fa" }}>{footballCount}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>⚽ idrott</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fbbf24" }}>{summerCount}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>☀️ sommar</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar value={Math.round((done.length / 50) * 100)} color={COLORS.lime} height={10} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 5 }}>
          +{totalPoints} poäng från bingo{lineBonus > 0 && <span style={{ color: COLORS.lime }}> + {lineBonus}p radbonus!</span>}
        </div>
      </Card>

      {/* Visual bingo grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: 3,
        marginBottom: 6,
        padding: '0 2px',
      }}>
        {BINGO.map((b, i) => {
          const isDone = done.includes(b.id);
          const isJust = justDone === b.id;
          const isFootball = b.cat === '⚽';
          const row = Math.floor(i / 10);
          const col = i % 10;
          const inCompletedLine = completedRowSet.has(row) || completedColSet.has(col);
          return (
            <div
              key={b.id}
              title={b.label}
              style={{
                aspectRatio: '1',
                borderRadius: 4,
                background: isDone
                  ? (isFootball ? COLORS.lime : '#fbbf24')
                  : 'rgba(255,255,255,0.06)',
                border: isDone
                  ? 'none'
                  : '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.3s',
                transform: isJust ? 'scale(1.3)' : 'scale(1)',
                boxShadow: isJust
                  ? `0 0 8px ${COLORS.lime}`
                  : inCompletedLine && isDone
                    ? '0 0 6px rgba(255,255,255,0.3)'
                    : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 7,
                color: isDone ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.15)',
                fontWeight: 700,
                opacity: inCompletedLine && isDone ? 1 : undefined,
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
      {/* Line bonus indicators */}
      {(completedRows.length > 0 || completedCols.length > 0) && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 10,
          justifyContent: 'center',
        }}>
          {completedRows.map(row => (
            <span key={`row-${row}`} style={{
              background: 'rgba(168,230,61,0.15)',
              border: `1px solid ${COLORS.lime}55`,
              borderRadius: 8,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.lime,
            }}>
              Rad {row + 1} ✓ +{ROW_BONUS}p
            </span>
          ))}
          {completedCols.map(col => (
            <span key={`col-${col}`} style={{
              background: 'rgba(251,191,36,0.15)',
              border: '1px solid rgba(251,191,36,0.4)',
              borderRadius: 8,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: '#fbbf24',
            }}>
              Kolumn {col + 1} ✓ +{COL_BONUS}p
            </span>
          ))}
        </div>
      )}

      {/* Bingo milestone badges */}
      {[5, 10, 20, 35, 50].map(milestone => {
        const reached = done.length >= milestone;
        const badge = BADGES.find(b => b.id === `bingo${milestone}`);
        return (
          <div key={milestone} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: reached ? "rgba(168,230,61,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${reached ? COLORS.lime : "rgba(255,255,255,0.1)"}`,
            borderRadius: 10, padding: "4px 10px", marginRight: 6, marginBottom: 12,
            opacity: reached ? 1 : 0.45,
          }}>
            <span style={{ fontSize: 14 }}>{badge?.icon}</span>
            <span style={{ color: reached ? COLORS.lime : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700 }}>{milestone} klara</span>
          </div>
        );
      })}

      {/* Slot machine wheel */}
      {(() => {
        const canSpin = !spinning && remaining.filter(b => filter === "all" || b.cat === filter).length > 0;
        const isYellow = wheelNum !== null && wheelNum % 2 === 1;
        const prevNum = wheelNum !== null ? ((wheelNum - 2 + 50) % 50) + 1 : null;
        const nextNum = wheelNum !== null ? (wheelNum % 50) + 1 : null;

        return (
          <div
            onClick={canSpin ? startSpin : undefined}
            style={{
              marginBottom: 14,
              borderRadius: 16,
              overflow: 'hidden',
              cursor: canSpin ? 'pointer' : 'default',
              position: 'relative',
              height: 126,
              boxShadow: spinning
                ? `0 0 32px ${isYellow ? COLORS.yellow : COLORS.red}88`
                : wheelNum !== null
                ? `0 0 20px ${isYellow ? COLORS.yellow : COLORS.red}55`
                : '0 4px 20px rgba(220,40,40,0.35)',
              transition: 'box-shadow 0.15s',
              userSelect: 'none',
            }}
          >
            {wheelNum === null ? (
              /* Idle state */
              <div style={{
                width: '100%', height: '100%',
                background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.navy})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 26 }}>🎰</span>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: '#fff', letterSpacing: 0.5 }}>
                  Slumpa ett uppdrag
                </span>
              </div>
            ) : (
              /* Spinning / result state */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Top cell — previous number, dimmed, half-visible */}
                <div style={{
                  height: 28,
                  background: prevNum % 2 === 1 ? COLORS.yellow : COLORS.red,
                  opacity: 0.22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <span style={{
                    fontFamily: "'Fredoka One', cursive",
                    fontSize: 20,
                    color: prevNum % 2 === 1 ? COLORS.dark : '#fff',
                  }}>{prevNum}</span>
                </div>

                {/* Center cell — current number */}
                <div style={{
                  height: 70,
                  background: isYellow ? COLORS.yellow : COLORS.red,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {/* Side gradient shadows for depth */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 8,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), transparent)',
                    pointerEvents: 'none',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.25), transparent)',
                    pointerEvents: 'none',
                  }} />
                  <span
                    key={wheelNum}
                    style={{
                      fontFamily: "'Fredoka One', cursive",
                      fontSize: 52,
                      lineHeight: 1,
                      color: isYellow ? COLORS.dark : '#fff',
                      animation: !spinning ? 'none' : undefined,
                    }}
                  >
                    {wheelNum}
                  </span>
                </div>

                {/* Bottom cell — next number, dimmed, half-visible */}
                <div style={{
                  height: 28,
                  background: nextNum % 2 === 1 ? COLORS.yellow : COLORS.red,
                  opacity: 0.22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <span style={{
                    fontFamily: "'Fredoka One', cursive",
                    fontSize: 20,
                    color: nextNum % 2 === 1 ? COLORS.dark : '#fff',
                  }}>{nextNum}</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Random pick card */}
      {randomPick && (
        <Card style={{ marginBottom: 16, border: `2px solid ${COLORS.red}`, background: "rgba(220,40,40,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ fontSize: 28 }}>{randomPick.cat}</div>
            <div style={{ background: COLORS.accent, color: COLORS.dark, borderRadius: 8, padding: "3px 10px", fontWeight: 700, fontSize: 13 }}>+{randomPick.points} p</div>
          </div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginBottom: 14, lineHeight: 1.3 }}>{randomPick.label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => markDone(randomPick.id)}
              disabled={busy}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                background: busy ? 'rgba(240,220,0,0.5)' : COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive",
                fontSize: 16, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, transition: 'all 0.2s' }}>
              {busy ? <><ButtonLoader color={COLORS.dark} /> Sparar...</> : '✅ Klart!'}
            </button>
            <button onClick={() => setRandomPick(null)}
              disabled={busy}
              style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" }}>
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["all", "Alla 50"], ["⚽", "Fotboll & idrott"], ["☀️", "Sommar"]].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, transition: "all 0.15s",
              background: filter === val ? COLORS.lime : "rgba(255,255,255,0.1)",
              color: filter === val ? COLORS.dark : "rgba(255,255,255,0.7)" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Challenge list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {displayList.map(challenge => {
          const isDone = done.includes(challenge.id);
          const isJust = justDone === challenge.id;
          return (
            <div key={challenge.id}>
              <div
                onClick={() => !isDone && setSelectedChallenge(selectedChallenge?.id === challenge.id ? null : challenge)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: isDone ? "rgba(168,230,61,0.1)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${isDone ? COLORS.lime + "55" : selectedChallenge?.id === challenge.id ? COLORS.lime : "rgba(255,255,255,0.08)"}`,
                  borderRadius: selectedChallenge?.id === challenge.id ? "14px 14px 0 0" : 14,
                  padding: "12px 14px",
                  cursor: isDone ? "default" : "pointer",
                  opacity: isDone ? 0.7 : 1,
                  transition: "all 0.2s",
                  transform: isJust ? "scale(1.02)" : "scale(1)",
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${isDone ? COLORS.lime : "rgba(255,255,255,0.2)"}`,
                  background: isDone ? COLORS.lime : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14,
                }}>
                  {isDone ? "✓" : challenge.cat}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: isDone ? "rgba(255,255,255,0.5)" : "#fff", fontSize: 14, fontWeight: 600, lineHeight: 1.3, textDecoration: isDone ? "line-through" : "none" }}>
                    {challenge.label}
                  </div>
                </div>
                <div style={{ color: isDone ? COLORS.lime : COLORS.accent, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {isDone ? "✅" : `+${challenge.points}p`}
                </div>
              </div>
              {selectedChallenge?.id === challenge.id && (
                <div style={{ background: "rgba(168,230,61,0.08)", border: `1px solid ${COLORS.lime}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { markDone(challenge.id).then(() => setSelectedChallenge(null)); }}
                      disabled={busy}
                      style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                        background: busy ? 'rgba(240,220,0,0.5)' : COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive",
                        fontSize: 16, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, transition: 'all 0.2s' }}>
                      {busy ? <><ButtonLoader color={COLORS.dark} /> Sparar...</> : '✅ Klart!'}
                    </button>
                    <button onClick={() => setSelectedChallenge(null)}
                      disabled={busy}
                      style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
                        background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" }}>
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
