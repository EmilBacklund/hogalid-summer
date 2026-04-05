import { useState, useMemo } from 'react';
import { COLORS, BINGO, BADGES } from '../constants';
import { Card, ProgressBar, Confetti, ButtonLoader } from '../components/common';
import { useUser } from '../context/UserContext';
import { ArrowLeft } from 'lucide-react';

export function BingoScreen() {
  const { user, setScreen, handleBingoDone } = useUser();

  const done = user.bingo || [];
  const remaining = BINGO.filter(b => !done.includes(b.id));
  const [filter, setFilter] = useState("all"); // all | ⚽ | ☀️
  const [randomPick, setRandomPick] = useState(null);
  const [justDone, setJustDone] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const footballCount = done.filter(id => BINGO.find(b => b.id === id)?.cat === "⚽").length;
  const summerCount   = done.filter(id => BINGO.find(b => b.id === id)?.cat === "☀️").length;
  const totalPoints   = done.reduce((s, id) => s + (BINGO.find(b => b.id === id)?.points || 0), 0);

  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [busy, setBusy] = useState(false);

  function pickRandom() {
    const pool = remaining.filter(b => filter === "all" || b.cat === filter);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setRandomPick(pick);
  }

  async function markDone(id) {
    if (busy) return;
    setBusy(true);
    const challenge = BINGO.find(b => b.id === id);
    await handleBingoDone(id, challenge?.points || 0);
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
          +{totalPoints} poäng tjänade från bingo
        </div>
      </Card>

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

      {/* Random pick button */}
      <button onClick={pickRandom}
        style={{ width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
          background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.navy})`,
          color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 19,
          cursor: remaining.filter(b => filter === "all" || b.cat === filter).length === 0 ? "not-allowed" : "pointer",
          marginBottom: 14, boxShadow: `0 4px 20px rgba(220,40,40,0.4)`, letterSpacing: 0.5 }}>
        🎲 Slumpa ett uppdrag!
      </button>

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
