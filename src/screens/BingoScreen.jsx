import { useState, useMemo, useRef } from 'react';
import { COLORS, BINGO, ADULT_BINGO, BADGES } from '../constants';
import { localToday } from '../utils';
import { Card, ProgressBar, Confetti, ButtonLoader } from '../components/common';
import { useUser } from '../context/UserContext';
import { ArrowLeft } from 'lucide-react';

function getAdultBingoLines(doneIds = []) {
  const doneSet = new Set(doneIds);
  const rows = [];
  const cols = [];

  for (let row = 0; row < 4; row++) {
    const rowItems = ADULT_BINGO.slice(row * 4, row * 4 + 4);
    if (rowItems.every((item) => doneSet.has(item.id))) rows.push(row);
  }

  for (let col = 0; col < 4; col++) {
    const colItems = Array.from({ length: 4 }, (_, row) => ADULT_BINGO[row * 4 + col]);
    if (colItems.every((item) => item && doneSet.has(item.id))) cols.push(col);
  }

  return { rows, cols };
}

export function BingoScreen() {
  const { user, setScreen, handleBingoDone, handleSaveLog, handleAdultBingoDone, handleRecordSecretProgress } = useUser();

  const done = user.bingo || [];
  const adultDone = user.adultBingo || [];
  const adultDiscovered = !!user.secretFlags?.foundAdultBingo;
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
  const [selectedAdultChallenge, setSelectedAdultChallenge] = useState(null);
  const [busy, setBusy] = useState(false);
  const [adultBusy, setAdultBusy] = useState(false);
  const [showAdultIntro, setShowAdultIntro] = useState(false);
  const [showAdultBingo, setShowAdultBingo] = useState(false);
  const [adultJustDone, setAdultJustDone] = useState(null);
  const [sunTapCount, setSunTapCount] = useState(0);
  const adultLineState = getAdultBingoLines(adultDone);
  const adultHasBingo = adultLineState.rows.length > 0 || adultLineState.cols.length > 0;

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

  async function revealAdultBingo() {
    if (!adultDiscovered) {
      await handleRecordSecretProgress({ foundAdultBingo: true });
    }
    setShowAdultIntro(true);
  }

  async function handleSunTap() {
    const next = sunTapCount + 1;
    if (next < 5) {
      setSunTapCount(next);
      return;
    }

    setSunTapCount(0);
    if (adultDiscovered) {
      setShowAdultBingo(true);
      return;
    }
    await revealAdultBingo();
  }

  async function markAdultDone(id) {
    if (adultBusy) return;
    setAdultBusy(true);
    await handleAdultBingoDone(id);
    setAdultJustDone(id);
    setShowConfetti(true);
    setAdultBusy(false);
    setTimeout(() => {
      setAdultJustDone(null);
      setShowConfetti(false);
    }, 2200);
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff" }}>Sommarlovsbingo</div>
        <button
          onClick={handleSunTap}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 26,
            lineHeight: 1,
          }}
          aria-label="Solen"
          title={adultDiscovered ? 'Tryck fem gånger för att öppna Hemligt vuxenbingo' : undefined}
        >
          🌞
        </button>
      </div>
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

      {adultDiscovered && (
        <Card
          onClick={() => setShowAdultBingo(true)}
          style={{
            marginBottom: 16,
            padding: '16px 18px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(47,72,140,0.95) 60%, rgba(245,205,72,0.16) 100%)',
            border: '1px solid rgba(255,241,140,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                Hemligt hittat
              </div>
              <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 20, lineHeight: 1.15, marginBottom: 6 }}>
                Hemligt vuxenbingo
              </div>
              <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 1.35 }}>
                Nu är det de vuxnas tur. {adultDone.length}/16 rutor klara{adultHasBingo ? ' · bingo fixat!' : ''}
              </div>
            </div>
            <div
              style={{
                minWidth: 64,
                height: 64,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.yellow,
                fontFamily: "'Fredoka One', cursive",
                fontSize: 22,
              }}
            >
              {adultDone.length}/16
            </div>
          </div>
        </Card>
      )}

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
      {[10, 20, 35, 50].map(milestone => {
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

      {showAdultIntro && (
        <div
          onClick={() => setShowAdultIntro(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.76)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 24,
              padding: '22px 20px',
              background: 'linear-gradient(160deg, rgba(14,22,50,0.98) 0%, rgba(29,78,216,0.95) 58%, rgba(250,204,21,0.18) 100%)',
              border: '1px solid rgba(250,204,21,0.28)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🕵️</div>
            <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 28, lineHeight: 1.1, marginBottom: 10 }}>
              Du hittade Hemligt vuxenbingo!
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.5, marginBottom: 18 }}>
              Här finns roliga vuxenuppdrag för sommaren.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setShowAdultIntro(false);
                  setShowAdultBingo(true);
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px 16px',
                  background: COLORS.lime,
                  color: COLORS.dark,
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: 17,
                  cursor: 'pointer',
                }}
              >
                Öppna bingot
              </button>
              <button
                onClick={() => setShowAdultIntro(false)}
                style={{
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.75)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Inte nu
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdultBingo && (
        <div
          onClick={() => setShowAdultBingo(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 430,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 28,
              padding: selectedAdultChallenge && !adultDone.includes(selectedAdultChallenge.id)
                ? '20px 16px 110px'
                : '20px 16px 18px',
              background: 'linear-gradient(180deg, #f3ead6 0%, #f7f0dd 100%)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
              border: '6px solid rgba(255,255,255,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ color: '#48608d', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  Bonusbingo
                </div>
                <div style={{ color: '#1d3557', fontFamily: "'Fredoka One', cursive", fontSize: 28, lineHeight: 1.08 }}>
                  Hemligt vuxenbingo
                </div>
                <div style={{ color: 'rgba(29,53,87,0.72)', fontSize: 13, lineHeight: 1.4, marginTop: 6 }}>
                  16 rutor bara för kul. Perfekt för att sätta lite skojig press på de vuxna.
                </div>
              </div>
              <button
                onClick={() => setShowAdultBingo(false)}
                style={{
                  background: 'rgba(29,53,87,0.08)',
                  border: 'none',
                  color: '#1d3557',
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  fontSize: 20,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ color: '#1d3557', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                  {adultDone.length}/16 klara
                </div>
                <ProgressBar value={Math.round((adultDone.length / ADULT_BINGO.length) * 100)} color="#f4b400" height={10} />
              </div>
              <div style={{ color: adultHasBingo ? '#15803d' : '#1d3557', fontWeight: 800, fontSize: 12, textAlign: 'right' }}>
                {adultHasBingo ? 'Bingo fixat!' : 'Jaga en rad eller kolumn'}
              </div>
            </div>

            {(adultLineState.rows.length > 0 || adultLineState.cols.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {adultLineState.rows.map((row) => (
                  <span
                    key={`adult-row-${row}`}
                    style={{
                      background: 'rgba(34,197,94,0.12)',
                      color: '#166534',
                      borderRadius: 999,
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    Rad {row + 1} ✓
                  </span>
                ))}
                {adultLineState.cols.map((col) => (
                  <span
                    key={`adult-col-${col}`}
                    style={{
                      background: 'rgba(59,130,246,0.12)',
                      color: '#1d4ed8',
                      borderRadius: 999,
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    Kolumn {col + 1} ✓
                  </span>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
              {ADULT_BINGO.map((challenge, index) => {
                const isDone = adultDone.includes(challenge.id);
                const isSelected = selectedAdultChallenge?.id === challenge.id;
                const isJust = adultJustDone === challenge.id;
                return (
                  <button
                    key={challenge.id}
                    onClick={() => !isDone && setSelectedAdultChallenge(isSelected ? null : challenge)}
                    style={{
                      aspectRatio: '1 / 1.06',
                      borderRadius: 16,
                      border: `2px solid ${isDone ? 'rgba(34,197,94,0.35)' : isSelected ? 'rgba(59,130,246,0.35)' : 'rgba(29,53,87,0.08)'}`,
                      background: isDone ? 'linear-gradient(180deg, #fff4b5 0%, #ffe17d 100%)' : '#fffaf0',
                      boxShadow: isJust ? '0 0 0 3px rgba(244,180,0,0.28)' : '0 4px 14px rgba(29,53,87,0.08)',
                      padding: '8px 6px',
                      cursor: isDone ? 'default' : 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transform: isJust ? 'scale(1.04)' : 'rotate(0deg)',
                    }}
                  >
                    <div style={{ color: 'rgba(29,53,87,0.48)', fontSize: 10, fontWeight: 800 }}>
                      {index + 1}
                    </div>
                    <div style={{ color: '#1d3557', fontSize: 10.5, fontWeight: 800, lineHeight: 1.25 }}>
                      {challenge.label}
                    </div>
                    <div style={{ marginTop: 'auto', color: isDone ? '#15803d' : 'rgba(29,53,87,0.45)', fontSize: 11, fontWeight: 800 }}>
                      {isDone ? '✓ Klar' : 'Tryck'}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedAdultChallenge && !adultDone.includes(selectedAdultChallenge.id) && (
              <div
                style={{
                  position: 'sticky',
                  bottom: -2,
                  zIndex: 2,
                  background: 'rgba(255,255,255,0.96)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 18,
                  padding: '14px 14px 12px',
                  border: '1px solid rgba(29,53,87,0.08)',
                  boxShadow: '0 -8px 24px rgba(29,53,87,0.12)',
                  marginTop: 6,
                }}
              >
                <div style={{ color: '#1d3557', fontWeight: 900, fontSize: 14, lineHeight: 1.35, marginBottom: 10 }}>
                  {selectedAdultChallenge.label}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      markAdultDone(selectedAdultChallenge.id).then(() => setSelectedAdultChallenge(null));
                    }}
                    disabled={adultBusy}
                    style={{
                      flex: 1,
                      padding: '12px 0',
                      borderRadius: 12,
                      border: 'none',
                      background: adultBusy ? 'rgba(168,230,61,0.55)' : COLORS.lime,
                      color: COLORS.dark,
                      fontFamily: "'Fredoka One', cursive",
                      fontSize: 16,
                      cursor: adultBusy ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {adultBusy ? <><ButtonLoader color={COLORS.dark} /> Sparar...</> : '✅ Klar!'}
                  </button>
                  <button
                    onClick={() => setSelectedAdultChallenge(null)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(29,53,87,0.16)',
                      background: 'transparent',
                      color: 'rgba(29,53,87,0.7)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
