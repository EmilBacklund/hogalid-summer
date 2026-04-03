import { COLORS, BADGES, EXERCISES } from '../constants';
import { getLevel, getNextLevel, calcProgress, localToday, getWeekStart, getDailyChallenge, getWeeklyChallenge } from '../utils';
import { Card, ProgressBar, Countdown } from '../components/common';
import { AvatarSVG } from '../components/avatar';
import { useUser } from '../context/UserContext';

export function HomeScreen() {
  const { user, stats, setScreen } = useUser();

  const level = getLevel(stats.totalPoints);
  const nextLevel = getNextLevel(stats.totalPoints);
  const progress = calcProgress(stats.totalPoints);
  const earnedBadges = BADGES.filter((b) => b.condition(stats));

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <button onClick={() => setScreen("avatar")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
          <AvatarSVG avatarConfig={user.avatarConfig} size={56} />
        </button>
        <div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: "#fff", lineHeight: 1.1 }}>Hej, {user.alias}! 👋</div>
          <div style={{ color: COLORS.lime, fontSize: 14, fontWeight: 600 }}>{level.icon} {level.name}</div>
        </div>
      </div>

      {/* Countdown */}
      <Countdown />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: COLORS.yellow }}>{stats.streak}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>dagars streak</div>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>⭐</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: COLORS.accent }}>{stats.totalPoints}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>totala poäng</div>
        </Card>
      </div>

      {/* Level progress */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{level.icon} {level.name}</span>
          {nextLevel && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>→ {nextLevel.icon} {nextLevel.name}</span>}
        </div>
        <ProgressBar value={progress} color={COLORS.lime} height={12} />
        {nextLevel && (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 6 }}>
            {nextLevel.min - stats.totalPoints} poäng kvar
          </div>
        )}
      </Card>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Träningsmin", val: stats.totalMinutes, icon: "⏱" },
          { label: "Touch totalt", val: stats.totalTouch, icon: "🦶" },
          { label: "Längsta streak", val: stats.maxStreak, icon: "💪" },
        ].map(({ label, val, icon }) => (
          <Card key={label} style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: "#fff" }}>{val}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Mina badges</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {earnedBadges.map((b) => (
              <div key={b.id} style={{ background: "rgba(240,220,0,0.12)", border: `1px solid rgba(240,220,0,0.35)`, borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <span style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 600 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highscores */}
      {Object.keys(user.highscores || {}).length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🏆 Mina rekord</div>
          {Object.entries(user.highscores).map(([id, val]) => {
            const ex = EXERCISES.find((e) => e.id === id);
            return ex ? (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 4 }}>
                <span>{ex.label}</span><span style={{ color: COLORS.accent, fontWeight: 700 }}>{val} i rad</span>
              </div>
            ) : null;
          })}
        </Card>
      )}

      {/* Daily + Weekly challenges widget */}
      {(() => {
        const today = localToday();
        const daily = getDailyChallenge();
        const weekly = getWeeklyChallenge();
        const dailyDone = (user.completedDaily || {})[today] === daily.id;
        const weekStart = getWeekStart(today);
        const users = {};  // Weekly team data shown fully in ChallengesScreen
        let weekTouch = 0, weekMins = 0;
        Object.values(users).forEach(u => {
          (u.logs || []).forEach(l => {
            if (!l.bingo && l.date >= weekStart && l.date <= today) {
              weekMins += l.minutes || 0;
              (l.exercises || []).forEach(e => {
                const ex = EXERCISES.find(x => x.id === e.id);
                if (ex && !ex.isTime && e.id !== "skott") weekTouch += (e.value || 0);
              });
            }
          });
        });
        const weekVal = weekly.type === "touch" ? weekTouch : weekMins;
        const weekPct = Math.min(100, Math.round((weekVal / weekly.goal) * 100));
        const weekDone = weekPct >= 100;
        return (
          <Card style={{ marginBottom: 12, padding: "16px 16px 14px", cursor: "pointer" }} onClick={() => setScreen("challenges")}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>⚡ Utmaningar</div>
              <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 600 }}>Se alla →</div>
            </div>

            {/* Daily section */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: COLORS.yellow, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                📅 Dagens utmaning
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 20, lineHeight: 1.3 }}>{daily.icon}</span>
                <div style={{ flex: 1, color: dailyDone ? "rgba(255,255,255,0.4)" : "#fff", fontSize: 14, fontWeight: 600, lineHeight: 1.35, textDecoration: dailyDone ? "line-through" : "none" }}>
                  {daily.label}
                </div>
                <div style={{ color: dailyDone ? COLORS.lime : COLORS.yellow, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {dailyDone ? "✅" : `+${daily.points}p`}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }} />

            {/* Weekly section */}
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                🤝 Lagets veckoutmaning
              </div>
              <div style={{ color: weekDone ? COLORS.lime : "#fff", fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>
                {weekly.label} {weekDone ? "🎉" : ""}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={weekPct} color={weekDone ? COLORS.lime : COLORS.yellow} height={8} />
                </div>
                <span style={{ color: weekDone ? COLORS.lime : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, flexShrink: 0, minWidth: 36, textAlign: "right" }}>
                  {weekVal}/{weekly.goal}
                </span>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Action buttons */}
      <button onClick={() => setScreen("log")}
        style={{ width: "100%", padding: "18px 0", borderRadius: 18, border: "none", background: COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive", fontSize: 22, cursor: "pointer", marginBottom: 10, boxShadow: `0 6px 28px ${COLORS.lime}55`, letterSpacing: 0.5 }}>
        ⚽ Logga träning!
      </button>
      <button onClick={() => setScreen("bingo")}
        style={{ width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
          background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.navy})`,
          color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 19,
          cursor: "pointer", marginBottom: 10, boxShadow: `0 4px 20px rgba(220,40,40,0.35)`, letterSpacing: 0.5 }}>
        🌞 Sommarlovsbingo — {(user.bingo || []).length}/50 klara
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={() => setScreen("avatar")}
          style={{ padding: "14px 0", borderRadius: 14, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: "pointer" }}>
          👧 Min avatar
        </button>
        <button onClick={() => setScreen("team")}
          style={{ padding: "14px 0", borderRadius: 14, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: "pointer" }}>
          🤝 Laget
        </button>
        <button onClick={() => setScreen("history")}
          style={{ padding: "14px 0", borderRadius: 14, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: "pointer", gridColumn: "span 2" }}>
          📋 Mina träningar
        </button>
      </div>
    </div>
  );
}
