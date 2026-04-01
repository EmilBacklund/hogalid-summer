import { useState, useEffect } from 'react';
import { COLORS } from '../../constants';
import { Card } from './Card';

export function Countdown() {
  const TARGET = new Date("2026-08-17T00:00:00");

  function calc() {
    const diff = TARGET - new Date();
    if (diff <= 0) return null;
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }

  const [t, setT] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!t) return (
    <Card style={{ textAlign: "center", marginBottom: 16, background: "rgba(168,230,61,0.12)", border: `1.5px solid ${COLORS.lime}` }}>
      <div style={{ fontSize: 28 }}>🎉</div>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: COLORS.lime }}>Dags för träning igen!</div>
    </Card>
  );

  return (
    <Card style={{ marginBottom: 16, background: "rgba(240,220,0,0.07)", border: `1.5px solid rgba(240,220,0,0.4)` }}>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        ⚽ Första träningen efter sommarlovet
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
        {[["days","dagar"],["hours","tim"],["minutes","min"],["seconds","sek"]].map(([key, lbl]) => (
          <div key={key} style={{ textAlign: "center", background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 4px" }}>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: COLORS.accent, lineHeight: 1 }}>
              {String(t[key]).padStart(2, "0")}
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textAlign: "center", marginTop: 8 }}>17 augusti 🗓</div>
    </Card>
  );
}
