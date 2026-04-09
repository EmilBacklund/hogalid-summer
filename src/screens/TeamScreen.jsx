import { useState, useEffect, useRef } from 'react';
import { COLORS, EXERCISES, TEAM_LEVELS } from '../constants';
import { apiGet, apiPost } from '../utils/api';
import {
  fetchAllUsersStale,
  fetchTeamPhotosStale,
  localToday,
  getWeekStart,
  computeStats,
  getTeamLevel,
  getNextTeamLevel,
  calcTeamProgress,
  getWeeklyChallenge,
  getWeeklyLevelInfo,
  WEEKLY_LEVEL_NAMES,
  computeWeeklyHistory,
  saveWeeklyResult,
  generateFeed,
} from '../utils';
import { Card, ProgressBar, Confetti } from '../components/common';
import { AvatarSVG } from '../components/avatar';
import { useUser } from '../context/UserContext';
import { ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import { PhotoAlbumModal } from './PhotoAlbumScreen';

export function TeamScreen() {
  const { user, setScreen, seasonStart, teamFeedOpen, setTeamFeedOpen, sendCheer } = useUser();
  const [allUsers, setAllUsers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamPhotos, setTeamPhotos] = useState([]);
  const [showAlbum, setShowAlbum] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [cheerSent, setCheerSent] = useState({});  // alias → 'sent' | 'already'
  const [showHistory, setShowHistory] = useState(false);
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [reactions, setReactions] = useState({});
  const [feedExpanded, setFeedExpanded] = useState(teamFeedOpen);
  const [feedPage, setFeedPage] = useState(0);
  const feedRef = useRef(null);

  useEffect(() => {
    if (teamFeedOpen) {
      setFeedExpanded(true);
      setTeamFeedOpen(false);
      setTimeout(() => feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, []);
  const FEED_PAGE_SIZE = 20;

  useEffect(() => {
    const stale = fetchAllUsersStale(fresh => {
      setAllUsers(fresh);
      setLoadingTeam(false);
    });
    if (stale && stale.length > 0) {
      setAllUsers(stale);
      setLoadingTeam(false);
    }
    apiGet('/users?action=reactions')
      .then(data => setReactions(data))
      .catch(() => {});

    const stalePhotos = fetchTeamPhotosStale((fresh) => {
      setTeamPhotos(fresh || []);
    });
    if (stalePhotos) {
      setTeamPhotos(stalePhotos);
    }
  }, []);

  async function toggleReaction(eventKey, emoji) {
    try {
      const current = reactions[eventKey] || {};
      const myEmoji = current[user.alias];
      const removing = myEmoji === emoji;
      // Optimistic update
      setReactions(prev => {
        const copy = { ...prev, [eventKey]: { ...(prev[eventKey] || {}) } };
        if (removing) delete copy[eventKey][user.alias];
        else copy[eventKey][user.alias] = emoji;
        return copy;
      });
      await apiPost('/users?action=react', { eventKey, alias: user.alias, emoji: removing ? null : emoji });
      const updated = await apiGet('/users?action=reactions');
      setReactions(updated);
    } catch (e) {
      alert('Kunde inte spara reaktion: ' + e.message);
    }
  }

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

  // Save previous week's result to DB in the background
  useEffect(() => {
    if (!loadingTeam && allUsers.length > 0 && seasonStart) {
      saveWeeklyResult(allUsers, seasonStart).catch(() => {});
    }
  }, [loadingTeam, seasonStart]);

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
  const latestPhotos = teamPhotos.slice(0, 3);

  // Next few team levels to show as "road ahead"
  const currentIdx = TEAM_LEVELS.findIndex((l) => l.name === teamLevel.name);
  const upcomingLevels = TEAM_LEVELS.slice(currentIdx + 1, currentIdx + 4);

  return (
    <div style={{ padding: '20px 16px', fontFamily: "'Nunito', sans-serif" }}>
      {showAlbum && (
        <PhotoAlbumModal
          initialPhotos={teamPhotos.length > 0 ? teamPhotos : null}
          onPhotosChange={setTeamPhotos}
          onClose={() => setShowAlbum(false)}
        />
      )}
      <Confetti active={showConfetti} />
      <button
        onClick={() => setScreen('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
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
        <ArrowLeft size={16} />
        Tillbaka
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

      <Card
        onClick={() => setShowAlbum(true)}
        style={{
          marginBottom: 16,
          padding: '16px 18px',
          background: 'linear-gradient(135deg, rgba(0,40,100,0.8) 0%, rgba(220,40,40,0.35) 100%)',
          border: '1px solid rgba(240,220,0,0.22)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.yellow,
              flexShrink: 0,
            }}
          >
            <Camera size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.1 }}>
              Veckans foto
            </div>
            <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 22, lineHeight: 1.1, marginTop: 4 }}>
              Lagets fotoalbum
            </div>
            <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, marginTop: 6 }}>
              {teamPhotos.length > 0
                ? `${teamPhotos.length} bilder uppladdade hittills. Tryck för att öppna albumet och bläddra bland sidorna.`
                : 'Här samlar ni träningsbilder, lagbilder och små sommarminnen tillsammans.'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
              {Array.from({ length: 3 }, (_, index) => {
                const photo = latestPhotos[index];
                const rotation = [-3, 2, -2][index];
                return (
                  <div
                    key={photo?.id || `placeholder-${index}`}
                    style={{
                      position: 'relative',
                      background: '#fffdf6',
                      borderRadius: 14,
                      padding: '6px 6px 8px',
                      minHeight: 100,
                      transform: `rotate(${rotation}deg)`,
                      boxShadow: '0 10px 20px rgba(0,0,0,0.18)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: -6,
                        left: '50%',
                        width: 40,
                        height: 14,
                        transform: `translateX(-50%) rotate(${rotation * -1.5}deg)`,
                        borderRadius: 6,
                        background: 'rgba(246, 228, 139, 0.7)',
                      }}
                    />
                    {photo ? (
                      <>
                        <img
                          src={photo.imageUrl || photo.imageData}
                          alt={`Foto av ${photo.uploaderName}`}
                          style={{
                            width: '100%',
                            display: 'block',
                            aspectRatio: '1 / 1',
                            objectFit: 'cover',
                            borderRadius: 10,
                          }}
                        />
                        <div style={{ color: COLORS.navy, fontSize: 10, fontWeight: 800, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {photo.uploaderName}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          aspectRatio: '1 / 1',
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, rgba(223,231,244,0.95), rgba(255,255,255,0.72))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'rgba(0,40,100,0.42)',
                          fontSize: 22,
                        }}
                      >
                        📷
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <ArrowRight size={18} style={{ color: COLORS.yellow, flexShrink: 0 }} />
        </div>
      </Card>

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
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <ArrowRight size={14} /> {nextTeamLevel.icon} {nextTeamLevel.name} (
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

      {/* Roster */}
      <Card style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowRoster(v => !v)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 700 }}>
            👥 Lagkompisar ({allUsers.length})
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, lineHeight: 1 }}>{showRoster ? '▲' : '▼'}</div>
        </button>
        {showRoster && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
            {allUsers.map(u => {
              const isMe = u.alias === user.alias;
              const cheerState = cheerSent[u.alias];
              return (
                <div key={u.alias} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '50%', padding: 4, border: isMe ? `2px solid ${COLORS.lime}` : '2px solid transparent' }}>
                    <AvatarSVG avatarConfig={u.avatarConfig} size={52} />
                  </div>
                  <div style={{ color: isMe ? COLORS.lime : '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{u.displayName || u.alias}</div>
                  {isMe ? (
                    <div style={{ color: COLORS.lime, fontSize: 10 }}>Du</div>
                  ) : (
                    <button
                      onClick={async () => {
                        if (cheerState) return;
                        const result = await sendCheer(u.alias);
                        if (result.ok) {
                          setCheerSent(prev => ({ ...prev, [u.alias]: 'sent' }));
                        } else if (result.error === 'already_today') {
                          setCheerSent(prev => ({ ...prev, [u.alias]: 'already' }));
                        }
                      }}
                      style={{
                        background: cheerState === 'sent' ? 'rgba(168,230,61,0.2)' : cheerState === 'already' ? 'rgba(255,255,255,0.06)' : 'rgba(255,200,0,0.15)',
                        border: cheerState === 'sent' ? `1px solid ${COLORS.lime}` : '1px solid rgba(255,200,0,0.3)',
                        borderRadius: 12,
                        padding: '3px 10px',
                        cursor: cheerState ? 'default' : 'pointer',
                        color: cheerState === 'sent' ? COLORS.lime : cheerState === 'already' ? 'rgba(255,255,255,0.4)' : COLORS.yellow,
                        fontSize: 11,
                        fontWeight: 700,
                        transition: 'all 0.2s',
                      }}
                    >
                      {cheerState === 'sent' ? '✅ Hejat!' : cheerState === 'already' ? 'Redan hejat' : '📣 Heja!'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Activity feed */}
      {(() => {
        const feed = generateFeed(allUsers, user.alias, seasonStart, teamPhotos);
        if (feed.length === 0) return null;
        const totalPages = Math.ceil(feed.length / FEED_PAGE_SIZE);
        const pageStart = feedPage * FEED_PAGE_SIZE;
        const paginated = feed.slice(pageStart, pageStart + FEED_PAGE_SIZE);

        function renderEvent(e, idx) {
          const isMaxLevel = e.type === 'weeklylevel' && e.text.includes('Nivå 10');
          const isTeamLevel = e.type === 'teamlevel';
          const isTeamEvent = e.type === 'weeklylevel' || e.type === 'weeklyend' || isTeamLevel;
          const eventKey = `${e.type}|${e.alias}|${e.date}|${e.icon}`;
          const eventReactions = reactions[eventKey] || {};
          const reactionCounts = {};
          Object.values(eventReactions).forEach(em => {
            reactionCounts[em] = (reactionCounts[em] || 0) + 1;
          });
          const myReaction = eventReactions[user.alias];
          const bg = isMaxLevel ? 'rgba(255,100,0,0.1)' : isTeamLevel ? 'rgba(139,92,246,0.1)' : isTeamEvent ? 'rgba(255,255,255,0.06)' : e.isMe ? 'rgba(240,220,0,0.08)' : 'rgba(255,255,255,0.04)';
          const border = isMaxLevel ? '2px solid #ff6a00' : isTeamLevel ? '1px solid rgba(139,92,246,0.5)' : isTeamEvent ? '1px solid rgba(255,255,255,0.12)' : e.isMe ? '1px solid rgba(240,220,0,0.25)' : '1px solid transparent';
          const aliasColor = isMaxLevel ? '#ff6a00' : isTeamLevel ? '#a78bfa' : isTeamEvent ? COLORS.lime : e.isMe ? COLORS.yellow : COLORS.lime;
          const textColor = isMaxLevel ? 'rgba(255,100,0,0.9)' : isTeamLevel ? 'rgba(167,139,250,0.9)' : e.isMe ? 'rgba(240,220,0,0.8)' : 'rgba(255,255,255,0.7)';
          return (
            <div key={idx} style={{
              background: bg,
              border,
              borderRadius: 12,
              padding: '8px 12px',
              animation: isMaxLevel ? 'fireGlow 1.5s ease-in-out infinite' : 'none',
              cursor: e.type === 'photo' ? 'pointer' : 'default',
            }}
            onClick={e.type === 'photo' ? () => setShowAlbum(true) : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{e.icon}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ color: aliasColor, fontWeight: 700, fontSize: 13 }}>
                    {e.alias}
                  </span>
                  <span style={{ color: textColor, fontSize: 13 }}>
                    {' '}{e.text}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, flexShrink: 0 }}>{e.date}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {['🔥', '👏', '⚽', '💪'].map(emoji => {
                  const count = reactionCounts[emoji] || 0;
                  const mine = myReaction === emoji;
                  return (
                    <button key={emoji} onClick={(evt) => { evt.stopPropagation(); toggleReaction(eventKey, emoji); }} style={{ background: mine ? 'rgba(240,220,0,0.2)' : 'rgba(255,255,255,0.07)', border: mine ? '1px solid rgba(240,220,0,0.4)' : '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '3px 9px', cursor: 'pointer', fontSize: 13, color: mine ? COLORS.yellow : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {emoji}{count > 0 && <span style={{ fontSize: 11 }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <>
          <div ref={feedRef} />
          <Card style={{ marginBottom: 16 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              📰 Lagflöde
            </div>
            {!feedExpanded ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {feed.slice(0, 3).map((e, idx) => renderEvent(e, idx))}
                </div>
                {feed.length > 3 && (
                  <button onClick={() => { setFeedExpanded(true); setFeedPage(0); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', marginTop: 10, width: '100%', textAlign: 'center' }}>
                    ▼ Visa alla {feed.length} händelser
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {paginated.map((e, idx) => renderEvent(e, pageStart + idx))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <button onClick={() => setFeedPage(v => v - 1)} disabled={feedPage === 0} style={{ background: 'none', border: 'none', color: feedPage === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', fontSize: 20, cursor: feedPage === 0 ? 'default' : 'pointer' }}>←</button>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Sida {feedPage + 1} av {totalPages}</span>
                  <button onClick={() => setFeedPage(v => v + 1)} disabled={feedPage >= totalPages - 1} style={{ background: 'none', border: 'none', color: feedPage >= totalPages - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', fontSize: 20, cursor: feedPage >= totalPages - 1 ? 'default' : 'pointer' }}>→</button>
                </div>
                <button onClick={() => setFeedExpanded(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', marginTop: 6, width: '100%', textAlign: 'center' }}>
                  ▲ Visa färre
                </button>
              </>
            )}
          </Card>
          </>
        );
      })()}

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
        {(() => {
          const visibleIndexes = showAllLevels
            ? WEEKLY_LEVEL_NAMES.map((_, i) => i)
            : WEEKLY_LEVEL_NAMES.map((_, i) => i).filter(i => {
                const isLastDone = i + 1 === levelInfo.level;
                const isCurrent = i + 1 === levelInfo.level + 1 && !levelInfo.isMaxLevel;
                return isLastDone || isCurrent || (levelInfo.isMaxLevel && i === 9);
              });
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {WEEKLY_LEVEL_NAMES.map((name, i) => {
                if (!visibleIndexes.includes(i)) return null;
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
              <button onClick={() => setShowAllLevels(v => !v)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', marginTop: 4, textAlign: 'center' }}>
                {showAllLevels ? '▲ Visa färre' : '▼ Visa alla 10 nivåer'}
              </button>
            </div>
          );
        })()}

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

      {/* Weekly history */}
      {(() => {
        const history = computeWeeklyHistory(allUsers, seasonStart);
        if (history.length === 0) return null;
        const last = history[0];
        return (
          <Card style={{ marginBottom: 16 }}>
            {/* Last week summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: history.length > 1 ? 12 : 0 }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Förra veckan</div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{last.challenge.label}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {last.levelInfo.level > 0 ? (
                  <>
                    <div style={{ fontSize: 18 }}>{last.levelInfo.isMaxLevel ? '🔥' : '✅'}</div>
                    <div style={{ color: last.levelInfo.isMaxLevel ? '#ff6a00' : COLORS.lime, fontWeight: 700, fontSize: 13 }}>
                      Nivå {last.levelInfo.level} — {last.levelInfo.levelName}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                      {last.value} {last.challenge.type === 'touch' ? 'touch' : 'min'}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 18 }}>❌</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 13 }}>Ej klar</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                      {last.value}/{last.challenge.goal} {last.challenge.type === 'touch' ? 'touch' : 'min'}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Expandable full history */}
            {history.length > 1 && (
              <>
                <button
                  onClick={() => setShowHistory(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, cursor: 'pointer' }}
                >
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }}>Alla veckor ({history.length})</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>{showHistory ? '▲' : '▼'}</div>
                </button>
                {showHistory && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {history.map(({ weekStart, challenge, value, levelInfo }) => (
                      <div key={weekStart} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px' }}>
                        <div style={{ fontSize: 18 }}>
                          {levelInfo.level > 0 ? (levelInfo.isMaxLevel ? '🔥' : '✅') : '❌'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{weekStart}</div>
                          <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{challenge.label}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {levelInfo.level > 0 ? (
                            <div style={{ color: levelInfo.isMaxLevel ? '#ff6a00' : COLORS.lime, fontSize: 12, fontWeight: 700 }}>
                              Nivå {levelInfo.level} — {levelInfo.levelName}
                            </div>
                          ) : (
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Ej klar</div>
                          )}
                          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                            {value} {challenge.type === 'touch' ? 'touch' : 'min'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Card>
        );
      })()}

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
