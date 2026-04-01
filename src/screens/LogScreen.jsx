import { useState } from 'react';
import { COLORS, EXERCISES } from '../constants';
import { localToday } from '../utils';
import { Card } from '../components/common';
import { useUser } from '../context/UserContext';

export function LogScreen() {
  const { user, setScreen, handleSaveLog } = useUser();

  const [date, setDate] = useState(localToday());
  const [exercises, setExercises] = useState(
    EXERCISES.map((e) => ({ id: e.id, value: "", highscore: "" }))
  );
  const [saved, setSaved] = useState(false);
  const [tooLittle, setTooLittle] = useState(false);

  function setVal(id, field, val) {
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, [field]: val } : e));
  }

  function handleSave() {
    const filled = exercises.filter((e) => e.value !== "" && Number(e.value) > 0);
    if (filled.length === 0) return;
    const freeEx = exercises.find(e => e.id === "fritraning");
    const totalMins = freeEx && freeEx.value !== "" ? Number(freeEx.value) : 0;
    const totalTouch = filled.reduce((s, e) => {
      const ex = EXERCISES.find((x) => x.id === e.id);
      return s + (ex?.isTime || e.id === "skott" ? 0 : Number(e.value));
    }, 0);

    // Minimum threshold: 5 min OR 30 touch to count as a real session
    const meetsThreshold = totalMins >= 5 || totalTouch >= 30;
    if (!meetsThreshold) {
      setTooLittle(true);
      setTimeout(() => setTooLittle(false), 3000);
      return;
    }
    const points = totalTouch + totalMins * 5;

    // update highscores
    const newHighscores = { ...user.highscores };
    exercises.forEach((e) => {
      if (e.highscore && Number(e.highscore) > 0) {
        if (!newHighscores[e.id] || Number(e.highscore) > newHighscores[e.id]) {
          newHighscores[e.id] = Number(e.highscore);
        }
      }
    });

    const log = { date, exercises: filled.map(e => ({ id: e.id, value: Number(e.value) })), points, minutes: totalMins };
    handleSaveLog(log, newHighscores);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 4 }}>Logga träning</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>Fyll i vad du tränat på!</div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>Datum</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ display: "block", marginTop: 5, padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontFamily: "'Nunito', sans-serif", width: "100%" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {EXERCISES.map((ex) => {
          const val = exercises.find((e) => e.id === ex.id);
          return (
            <Card key={ex.id} style={{ borderLeft: `4px solid ${ex.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: ex.color }} />
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{ex.label}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="number" min="0" placeholder={`Antal ${ex.unit}`} value={val?.value || ""}
                  onChange={(e) => setVal(ex.id, "value", e.target.value)}
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontFamily: "'Nunito', sans-serif" }} />
                {ex.hasHighscore && (
                  <input type="number" min="0" placeholder="🏆 Rekord" value={val?.highscore || ""}
                    onChange={(e) => setVal(ex.id, "highscore", e.target.value)}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${COLORS.accent}55`, background: "rgba(255,218,61,0.06)", color: "#fff", fontSize: 14, fontFamily: "'Nunito', sans-serif" }} />
                )}
              </div>
              {ex.hasHighscore && (
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 5 }}>
                  Rekord = flest i rad utan att tappa bollen
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {tooLittle && (
        <div style={{ background: "rgba(220,40,40,0.15)", border: `1px solid ${COLORS.red}`, borderRadius: 12, padding: "12px 16px", marginTop: 16, color: COLORS.red, fontWeight: 600, fontSize: 14 }}>
          ⚠️ Minst 5 minuter eller 30 touch krävs för att träningen ska räknas!
        </div>
      )}
      <button onClick={handleSave}
        style={{ width: "100%", marginTop: 24, padding: "16px 0", borderRadius: 16, border: "none",
          background: saved ? COLORS.grassLight : COLORS.lime, color: COLORS.dark,
          fontFamily: "'Fredoka One', cursive", fontSize: 20, cursor: "pointer",
          boxShadow: `0 4px 24px ${COLORS.lime}55`, transition: "all 0.3s" }}>
        {saved ? "✅ Sparat!" : "Spara träning →"}
      </button>
    </div>
  );
}
