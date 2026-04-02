import { useState, useEffect } from 'react';
import { COLORS, EXERCISES, DAILY_CHALLENGES } from '../constants';
import { apiGet, localToday, getWeekStart, getDailyChallenge, getWeeklyChallenge } from '../utils';
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
  const weekProgress = Math.min(100, Math.round((weekValue / weekly.goal) * 100));
  const weekDone = weekValue >= weekly.goal;

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
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🤝 Veckans lagutmaning</div>
      <Card style={{ marginBottom: 20, border: weekDone ? `1.5px solid ${COLORS.lime}` : "1px solid rgba(255,255,255,0.15)", background: weekDone ? "rgba(240,220,0,0.08)" : "rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}>{weekly.type === "touch" ? "🦶" : "⏱"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{weekly.label}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>Vecka från {weekStart}</div>
          </div>
        </div>
        <ProgressBar value={weekProgress} color={weekDone ? COLORS.lime : COLORS.yellow} height={14} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            {weekly.type === "touch" ? `${weekTouch} touch` : `${weekMinutes} min`}
          </span>
          <span style={{ color: weekDone ? COLORS.lime : COLORS.yellow, fontWeight: 700, fontSize: 13 }}>
            {weekDone ? "🎉 Klart!" : `${weekly.goal - weekValue} kvar`}
          </span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 6, textAlign: "center" }}>
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
