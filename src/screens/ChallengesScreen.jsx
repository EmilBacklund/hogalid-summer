import { useState, useEffect } from 'react';
import { COLORS, EXERCISES, DAILY_CHALLENGES } from '../constants';
import { apiGet, localToday, getWeekStart, getDailyChallenge, getWeeklyChallenge, getWeeklyLevelInfo, WEEKLY_LEVEL_NAMES } from '../utils';
import { Card, ProgressBar } from '../components/common';
import { useUser } from '../context/UserContext';

export function ChallengesScreen() {
  const { user, setScreen, handleCompleteDaily, seasonStart } = useUser();

  const today = localToday();
  const weekStart = getWeekStart(today);
  const daily = getDailyChallenge(seasonStart);
  const weekly = getWeeklyChallenge(seasonStart);

  const completedDaily = user.completedDaily || {};
  const dailyDoneToday = completedDaily[today] === daily.id;

  const [allUsers, setAllUsers] = useState([]);
  useEffect(() => {
    apiGet("/users").then(setAllUsers).catch(() => setAllUsers([]));
  }, []);

  let weekTouch = 0, weekMinutes = 0;
  allUsers.forEach(u => {
    (u.logs || []).forEach(l => {
      if (!l.bingo && l.date >= weekStart && l.date <= today) {
        weekMinutes += l.minutes || 0;
        (l.exercises || []).forEach(e => {
          const ex = EXERCISES.find(x => x.id === e.id);
          if (ex && !ex.isTime && e.id !== "skott") weekTouch += (e.value || 0);
        });
      }
    });
  });
  const weekValue = weekly.type === "touch" ? weekTouch : weekMinutes;
  const weekDone = weekValue >= weekly.goal;
  const levelInfo = getWeeklyLevelInfo(weekValue, weekly.goal);

  // History of completed daily challenges
  const dailyHistory = Object.entries(completedDaily)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)
    .map(([date, id]) => ({ date, challenge: DAILY_CHALLENGES.find(d => d.id === id) }))
    .filter(e => e.challenge);

  return (
    <div style={{ padding: "20px 16px 32px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 2 }}>Utmaningar ⚡</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>Dagens uppdrag + veckans lagutmaning</div>

      {/* Daily challenge */}
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>📅 Dagens uppdrag</div>
      <Card style={{ marginBottom: 20, border: dailyDoneToday ? `1.5px solid ${COLORS.lime}` : `1.5px solid rgba(240,220,0,0.3)`, background: dailyDoneToday ? "rgba(240,220,0,0.08)" : "rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 36, lineHeight: 1 }}>{daily.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: dailyDoneToday ? "rgba(255,255,255,0.5)" : "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.3, textDecoration: dailyDoneToday ? "line-through" : "none" }}>
              {daily.label}
            </div>
            <div style={{ color: COLORS.yellow, fontSize: 13, fontWeight: 700, marginTop: 3 }}>+{daily.points} poäng</div>
          </div>
        </div>
        {dailyDoneToday ? (
          <div style={{ background: "rgba(240,220,0,0.15)", borderRadius: 10, padding: "10px 14px", textAlign: "center", color: COLORS.yellow, fontWeight: 700, fontSize: 15 }}>
            ✅ Klarat idag!
          </div>
        ) : (
          <button onClick={() => handleCompleteDaily(daily.id, daily.points)}
            style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: COLORS.yellow, color: COLORS.dark, fontFamily: "'Fredoka One', cursive", fontSize: 18, cursor: "pointer" }}>
            ✅ Jag har gjort det!
          </button>
        )}
      </Card>

      {/* Weekly team challenge */}
      <style>{`
        @keyframes fireGlow {
          0%, 100% { box-shadow: 0 0 16px 4px #ff6a00, 0 0 32px 8px #ff4500; }
          50% { box-shadow: 0 0 28px 8px #ffae00, 0 0 48px 16px #ff6a00; }
        }
      `}</style>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🤝 Veckans lagutmaning</div>
      <Card style={{
        marginBottom: 20,
        border: levelInfo.isMaxLevel ? "2px solid #ff6a00" : weekDone ? `1.5px solid ${COLORS.lime}` : "1px solid rgba(255,255,255,0.15)",
        background: levelInfo.isMaxLevel ? "rgba(255,100,0,0.1)" : weekDone ? "rgba(168,230,61,0.08)" : "rgba(255,255,255,0.06)",
        animation: levelInfo.isMaxLevel ? "fireGlow 1.5s ease-in-out infinite" : "none",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}>{levelInfo.isMaxLevel ? "🔥" : weekly.type === "touch" ? "🦶" : "⏱"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{weekly.label}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>Vecka från {weekStart}</div>
          </div>
          {levelInfo.level > 0 && (
            <div style={{
              background: levelInfo.isMaxLevel ? "linear-gradient(135deg, #ff6a00, #ffae00)" : weekDone ? "rgba(168,230,61,0.2)" : "rgba(255,255,255,0.1)",
              border: `1px solid ${levelInfo.isMaxLevel ? "#ff6a00" : weekDone ? COLORS.lime : "rgba(255,255,255,0.2)"}`,
              borderRadius: 10, padding: "4px 10px", textAlign: "center",
            }}>
              <div style={{ color: levelInfo.isMaxLevel ? "#fff" : weekDone ? COLORS.lime : "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Nivå {levelInfo.level}</div>
              <div style={{ color: levelInfo.isMaxLevel ? "#fff" : weekDone ? COLORS.lime : "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 700 }}>{levelInfo.isMaxLevel ? "🔥 " : ""}{levelInfo.levelName}{levelInfo.isMaxLevel ? " 🔥" : ""}</div>
            </div>
          )}
        </div>

        {/* Grattis-banner */}
        {weekDone && (
          <div style={{ background: levelInfo.isMaxLevel ? "rgba(255,100,0,0.2)" : "rgba(168,230,61,0.15)", border: `1px solid ${levelInfo.isMaxLevel ? "#ff6a00" : COLORS.lime}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 2 }}>{levelInfo.isMaxLevel ? "🔥" : "🎉"}</div>
            <div style={{ color: levelInfo.isMaxLevel ? "#ff6a00" : COLORS.lime, fontWeight: 700, fontSize: 14 }}>
              {levelInfo.isMaxLevel ? "Ni har nått Gudarnas nivå!" : "Grattis! Ni har klarat veckans utmaning!"}
            </div>
            {!levelInfo.isMaxLevel && (
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 3 }}>
                Fortsätt träna för att klättra till nästa nivå 💪
              </div>
            )}
          </div>
        )}

        {/* Progress bar */}
        <ProgressBar value={levelInfo.progress} color={levelInfo.isMaxLevel ? "#ff6a00" : weekDone ? COLORS.lime : COLORS.yellow} height={14} />

        {/* Progress labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, marginBottom: 14 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            {weekly.type === "touch" ? `${weekValue} touch` : `${weekValue} min`}
          </span>
          <span style={{ color: levelInfo.isMaxLevel ? "#ff6a00" : weekDone ? COLORS.lime : COLORS.yellow, fontWeight: 700, fontSize: 13 }}>
            {levelInfo.isMaxLevel
              ? "🔥 Max uppnådd!"
              : levelInfo.level === 0
                ? `${weekly.goal - weekValue} kvar till Nivå 1`
                : `${levelInfo.nextThreshold - weekValue} kvar till ${levelInfo.nextLevelName}`}
          </span>
        </div>

        {/* Level list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {WEEKLY_LEVEL_NAMES.map((name, i) => {
            const threshold = levelInfo.thresholds[i];
            const done = i + 1 <= levelInfo.level;
            const isCurrent = i + 1 === levelInfo.level + 1 && !levelInfo.isMaxLevel;
            const isMax = i === 9;
            return (
              <div key={name} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "6px 10px", borderRadius: 10,
                background: done ? "rgba(168,230,61,0.08)" : isCurrent ? "rgba(255,255,255,0.06)" : "transparent",
                border: done ? `1px solid ${isMax ? "#ff6a00" : COLORS.lime}44` : isCurrent ? "1px solid rgba(255,255,255,0.12)" : "none",
                opacity: done || isCurrent ? 1 : 0.4,
              }}>
                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>
                  {done ? (isMax ? "🔥" : "✅") : isCurrent ? "🎯" : "○"}
                </span>
                <span style={{ flex: 1, color: done ? (isMax ? "#ff6a00" : COLORS.lime) : isCurrent ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: done || isCurrent ? 700 : 400 }}>
                  Nivå {i + 1} — {isMax ? "🔥 " : ""}{name}
                </span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                  {threshold} {weekly.type === "touch" ? "touch" : "min"}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 10, textAlign: "center" }}>
          Träna och logga — det räknas automatiskt!
        </div>
      </Card>

      {/* Daily history */}
      {dailyHistory.length > 0 && (
        <>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✨ Senaste klarade</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dailyHistory.map(({ date, challenge }) => (
              <div key={date} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ fontSize: 22 }}>{challenge.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, textDecoration: "line-through" }}>{challenge.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{date}</div>
                </div>
                <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 700 }}>+{challenge.points}p</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
