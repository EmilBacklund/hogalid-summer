import { useState, useEffect, useMemo } from 'react';
import { COLORS, EXERCISES } from '../constants';
import {
  getLevel,
  getNextLevel,
  calcProgress,
  localToday,
  getWeekStart,
  getDailyChallenge,
  getWeeklyChallenge,
  getWeeklyLevelInfo,
  fetchAllUsersStale,
  computeWeeklyHistory,
  generateFeed,
} from '../utils';
import { Card, ProgressBar, Countdown } from '../components/common';
import { AvatarSVG } from '../components/avatar';
import { useUser } from '../context/UserContext';
import { ArrowRight } from 'lucide-react';

export function HomeScreen() {
  const { user, stats, setScreen, seasonStart, setTeamFeedOpen, buddyChallenges, setChallengeScrollTarget } = useUser();

  function goTo(target) {
    setChallengeScrollTarget(target);
    setScreen('challenges');
  }
  const [allUsers, setAllUsers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [fireSeenThisWeek, setFireSeenThisWeek] = useState(() => {
    const weekKey = `fire_seen_${getWeekStart(localToday())}`;
    return !!localStorage.getItem(weekKey);
  });

  useEffect(() => {
    const stale = fetchAllUsersStale(fresh => {
      setAllUsers(fresh);
      setLoadingTeam(false);
    });
    if (stale && stale.length > 0) {
      setAllUsers(stale);
      setLoadingTeam(false);
    }
  }, []);

  const level = getLevel(stats.totalPoints);
  const nextLevel = getNextLevel(stats.totalPoints);
  const progress = calcProgress(stats.totalPoints);

  const feedItems = useMemo(() => {
    if (!allUsers.length) return [];
    return generateFeed(allUsers, user.alias, seasonStart).slice(0, 5);
  }, [allUsers, user.alias, seasonStart]);

  return (
    <div style={{ padding: '20px 16px', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @keyframes fireGlow {
          0%, 100% { box-shadow: 0 0 16px 4px #ff6a00, 0 0 32px 8px #ff4500; }
          50% { box-shadow: 0 0 28px 8px #ffae00, 0 0 48px 16px #ff6a00; }
        }
        @keyframes footballBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(180deg); }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <button
          onClick={() => setScreen('profile')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            lineHeight: 0,
          }}
        >
          <AvatarSVG avatarConfig={user.avatarConfig} size={56} />
        </button>
        <div>
          <div
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 24,
              color: '#fff',
              lineHeight: 1.1,
            }}
          >
            Hej, {user.alias}! 👋
          </div>
          <div style={{ color: COLORS.lime, fontSize: 14, fontWeight: 600 }}>
            {level.icon} {level.name}
          </div>
        </div>
      </div>

      {/* Countdown */}
      <Countdown />

      {/* Senaste nytt ticker */}
      {feedItems.length > 0 && (
        <button
          onClick={() => { setTeamFeedOpen(true); setScreen('team'); }}
          style={{
            display: 'block',
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '8px 0',
            marginBottom: 12,
            cursor: 'pointer',
            overflow: 'hidden',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{
              color: COLORS.lime,
              fontWeight: 700,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: '0 10px',
              flexShrink: 0,
              borderRight: '1px solid rgba(255,255,255,0.1)',
              marginRight: 8,
            }}>
              Nytt
            </span>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                display: 'inline-flex',
                whiteSpace: 'nowrap',
                animation: `ticker ${feedItems.length * 4}s linear infinite`,
              }}>
                {[...feedItems, ...feedItems].map((item, i) => (
                  <span key={i} style={{
                    color: item.isMe ? COLORS.yellow : 'rgba(255,255,255,0.65)',
                    fontSize: 12,
                    fontWeight: item.isMe ? 700 : 400,
                    marginRight: 32,
                  }}>
                    {item.icon} <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{item.alias}</span> {item.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Daily + Weekly challenges widget */}
      {(() => {
        const today = localToday();
        const daily = getDailyChallenge(seasonStart);
        const weekly = getWeeklyChallenge(seasonStart);
        const dailyDone = (user.completedDaily || {})[today] === daily.id;
        const weekStart = getWeekStart(today);
        let weekTouch = 0,
          weekMins = 0;
        if (!loadingTeam) {
          allUsers.forEach((u) => {
            (u.logs || []).forEach((l) => {
              if (!l.bingo && l.date >= weekStart && l.date <= today) {
                weekMins += l.minutes || 0;
                (l.exercises || []).forEach((e) => {
                  const ex = EXERCISES.find((x) => x.id === e.id);
                  if (ex && !ex.isTime && e.id !== 'skott') weekTouch += e.value || 0;
                });
              }
            });
          });
        }
        const weekVal = weekly.type === 'touch' ? weekTouch : weekMins;
        const weekDone = weekVal >= weekly.goal;
        const levelInfo = getWeeklyLevelInfo(weekVal, weekly.goal);

        // Mark fire as seen once — resets automatically each new week
        if (!loadingTeam && levelInfo.isMaxLevel && !fireSeenThisWeek) {
          const weekKey = `fire_seen_${getWeekStart(localToday())}`;
          localStorage.setItem(weekKey, '1');
          setFireSeenThisWeek(true);
        }
        const showFire = !loadingTeam && levelInfo.isMaxLevel && !fireSeenThisWeek;

        return (
          <Card
            style={{
              marginBottom: 12,
              padding: '16px 16px 14px',
            }}
          >
            {/* Header */}
            <div
              onClick={() => goTo(null)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
                cursor: 'pointer',
              }}
            >
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>⚡ Utmaningar</div>
              <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>Se alla <ArrowRight size={13} /></div>
            </div>

            {/* Daily section */}
            <div onClick={() => goTo('daily')} style={{ marginBottom: 12, cursor: 'pointer' }}>
              <div
                style={{
                  color: COLORS.yellow,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                📅 Dagens utmaning
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 20, lineHeight: 1.3 }}>{daily.icon}</span>
                <div
                  style={{
                    flex: 1,
                    color: dailyDone ? 'rgba(255,255,255,0.4)' : '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    textDecoration: dailyDone ? 'line-through' : 'none',
                  }}
                >
                  {daily.label}
                </div>
                <div
                  style={{
                    color: dailyDone ? COLORS.lime : COLORS.yellow,
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {dailyDone ? '✅' : `+${daily.points}p`}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 12 }} />

            {/* Weekly section */}
            <div
              onClick={() => goTo('weekly')}
              style={{
                cursor: 'pointer',
                borderRadius: 12,
                border: !loadingTeam && levelInfo.isMaxLevel ? '2px solid #ff6a00' : undefined,
                background: !loadingTeam && levelInfo.isMaxLevel ? 'rgba(255,100,0,0.08)' : undefined,
                animation: showFire ? 'fireGlow 1.5s ease-in-out infinite' : undefined,
                padding: !loadingTeam && levelInfo.isMaxLevel ? '10px 10px 6px' : undefined,
                margin: !loadingTeam && levelInfo.isMaxLevel ? '0 -2px' : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  🤝 Lagets veckoutmaning
                </div>
                {!loadingTeam && levelInfo.level > 0 && (
                  <div
                    style={{
                      color: levelInfo.isMaxLevel ? '#ff6a00' : COLORS.lime,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {levelInfo.isMaxLevel ? '🔥 ' : ''}
                    {levelInfo.levelName}
                  </div>
                )}
              </div>
              {loadingTeam ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px' }}>
                  {[0, 0.1, 0.2, 0.3, 0.4].map((delay, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 22,
                        lineHeight: 1,
                        animation: `footballBounce 0.8s ease-in-out ${delay}s infinite`,
                      }}
                    >
                      ⚽
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div
                    style={{
                      color: levelInfo.isMaxLevel ? '#ff6a00' : weekDone ? COLORS.lime : '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}
                  >
                    {weekly.label} {levelInfo.isMaxLevel ? '🔥' : weekDone ? '🎉' : ''}
                  </div>
                  <ProgressBar
                    value={levelInfo.progress}
                    color={
                      levelInfo.isMaxLevel ? '#ff6a00' : weekDone ? COLORS.lime : COLORS.yellow
                    }
                    height={8}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      {weekly.type === 'touch' ? `${weekVal} touch` : `${weekVal} min`}
                    </span>
                    <span
                      style={{
                        color: levelInfo.isMaxLevel
                          ? '#ff6a00'
                          : weekDone
                            ? COLORS.lime
                            : COLORS.yellow,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {levelInfo.isMaxLevel
                        ? '🔥 Max!'
                        : levelInfo.level === 0
                          ? `${weekly.goal - weekVal} kvar till Nivå 1`
                          : `${levelInfo.nextThreshold - weekVal} kvar till ${levelInfo.nextLevelName}`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>
        );
      })()}
      {/* Buddy challenges widget */}
      {(() => {
        const incoming = buddyChallenges.filter(c => c.toAlias === user.alias && c.status === 'pending');
        const active = buddyChallenges.filter(c =>
          (c.fromAlias === user.alias || c.toAlias === user.alias) && c.status === 'active');
        const urgent = active.filter(c => {
          if (!c.acceptedAt) return false;
          const ms = new Date(c.acceptedAt).getTime() + 48 * 3_600_000 - Date.now();
          return ms > 0 && ms < 8 * 3_600_000;
        });
        if (incoming.length === 0 && active.length === 0) return null;
        return (
          <button
            onClick={() => goTo('buddy')}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'rgba(255,255,255,0.06)',
              border: incoming.length > 0 ? `1.5px solid ${COLORS.yellow}88` : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, padding: '12px 14px', cursor: 'pointer', marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: incoming.length > 0 || urgent.length > 0 ? 8 : 0 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>🤝 Kompisutmaningar</span>
              <span style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                Se alla <ArrowRight size={13} />
              </span>
            </div>
            {incoming.length > 0 && (
              <div style={{
                background: `${COLORS.yellow}20`, borderRadius: 10, padding: '8px 11px',
                marginBottom: urgent.length > 0 ? 6 : 0,
              }}>
                <span style={{ color: COLORS.yellow, fontWeight: 700, fontSize: 13 }}>
                  📥 {incoming.length} inkommande utmaning{incoming.length > 1 ? 'ar' : ''} väntar på svar!
                </span>
              </div>
            )}
            {urgent.map(c => {
              const ms = new Date(c.acceptedAt).getTime() + 48 * 3_600_000 - Date.now();
              const h = Math.floor(ms / 3_600_000);
              const m = Math.floor((ms % 3_600_000) / 60_000);
              const partner = c.fromAlias === user.alias ? c.toAlias : c.fromAlias;
              return (
                <div key={c.id} style={{
                  background: 'rgba(220,40,40,0.15)', borderRadius: 10, padding: '8px 11px', marginBottom: 4,
                }}>
                  <span style={{ color: COLORS.red, fontWeight: 700, fontSize: 13 }}>
                    ⏰ Du & {partner} — {h}h {m}m kvar!
                  </span>
                </div>
              );
            })}
            {active.length > 0 && urgent.length === 0 && incoming.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                {active.length} aktiv{active.length > 1 ? 'a' : ''} utmaning{active.length > 1 ? 'ar' : ''} pågår
              </div>
            )}
          </button>
        );
      })()}

      {/* Last week's result */}
      {!loadingTeam &&
        (() => {
          const history = computeWeeklyHistory(allUsers, seasonStart);
          if (history.length === 0) return null;
          const last = history[0];
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 18 }}>
                {last.levelInfo.level > 0 ? (last.levelInfo.isMaxLevel ? '🔥' : '✅') : '❌'}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Förra veckan
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                  {last.challenge.label}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {last.levelInfo.level > 0 ? (
                  <div
                    style={{
                      color: last.levelInfo.isMaxLevel ? '#ff6a00' : COLORS.lime,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    Nivå {last.levelInfo.level} — {last.levelInfo.levelName}
                  </div>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 13 }}>
                    Ej klar
                  </div>
                )}
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                  {last.value} {last.challenge.type === 'touch' ? 'touch' : 'min'}
                </div>
              </div>
            </div>
          );
        })()}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Card style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: COLORS.yellow }}>
            {stats.streak}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>dagars streak</div>
        </Card>
        <Card style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32 }}>⭐</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: COLORS.accent }}>
            {stats.totalPoints}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>totala poäng</div>
        </Card>
      </div>

      {/* Level progress */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
            {level.icon} {level.name}
          </span>
          {nextLevel && (
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <ArrowRight size={14} /> {nextLevel.icon} {nextLevel.name}
            </span>
          )}
        </div>
        <ProgressBar value={progress} color={COLORS.lime} height={12} />
        {nextLevel && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>
            {nextLevel.min - stats.totalPoints} poäng kvar
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <button
        onClick={() => setScreen('log')}
        style={{
          width: '100%',
          padding: '18px 0',
          borderRadius: 18,
          border: 'none',
          background: COLORS.lime,
          color: COLORS.dark,
          fontFamily: "'Fredoka One', cursive",
          fontSize: 22,
          cursor: 'pointer',
          marginBottom: 10,
          boxShadow: `0 6px 28px ${COLORS.lime}55`,
          letterSpacing: 0.5,
        }}
      >
        📕 Dagbok
      </button>
      <button
        onClick={() => setScreen('bingo')}
        style={{
          width: '100%',
          padding: '15px 0',
          borderRadius: 16,
          border: 'none',
          background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.navy})`,
          color: '#fff',
          fontFamily: "'Fredoka One', cursive",
          fontSize: 19,
          cursor: 'pointer',
          marginBottom: 10,
          boxShadow: `0 4px 20px rgba(220,40,40,0.35)`,
          letterSpacing: 0.5,
        }}
      >
        🌞 Sommarlovsbingo — {(user.bingo || []).length}/50 klara
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setScreen('profile')}
          style={{
            padding: '14px 0',
            borderRadius: 14,
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontFamily: "'Fredoka One', cursive",
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          👧 Min profil
        </button>
        <button
          onClick={() => setScreen('team')}
          style={{
            padding: '14px 0',
            borderRadius: 14,
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: '#fff',
            fontFamily: "'Fredoka One', cursive",
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          🤝 Högalid F15
        </button>
      </div>
    </div>
  );
}
