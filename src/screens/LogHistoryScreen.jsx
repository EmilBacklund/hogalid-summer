import { useState } from 'react';
import { COLORS, EXERCISES } from '../constants';
import { Card } from '../components/common';
import { useUser } from '../context/UserContext';

export function LogHistoryScreen() {
  const { user, setScreen, handleUpdateLog } = useUser();

  const logs = (user.logs || [])
    .map((l, i) => ({ ...l, _idx: i }))
    .filter(l => !l.bingo)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const [editing, setEditing] = useState(null); // { _idx, date, exercises[] }
  const [confirmDelete, setConfirmDelete] = useState(null);

  function startEdit(log) {
    const exState = EXERCISES.map(ex => {
      const found = (log.exercises || []).find(e => e.id === ex.id);
      return { id: ex.id, value: found ? String(found.value) : "", highscore: "" };
    });
    setEditing({ id: log.id, date: log.date, exercises: exState });
  }

  function setVal(id, val) {
    setEditing(prev => ({ ...prev, exercises: prev.exercises.map(e => e.id === id ? { ...e, value: val } : e) }));
  }

  function saveEdit() {
    const filled = editing.exercises.filter(e => e.value !== "" && Number(e.value) > 0);
    const freeEx = editing.exercises.find(e => e.id === "fritraning");
    const totalMins = freeEx?.value ? Number(freeEx.value) : 0;
    const totalTouch = filled.reduce((s, e) => {
      const ex = EXERCISES.find(x => x.id === e.id);
      return s + (ex?.isTime || e.id === "skott" ? 0 : Number(e.value));
    }, 0);
    const points = totalTouch + totalMins * 5;
    const updated = { date: editing.date, exercises: filled.map(e => ({ id: e.id, value: Number(e.value) })), points, minutes: totalMins };
    handleUpdateLog("edit", editing.id, updated);
    setEditing(null);
  }

  function deleteLog(idx) {
    handleUpdateLog("delete", idx, null);
    setConfirmDelete(null);
  }

  if (editing) return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Avbryt</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: "#fff", marginBottom: 4 }}>Redigera träning</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 18 }}>{editing.date}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {EXERCISES.map(ex => {
          const val = editing.exercises.find(e => e.id === ex.id);
          return (
            <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", borderLeft: `3px solid ${ex.color}` }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, flex: 1 }}>{ex.label}</div>
              <input type="number" min="0" placeholder={`0 ${ex.unit}`} value={val?.value || ""}
                onChange={e => setVal(ex.id, e.target.value)}
                style={{ width: 80, padding: "7px 10px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontFamily: "'Nunito', sans-serif", textAlign: "right" }} />
            </div>
          );
        })}
      </div>
      <button onClick={saveEdit}
        style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive", fontSize: 19, cursor: "pointer" }}>
        💾 Spara ändringar
      </button>
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 32px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 4 }}>Mina träningar</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>{logs.length} pass loggade</div>

      {logs.length === 0 && (
        <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 }}>Inga träningar loggade än!</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {logs.map(log => {
          const totalMins = (log.exercises || []).find(e => e.id === "fritraning")?.value || 0;
          const totalTouch = (log.exercises || []).reduce((s, e) => {
            const ex = EXERCISES.find(x => x.id === e.id);
            return s + (ex && !ex.isTime && e.id !== "skott" ? (e.value || 0) : 0);
          }, 0);
          const isConfirming = confirmDelete === log._idx;
          return (
            <Card key={log._idx} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>📅 {log.date}</div>
                <div style={{ color: COLORS.yellow, fontWeight: 700, fontSize: 13 }}>+{log.points || 0} p</div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 10 }}>
                {totalMins > 0 && <span>⏱ {totalMins} min  </span>}
                {totalTouch > 0 && <span>🦶 {totalTouch} touch  </span>}
                {(log.exercises || []).filter(e => e.id === "skott" && e.value > 0).map(e =>
                  <span key="skott">🥅 {e.value} skott</span>
                )}
              </div>
              {isConfirming ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => deleteLog(log._idx)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: COLORS.red, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    🗑 Ja, ta bort
                  </button>
                  <button onClick={() => setConfirmDelete(null)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" }}>
                    Avbryt
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(log)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    ✏️ Redigera
                  </button>
                  <button onClick={() => setConfirmDelete(log._idx)}
                    style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(220,40,40,0.4)", background: "transparent", color: COLORS.red, fontSize: 14, cursor: "pointer" }}>
                    🗑
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
