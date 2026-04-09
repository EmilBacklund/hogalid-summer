import { useState, useEffect } from 'react';
import { COLORS } from '../../constants';
import { Card } from './Card';
import { useUser } from '../../context/UserContext';

const FALLBACK_DATE = "2026-08-17T00:00:00";

export function Countdown() {
  const { countdownDate } = useUser();
  const target = countdownDate ? new Date(countdownDate + "T00:00:00") : new Date(FALLBACK_DATE);

  function calc() {
    const diff = target - new Date();
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
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [countdownDate]);

  if (!t) return (
    <Card style={{ textAlign: "center", marginBottom: 16, background: "rgba(168,230,61,0.12)", border: `1.5px solid ${COLORS.lime}` }}>
      <div style={{ fontSize: 28 }}>🎉</div>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: COLORS.lime }}>Dags för träning igen!</div>
    </Card>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(240,220,0,0.07)", border: `1.5px solid rgba(240,220,0,0.3)`, borderRadius: 14, padding: "8px 14px", marginBottom: 14 }}>
      <span style={{ fontSize: 16 }}>⚽</span>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, flex: 1 }}>Första träningen</div>
      <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
        {[["days","d"],["hours","h"],["minutes","m"],["seconds","s"]].map(([key, lbl]) => (
          <span key={key}>
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 16, color: COLORS.accent }}>{String(t[key]).padStart(2, "0")}</span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{lbl} </span>
          </span>
        ))}
      </div>
    </div>
  );
}
