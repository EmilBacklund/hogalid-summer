import { useState, useEffect } from 'react';
import { COLORS, EXERCISES, TEAM_LEVELS, AVATAR_CONFIGS } from '../constants';
import { apiGet, localToday, computeStats, getTeamLevel, getNextTeamLevel, calcTeamProgress } from '../utils';
import { Card, ProgressBar, Confetti } from '../components/common';
import { AvatarSVG } from '../components/avatar';
import { useUser } from '../context/UserContext';

export function TeamScreen() {
  const { user, setScreen } = useUser();
  const [allUsers, setAllUsers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    apiGet("/users").then(setAllUsers).catch(() => setAllUsers([])).finally(() => setLoadingTeam(false));
  }, []);

  const allStats = allUsers.map((u) => {
    const s = computeStats(u);
    return { alias: u.alias, bingo: u.bingo || [], ...s };
  });
  const totalTeamMinutes = allStats.reduce((s, u) => s + u.totalMinutes, 0);
  const totalTeamTouch  = allStats.reduce((s, u) => s + u.totalTouch, 0);
  const totalTeamLogs   = allStats.reduce((s, u) => s + u.totalLogs, 0);
  const allBingoDone = new Set(allStats.flatMap(u => u.bingo));
  const totalTeamBingo = allStats.reduce((s, u) => s + u.bingo.length, 0);
  const uniqueTeamBingo = allBingoDone.size;
  const teamPoints = totalTeamTouch + totalTeamMinutes * 5;

  const allActiveDays = new Set(
    allUsers.flatMap(u =>
      (u.logs || []).filter(l => {
        if (l.bingoFootball) return true;
        if (l.bingo) return false;
        const mins = (l.exercises || []).find(e => e.id === "fritraning")?.value || 0;
        const touch = (l.exercises || []).reduce((s, e) => {
          const ex = EXERCISES.find(x => x.id === e.id);
          return s + (ex && !ex.isTime && e.id !== "skott" ? (e.value || 0) : 0);
        }, 0);
        return mins >= 5 || touch >= 30;
      }).map(l => l.date).filter(Boolean)
    )
  );
  const sortedDays = [...allActiveDays].sort();
  let teamStreak = 0, teamCur = 0;
  const today = localToday();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { teamCur = 1; }
    else {
      const diff = (new Date(sortedDays[i]) - new Date(sortedDays[i-1])) / 86400000;
      teamCur = diff === 1 ? teamCur + 1 : 1;
    }
  }
  if (sortedDays.length > 0) {
    const lastDay = sortedDays[sortedDays.length - 1];
    const diffToday = (new Date(today) - new Date(lastDay)) / 86400000;
    teamStreak = diffToday <= 1 ? teamCur : 0;
  }

  if (loadingTeam) return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
      Laddar lagets data...
    </div>
  );

  const teamLevel     = getTeamLevel(teamPoints);
  const nextTeamLevel = getNextTeamLevel(teamPoints);
  const teamProgress  = calcTeamProgress(teamPoints);

  // Show confetti briefly on mount if we just leveled up (stored in sessionStorage)
  useEffect(() => {
    const key = "fball_last_team_level";
    const last = sessionStorage.getItem(key);
    if (last && last !== teamLevel.name) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    sessionStorage.setItem(key, teamLevel.name);
  }, [teamLevel.name]);

  const myStats = allStats.find(u => u.alias === user.alias);

  // Next few team levels to show as "road ahead"
  const currentIdx = TEAM_LEVELS.findIndex(l => l.name === teamLevel.name);
  const upcomingLevels = TEAM_LEVELS.slice(currentIdx + 1, currentIdx + 4);

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      <Confetti active={showConfetti} />
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 4 }}>Laget 💪</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>Träna mer — klättra upp i nivåer!</div>

      {/* Current team level card */}
      <Card style={{ marginBottom: 16, border: `2px solid ${teamLevel.color || COLORS.lime}`, background: "rgba(0,40,100,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{teamLevel.icon}</div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Lagets nivå</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: teamLevel.color || COLORS.lime, lineHeight: 1.1 }}>{teamLevel.name}</div>
          </div>
        </div>
        <ProgressBar value={teamProgress} color={teamLevel.color || COLORS.lime} height={14} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{teamPoints.toLocaleString("sv")} poäng</span>
          {nextTeamLevel
            ? <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>→ {nextTeamLevel.icon} {nextTeamLevel.name} ({(nextTeamLevel.min - teamPoints).toLocaleString("sv")} kvar)</span>
            : <span style={{ color: COLORS.accent, fontSize: 12 }}>🏆 Maxnivå!</span>
          }
        </div>
      </Card>

      {/* Team streak */}
      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>🔥</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Lagstreak</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 32, color: COLORS.yellow, lineHeight: 1.1 }}>
            {teamStreak} <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)" }}>dag{teamStreak !== 1 ? "ar" : ""} i rad</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>
            {teamStreak === 0
              ? "Ingen har loggat idag — håll strecket vid liv! 💪"
              : teamStreak === 1
              ? "Bra start — kom tillbaka imorgon! 🌱"
              : teamStreak < 7
              ? "Bra jobbat laget — fortsätt! 🌟"
              : teamStreak < 14
              ? "Över en vecka — ni är oslagbara! 🏆"
              : "Legendarisk streak — WOW! 👑"}
          </div>
        </div>
      </Card>

      {/* Upcoming levels teaser */}
      {upcomingLevels.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Kommande nivåer</div>
          <div style={{ display: "flex", gap: 8 }}>
            {upcomingLevels.map((lvl, i) => (
              <div key={lvl.name} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 8px", textAlign: "center", opacity: 1 - i * 0.2 }}>
                <div style={{ fontSize: 22 }}>{lvl.icon}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 3, fontWeight: 600 }}>{lvl.name}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>{lvl.min.toLocaleString("sv")} p</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team stats */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Lagets totaler</div>
        {[
          { label: "Antal spelare",          val: allStats.length,                       icon: "👥" },
          { label: "Inloggade träningar",     val: totalTeamLogs,                         icon: "📅" },
          { label: "Minuter tränat",          val: totalTeamMinutes,                      icon: "⏱" },
          { label: "Touch totalt",            val: totalTeamTouch.toLocaleString("sv"),   icon: "🦶" },
          { label: "Bingo-uppdrag klarade",  val: `${totalTeamBingo} (${uniqueTeamBingo} unika)`, icon: "🌞" },
        ].map(({ label, val, icon }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{icon} {label}</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{val}</span>
          </div>
        ))}
      </Card>

      {/* My contribution */}
      {myStats && (
        <Card style={{ border: `1.5px solid ${COLORS.lime}` }}>
          <div style={{ color: COLORS.lime, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Mitt bidrag till laget</div>
          {[
            { label: "Mina träningsminuter", val: myStats.totalMinutes,    icon: "⏱" },
            { label: "Mina touch",           val: myStats.totalTouch,      icon: "🦶" },
            { label: "Mina pass",            val: myStats.totalLogs,       icon: "📅" },
            { label: "Mina bingo-uppdrag",   val: myStats.bingoCount || 0, icon: "🌞" },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{icon} {label}</span>
              <span style={{ color: COLORS.lime, fontWeight: 700, fontSize: 15 }}>{val}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
