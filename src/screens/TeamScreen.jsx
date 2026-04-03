import { useState, useEffect } from 'react';
import { COLORS, EXERCISES, TEAM_LEVELS } from '../constants';
import {
  apiGet,
  localToday,
  getWeekStart,
  computeStats,
  getTeamLevel,
  getNextTeamLevel,
  calcTeamProgress,
  getWeeklyChallenge,
  getWeeklyLevelInfo,
  WEEKLY_LEVEL_NAMES,
} from '../utils';
import { Card, ProgressBar, Confetti } from '../components/common';
import { useUser } from '../context/UserContext';

export function TeamScreen() {
  const { user, setScreen, seasonStart } = useUser();
  const [allUsers, setAllUsers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    apiGet('/users')
      .then(setAllUsers)
      .catch(() => setAllUsers([]))
      .finally(() => setLoadingTeam(false));
  }, []);

  const allStats = allUsers.map((u) => {
    const s = computeStats(u);
    return { alias: u.alias, bingo: u.bingo || [], ...s };
  });
  const totalTeamMinutes = allStats.reduce((s, u) => s + u.totalMinutes, 0);
  const totalTeamTouch = allStats.reduce((s, u) => s + u.totalTouch, 0);
  const totalTeamLogs = allStats.reduce((s, u) => s + u.totalLogs, 0);
  const allBingoDone = new Set(allStats.flatMap((u) => u.bingo));
  const totalTeamBingo = allStats.reduce((s, u) => s + u.bingo.length, 0);
  const uniqueTeamBingo = allBingoDone.size;
  const totalTeamIceCream = allUsers.reduce(
    (s, u) => s + (u.logs || []).reduce((a, l) => a + (l.iceCream || 0), 0),
    0,
  );
  const totalTeamSwim = allUsers.reduce(
    (s, u) => s + (u.logs || []).reduce((a, l) => a + (l.swim || 0), 0),
    0,
  );
  const totalTeamPages = allUsers.reduce(
    (s, u) => s + (u.logs || []).reduce((a, l) => a + (l.pages || 0), 0),
    0,
  );
  const teamPoints = totalTeamTouch + totalTeamMinutes * 5;

  const allActiveDays = new Set(
    allUsers.flatMap((u) =>
      (u.logs || [])
        .filter((l) => {
          if (l.bingoFootball) return true;
          if (l.bingo) return false;
          const mins = (l.exercises || []).find((e) => e.id === 'fritraning')?.value || 0;
          const touch = (l.exercises || []).reduce((s, e) => {
            const ex = EXERCISES.find((x) => x.id === e.id);
            return s + (ex && !ex.isTime && e.id !== 'skott' ? e.value || 0 : 0);
          }, 0);
          return mins >= 5 || touch >= 30;
        })
        .map((l) => l.date)
        .filter(Boolean),
    ),
  );
  const sortedDays = [...allActiveDays].sort();
  let teamStreak = 0,
    teamCur = 0;
  const today = localToday();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      teamCur = 1;
    } else {
      const diff = (new Date(sortedDays[i]) - new Date(sortedDays[i - 1])) / 86400000;
      teamCur = diff === 1 ? teamCur + 1 : 1;
    }
  }
  if (sortedDays.length > 0) {
    const lastDay = sortedDays[sortedDays.length - 1];
    const diffToday = (new Date(today) - new Date(lastDay)) / 86400000;
    teamStreak = diffToday <= 1 ? teamCur : 0;
  }

  const teamLevel = getTeamLevel(teamPoints);
  const nextTeamLevel = getNextTeamLevel(teamPoints);
  const teamProgress = calcTeamProgress(teamPoints);

  // Weekly challenge stats
  const weekStart = getWeekStart(today);
  const weekly = getWeeklyChallenge(seasonStart);
  let weekTouch = 0,
    weekMinutes = 0;
  allUsers.forEach((u) => {
    (u.logs || []).forEach((l) => {
      if (!l.bingo && l.date >= weekStart && l.date <= today) {
        weekMinutes += l.minutes || 0;
        (l.exercises || []).forEach((e) => {
          const ex = EXERCISES.find((x) => x.id === e.id);
          if (ex && !ex.isTime && e.id !== 'skott') weekTouch += e.value || 0;
        });
      }
    });
  });
  const weekValue = weekly.type === 'touch' ? weekTouch : weekMinutes;
  const weekDone = weekValue >= weekly.goal;
  const levelInfo = getWeeklyLevelInfo(weekValue, weekly.goal);

  // Show confetti briefly on mount if we just leveled up (stored in sessionStorage)
  useEffect(() => {
    if (loadingTeam) return;
    const key = 'fball_last_team_level';
    const last = sessionStorage.getItem(key);
    if (last && last !== teamLevel.name) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    sessionStorage.setItem(key, teamLevel.name);
  }, [loadingTeam, teamLevel.name]);

  if (loadingTeam)
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
        Laddar lagets data...
      </div>
    );

  const myStats = allStats.find((u) => u.alias === user.alias);

  // Next few team levels to show as "road ahead"
  const currentIdx = TEAM_LEVELS.findIndex((l) => l.name === teamLevel.name);
  const upcomingLevels = TEAM_LEVELS.slice(currentIdx + 1, currentIdx + 4);

  return (
    <div style={{ padding: '20px 16px', fontFamily: "'Nunito', sans-serif" }}>
      <Confetti active={showConfetti} />
      <button
        onClick={() => setScreen('home')}
        style={{
          background: 'none',
          border: 'none',
          color: COLORS.lime,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 16,
          padding: 0,
        }}
      >
        ← Tillbaka
      </button>
      <div
        style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 26,
          color: '#fff',
          marginBottom: 4,
        }}
      >
        Högalid F15 💪
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
        Träna mer — klättra upp i nivåer!
      </div>

      {/* Current team level card */}
      <Card
        style={{
          marginBottom: 16,
          border: `2px solid ${teamLevel.color || COLORS.lime}`,
          background: 'rgba(0,40,100,0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{teamLevel.icon}</div>
          <div>
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Lagets nivå
            </div>
            <div
              style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 24,
                color: teamLevel.color || COLORS.lime,
                lineHeight: 1.1,
              }}
            >
              {teamLevel.name}
            </div>
          </div>
        </div>
        <ProgressBar value={teamProgress} color={teamLevel.color || COLORS.lime} height={14} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            {teamPoints.toLocaleString('sv')} poäng
          </span>
          {nextTeamLevel ? (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
              → {nextTeamLevel.icon} {nextTeamLevel.name} (
              {(nextTeamLevel.min - teamPoints).toLocaleString('sv')} kvar)
            </span>
          ) : (
            <span style={{ color: COLORS.accent, fontSize: 12 }}>🏆 Maxnivå!</span>
          )}
        </div>
      </Card>

      {/* Upcoming levels teaser */}
      {upcomingLevels.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Kommande nivåer
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {upcomingLevels.map((lvl, i) => (
              <div
                key={lvl.name}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  padding: '10px 8px',
                  textAlign: 'center',
                  opacity: 1 - i * 0.2,
                }}
              >
                <div style={{ fontSize: 22 }}>{lvl.icon}</div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 11,
                    marginTop: 3,
                    fontWeight: 600,
                  }}
                >
                  {lvl.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>
                  {lvl.min.toLocaleString('sv')} p
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team streak */}
      <Card style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>🔥</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Lagstreak
          </div>
          <div
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 32,
              color: COLORS.yellow,
              lineHeight: 1.1,
            }}
          >
            {teamStreak}{' '}
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>
              dag{teamStreak !== 1 ? 'ar' : ''} i rad
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 3 }}>
            {teamStreak === 0
              ? 'Ingen har loggat idag — håll strecket vid liv! 💪'
              : teamStreak === 1
                ? 'Bra start — kom tillbaka imorgon! 🌱'
                : teamStreak < 7
                  ? 'Bra jobbat laget — fortsätt! 🌟'
                  : teamStreak < 14
                    ? 'Över en vecka — ni är oslagbara! 🏆'
                    : 'Legendarisk streak — WOW! 👑'}
          </div>
        </div>
      </Card>

      {/* Weekly team challenge */}
      <style>{`
        @keyframes fireGlow {
          0%, 100% { box-shadow: 0 0 16px 4px #ff6a00, 0 0 32px 8px #ff4500; }
          50% { box-shadow: 0 0 28px 8px #ffae00, 0 0 48px 16px #ff6a00; }
        }
      `}</style>
      <div
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        🤝 Veckans lagutmaning
      </div>
      <Card
        style={{
          marginBottom: 16,
          border: levelInfo.isMaxLevel
            ? '2px solid #ff6a00'
            : weekDone
              ? `1.5px solid ${COLORS.lime}`
              : '1px solid rgba(255,255,255,0.15)',
          background: levelInfo.isMaxLevel
            ? 'rgba(255,100,0,0.1)'
            : weekDone
              ? 'rgba(168,230,61,0.08)'
              : 'rgba(255,255,255,0.06)',
          animation: levelInfo.isMaxLevel ? 'fireGlow 1.5s ease-in-out infinite' : 'none',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}>
            {levelInfo.isMaxLevel ? '🔥' : weekly.type === 'touch' ? '🦶' : '⏱'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
              {weekly.label}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
              Vecka från {weekStart}
            </div>
          </div>
          {levelInfo.level > 0 && (
            <div
              style={{
                background: levelInfo.isMaxLevel
                  ? 'linear-gradient(135deg, #ff6a00, #ffae00)'
                  : weekDone
                    ? 'rgba(168,230,61,0.2)'
                    : 'rgba(255,255,255,0.1)',
                border: `1px solid ${levelInfo.isMaxLevel ? '#ff6a00' : weekDone ? COLORS.lime : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 10,
                padding: '4px 10px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  color: levelInfo.isMaxLevel ? '#fff' : COLORS.lime,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Nivå {levelInfo.level}
              </div>
              <div
                style={{
                  color: levelInfo.isMaxLevel ? '#fff' : COLORS.lime,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {levelInfo.isMaxLevel ? '🔥 ' : ''}
                {levelInfo.levelName}
                {levelInfo.isMaxLevel ? ' 🔥' : ''}
              </div>
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
        <ProgressBar
          value={levelInfo.progress}
          color={levelInfo.isMaxLevel ? '#ff6a00' : weekDone ? COLORS.lime : COLORS.yellow}
          height={14}
        />

        {/* Progress text */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 14 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            {weekly.type === 'touch' ? `${weekValue} touch` : `${weekValue} min`}
          </span>
          <span style={{ color: levelInfo.isMaxLevel ? '#ff6a00' : weekDone ? COLORS.lime : COLORS.yellow, fontWeight: 700, fontSize: 13 }}>
            {levelInfo.isMaxLevel
              ? '🔥 Max uppnådd!'
              : levelInfo.level === 0
                ? `${weekly.goal - weekValue} kvar till Nivå 1`
                : `${levelInfo.nextThreshold - weekValue} kvar till ${levelInfo.nextLevelName}`}
          </span>
        </div>

        {/* Level list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {WEEKLY_LEVEL_NAMES.map((name, i) => {
            const threshold = levelInfo.thresholds[i];
            const done = i + 1 <= levelInfo.level;
            const isCurrent = i + 1 === levelInfo.level + 1 && !levelInfo.isMaxLevel;
            const isMax = i === 9;
            return (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 10px', borderRadius: 10,
                background: done ? 'rgba(168,230,61,0.08)' : isCurrent ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: done ? `1px solid ${isMax ? '#ff6a00' : COLORS.lime}44` : isCurrent ? '1px solid rgba(255,255,255,0.12)' : 'none',
                opacity: done || isCurrent ? 1 : 0.4,
              }}>
                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>
                  {done ? (isMax ? '🔥' : '✅') : isCurrent ? '🎯' : '○'}
                </span>
                <span style={{ flex: 1, color: done ? (isMax ? '#ff6a00' : COLORS.lime) : isCurrent ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: done || isCurrent ? 700 : 400 }}>
                  Nivå {i + 1} — {isMax ? '🔥 ' : ''}{name}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                  {threshold} {weekly.type === 'touch' ? 'touch' : 'min'}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 10, textAlign: 'center' }}>
          Träna och logga — det räknas automatiskt!
        </div>
      </Card>

      {/* Team stats */}
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Lagets totaler
        </div>
        {[
          { label: 'Antal spelare', val: allStats.length, icon: '👥' },
          { label: 'Inloggade träningar', val: totalTeamLogs, icon: '📅' },
          { label: 'Minuter tränat', val: totalTeamMinutes, icon: '⏱' },
          { label: 'Touch totalt', val: totalTeamTouch.toLocaleString('sv'), icon: '🦶' },
          {
            label: 'Bingo-uppdrag klarade',
            val: `${totalTeamBingo} (${uniqueTeamBingo} unika)`,
            icon: '🌞',
          },
          { label: 'Glassar totalt', val: totalTeamIceCream, icon: '🍦' },
          { label: 'Bad totalt', val: totalTeamSwim, icon: '🏊' },
          { label: 'Sidor lästa totalt', val: totalTeamPages.toLocaleString('sv'), icon: '📖' },
        ].map(({ label, val, icon }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              {icon} {label}
            </span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{val}</span>
          </div>
        ))}
      </Card>

      {/* My contribution */}
      {myStats && (
        <Card style={{ border: `1.5px solid ${COLORS.lime}` }}>
          <div style={{ color: COLORS.lime, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
            Mitt bidrag till laget
          </div>
          {[
            { label: 'Mina träningsminuter', val: myStats.totalMinutes, icon: '⏱' },
            { label: 'Mina touch', val: myStats.totalTouch, icon: '🦶' },
            { label: 'Mina pass', val: myStats.totalLogs, icon: '📅' },
            { label: 'Mina bingo-uppdrag', val: myStats.bingoCount || 0, icon: '🌞' },
          ].map(({ label, val, icon }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                {icon} {label}
              </span>
              <span style={{ color: COLORS.lime, fontWeight: 700, fontSize: 15 }}>{val}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
