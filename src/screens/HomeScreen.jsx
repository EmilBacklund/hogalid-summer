import { useState, useEffect, useMemo } from 'react';
import { COLORS, EXERCISES, PLAYER_CARDS, LEGEND_CARDS, TOTAL_PLAYER_CARDS, TOTAL_LEGEND_CARDS, CARD_PACK_COST, LEGEND_PACK_COST } from '../constants';
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
  fetchTeamPhotosStale,
  computeWeeklyHistory,
  generateFeed,
} from '../utils';
import { Card, ProgressBar, Countdown } from '../components/common';
import { AvatarSVG } from '../components/avatar';
import { useUser } from '../context/UserContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const INTRO_PAGES = [
  {
    eyebrow: 'Välkommen',
    icon: '⚽',
    title: 'Din sommarutmaning börjar nu',
    body:
      'Här kan du träna, samla poäng och låsa upp nya grejer. Är du redo?',
  },
  {
    eyebrow: 'Dagboken',
    icon: '📕',
    title: 'Logga det du tränar',
    body:
      'I Dagboken fyller du i touch, skott, jonglering eller fri träning. Allt du gör räknas.',
  },
  {
    eyebrow: 'Poäng',
    icon: '⭐',
    title: 'Poäng visar hur mycket du kämpar',
    body:
      'När du tränar och loggar får du poäng. Ju fler poäng du samlar, desto längre kommer du.',
  },
  {
    eyebrow: 'Streak',
    icon: '🔥',
    title: 'Träna flera dagar i rad',
    body:
      'När du tränar flera dagar i rad bygger du en streak. Ju längre streak, desto snyggare jobbat.',
  },
  {
    eyebrow: 'Utmaningar',
    icon: '⚡',
    title: 'Det finns alltid något nytt att klara',
    body:
      'Testa dagsutmaningar, lagutmaningar och roliga extrauppdrag. Vissa är snabba, andra riktigt kluriga.',
  },
  {
    eyebrow: 'Kompisutmaningar',
    icon: '🤝',
    title: 'Utmana en lagkompis',
    body:
      'Klara uppdraget tillsammans och visa vad ni kan. Två är starkare än en, och det ger dubbla poäng!',
  },
  {
    eyebrow: 'Bingo',
    icon: '🌞',
    title: 'Kryssa rutor i bingot',
    body:
      'I Bingo väntar massor av roliga uppdrag. Försök fylla hela brickan och se hur många rutor du kan ta.',
  },
  {
    eyebrow: 'Din profil',
    icon: '👧',
    title: 'Gör din figur unik',
    body:
      'I Din profil kan du bygga din egen avatar. När du spelar och tränar kan du låsa upp fler saker.',
  },
  {
    eyebrow: 'Nu kör vi',
    icon: '🚀',
    title: 'Allt du gör räknas',
    body:
      'Börja i Dagboken, testa en Utmaning eller kolla Bingo. Let’s go! Ha en riktigt härlig fotbollssommar!',
  },
];

const STREAK_DAY_LABELS = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];

function addDaysStr(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function getQualifyingFootballDays(logs) {
  return [
    ...new Set(
      logs
        .filter((l) => {
          if (l.bingoFootball) return true;
          if (l.bingo) return false;
          const mins = (l.exercises || []).find((e) => e.id === 'fritraning')?.value || 0;
          const touch = (l.exercises || []).reduce((sum, e) => {
            const ex = EXERCISES.find((x) => x.id === e.id);
            return sum + (ex && !ex.isTime && e.id !== 'skott' ? e.value || 0 : 0);
          }, 0);
          return mins >= 5 || touch >= 30;
        })
        .map((l) => l.date),
    ),
  ].sort();
}

function IntroModal({ pageIndex, onNext, onPrev, onClose }) {
  const page = INTRO_PAGES[pageIndex];
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === INTRO_PAGES.length - 1;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0, 0, 0, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 380,
          borderRadius: 24,
          border: `2px solid ${COLORS.lime}55`,
          background: `linear-gradient(160deg, rgba(0,20,64,0.98) 0%, rgba(0,40,100,0.96) 58%, rgba(220,40,40,0.88) 100%)`,
          boxShadow: `0 18px 70px rgba(0,0,0,0.45)`,
          padding: '22px 20px 18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div
              style={{
                color: COLORS.lime,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 1.1,
                marginBottom: 6,
              }}
            >
              {page.eyebrow}
            </div>
            <div
              style={{
                color: '#fff',
                fontFamily: "'Fredoka One', cursive",
                fontSize: 28,
                lineHeight: 1.1,
                maxWidth: 240,
              }}
            >
              {page.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'rgba(255,255,255,0.78)',
              width: 34,
              height: 34,
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 88,
            height: 88,
            borderRadius: 24,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.16)',
            fontSize: 42,
            marginBottom: 18,
          }}
        >
          {page.icon}
        </div>

        <div
          style={{
            color: 'rgba(255,255,255,0.92)',
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          {pageIndex === 0 && (
            <div
              style={{
                color: COLORS.yellow,
                fontFamily: "'Fredoka One', cursive",
                fontSize: 24,
                lineHeight: 1.1,
                marginBottom: 14,
              }}
            >
              Heja Högans brudar!
            </div>
          )}
          {page.body}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {INTRO_PAGES.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: idx === pageIndex ? COLORS.lime : 'rgba(255,255,255,0.16)',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button
            onClick={onPrev}
            disabled={isFirst}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minWidth: 92,
              padding: '12px 14px',
              borderRadius: 14,
              border: 'none',
              background: isFirst ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.14)',
              color: isFirst ? 'rgba(255,255,255,0.28)' : '#fff',
              cursor: isFirst ? 'default' : 'pointer',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <ArrowLeft size={16} /> Tillbaka
          </button>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }}>
            {pageIndex + 1}/{INTRO_PAGES.length}
          </div>
          <button
            onClick={isLast ? onClose : onNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minWidth: 108,
              padding: '12px 16px',
              borderRadius: 14,
              border: 'none',
              background: COLORS.lime,
              color: COLORS.dark,
              cursor: 'pointer',
              fontFamily: "'Fredoka One', cursive",
              fontSize: 16,
            }}
          >
            {isLast ? 'Spela!' : <>Nästa <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const { user, stats, setScreen, seasonStart, setTeamFeedOpen, buddyChallenges, setChallengeScrollTarget, pendingCheers, markCheersSeen } = useUser();

  function goTo(target) {
    setChallengeScrollTarget(target);
    setScreen('challenges');
  }
  const [allUsers, setAllUsers] = useState([]);
  const [teamPhotos, setTeamPhotos] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [introPage, setIntroPage] = useState(0);
  const [fireSeenThisWeek, setFireSeenThisWeek] = useState(() => {
    const weekKey = `fire_seen_${getWeekStart(localToday())}`;
    return !!localStorage.getItem(weekKey);
  });
  const [cheerToast, setCheerToast] = useState(null);  // { names: [...] }
  const [cheerFading, setCheerFading] = useState(false);

  useEffect(() => {
    const stale = fetchAllUsersStale(fresh => {
      setAllUsers(fresh);
      setLoadingTeam(false);
    });
    if (stale && stale.length > 0) {
      setAllUsers(stale);
      setLoadingTeam(false);
    }

    const stalePhotos = fetchTeamPhotosStale((fresh) => {
      setTeamPhotos(fresh || []);
    });
    if (stalePhotos) {
      setTeamPhotos(stalePhotos);
    }
  }, []);

  useEffect(() => {
    if (!user?.alias) return;
    const introKey = `hogalid_intro_seen_${user.alias}`;
    if (!localStorage.getItem(introKey)) {
      setIntroPage(0);
      setShowIntro(true);
      localStorage.setItem(introKey, '1');
    }
  }, [user?.alias]);

  // Show cheer toast when there are pending cheers
  useEffect(() => {
    if (!pendingCheers || pendingCheers.length === 0 || cheerToast) return;
    const names = [...new Set(pendingCheers.map(c => c.fromAlias))];
    setCheerToast({ names });
    const ids = pendingCheers.map(c => c.id);
    markCheersSeen(ids);
    // Auto-dismiss after 5s
    const t1 = setTimeout(() => setCheerFading(true), 4500);
    const t2 = setTimeout(() => { setCheerToast(null); setCheerFading(false); }, 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pendingCheers]);

  const level = getLevel(stats.totalPoints);
  const nextLevel = getNextLevel(stats.totalPoints);
  const progress = calcProgress(stats.totalPoints);
  const todayStr = localToday();
  const streakWeekStart = getWeekStart(todayStr);
  const qualifyingDays = getQualifyingFootballDays(user.logs || []);
  const qualifyingDaySet = new Set(qualifyingDays);
  const hasStreakToday = qualifyingDaySet.has(todayStr);
  const streakStatusText = hasStreakToday
    ? '✅ Du har säkrat streaken idag!'
    : '⏳ Logga en träning idag för att behålla streaken';
  const streakWeekDays = Array.from({ length: 7 }, (_, i) => addDaysStr(streakWeekStart, i));

  function openIntro() {
    setIntroPage(0);
    setShowIntro(true);
  }

  const feedItems = useMemo(() => {
    if (!allUsers.length) return [];
    return generateFeed(allUsers, user.alias, seasonStart, teamPhotos).slice(0, 5);
  }, [allUsers, user.alias, seasonStart, teamPhotos]);

  // "Gör-det-nu" logic
  const hasLogToday = (user.logs || []).some(l => l.date === todayStr && !l.bingo && !l.dailyChallenge);
  const dailyChallenge = getDailyChallenge(seasonStart);
  const dailyDoneToday = (user.completedDaily || {})[todayStr] === dailyChallenge?.id;
  const pendingBuddies = buddyChallenges.filter(c => c.status === 'pending' && c.toAlias === user.alias);
  const activeBuddies = buddyChallenges.filter(c => c.status === 'active');

  const playersLoggedToday = useMemo(() => {
    if (!allUsers.length) return 0;
    return allUsers.filter(u => (u.logs || []).some(l => l.date === todayStr && !l.bingo && !l.dailyChallenge)).length;
  }, [allUsers, todayStr]);

  const nudge = useMemo(() => {
    if (!hasLogToday) return { icon: '⚽', text: 'Dags att träna! Sisten som loggar sin dag hejar på Reymers!', action: 'log', color: COLORS.lime };
    if (!dailyDoneToday) return { icon: '📅', text: 'Dagens utmaning väntar!', action: 'daily', color: COLORS.yellow };
    if (pendingBuddies.length > 0) return { icon: '🤝', text: `${pendingBuddies.length} kompisutmaning väntar på svar!`, action: 'buddy', color: '#f9a8d4' };
    if (activeBuddies.length > 0) return { icon: '💪', text: 'Du har en aktiv kompisutmaning — kämpa på!', action: 'buddy', color: '#60a5fa' };
    return { icon: '🎉', text: 'Du har gjort allt idag — bra jobbat!', action: null, color: COLORS.lime };
  }, [hasLogToday, dailyDoneToday, pendingBuddies.length, activeBuddies.length]);

  return (
    <div style={{ padding: '20px 16px', fontFamily: "'Nunito', sans-serif" }}>
      {showIntro && (
        <IntroModal
          pageIndex={introPage}
          onPrev={() => setIntroPage((p) => Math.max(0, p - 1))}
          onNext={() => setIntroPage((p) => Math.min(INTRO_PAGES.length - 1, p + 1))}
          onClose={() => setShowIntro(false)}
        />
      )}
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
        @keyframes cheerSlideIn {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes cheerFadeOut {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes cheerBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>

      {/* Cheer toast */}
      {cheerToast && (
        <div
          onClick={() => { setCheerToast(null); setCheerFading(false); }}
          style={{
            position: 'fixed',
            top: 60,
            left: 16,
            right: 16,
            zIndex: 1200,
            background: 'linear-gradient(135deg, rgba(255,200,0,0.95) 0%, rgba(255,140,0,0.95) 100%)',
            borderRadius: 18,
            padding: '16px 20px',
            boxShadow: '0 8px 32px rgba(255,140,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            animation: cheerFading ? 'cheerFadeOut 0.7s ease-in forwards' : 'cheerSlideIn 0.5s ease-out',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 36, animation: 'cheerBounce 0.6s ease-in-out 3', lineHeight: 1 }}>📣</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#1a1a2e', fontFamily: "'Fredoka One', cursive", fontSize: 16, lineHeight: 1.2 }}>
              {cheerToast.names.length === 1
                ? `${cheerToast.names[0]} hejar på dig!`
                : `${cheerToast.names.slice(0, -1).join(', ')} & ${cheerToast.names[cheerToast.names.length - 1]} hejar på dig!`}
            </div>
            <div style={{ color: 'rgba(26,26,46,0.6)', fontSize: 12, marginTop: 3, fontWeight: 600 }}>
              Kämpa vidare! 💪
            </div>
          </div>
        </div>
      )}

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

      {/* Gör-det-nu nudge */}
      <button
        onClick={() => {
          if (nudge.action === 'log') setScreen('log');
          else if (nudge.action === 'daily') goTo('daily');
          else if (nudge.action === 'buddy') goTo('buddy');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '14px 16px',
          marginBottom: 12,
          borderRadius: 16,
          border: `1.5px solid ${nudge.color}44`,
          background: `linear-gradient(135deg, ${nudge.color}18, ${nudge.color}08)`,
          cursor: nudge.action ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{nudge.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Nunito', sans-serif",
          }}>
            {nudge.text}
          </div>
          {!loadingTeam && allUsers.length > 1 && (
            <div style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 11,
              fontWeight: 600,
              marginTop: 3,
            }}>
              {playersLoggedToday} av {allUsers.length} spelare har tränat idag
            </div>
          )}
        </div>
        {nudge.action && (
          <ArrowRight size={18} style={{ color: nudge.color, flexShrink: 0 }} />
        )}
      </button>

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
        <Card onClick={() => setScreen('log')} style={{ padding: '16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: 'rgba(240,220,0,0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              🔥
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: 28,
                  color: COLORS.yellow,
                  lineHeight: 1,
                }}
              >
                {stats.streak}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700 }}>
                dagars streak
              </div>
            </div>
          </div>
          <div
            style={{
              background: hasStreakToday ? 'rgba(240,220,0,0.14)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${hasStreakToday ? 'rgba(240,220,0,0.3)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 12,
              padding: '8px 10px',
              color: hasStreakToday ? COLORS.yellow : '#fff',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.35,
              marginBottom: 12,
            }}
          >
            {streakStatusText}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
            {streakWeekDays.map((dayDate, idx) => {
              const isDone = qualifyingDaySet.has(dayDate);
              const isToday = dayDate === todayStr;
              const isFuture = dayDate > todayStr;
              return (
                <div key={dayDate} style={{ textAlign: 'center', minWidth: 0 }}>
                  <div
                    style={{
                      color: isToday ? COLORS.yellow : 'rgba(255,255,255,0.45)',
                      fontSize: 10,
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    {STREAK_DAY_LABELS[idx]}
                  </div>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 900,
                      background: isDone
                        ? COLORS.yellow
                        : isToday
                          ? 'rgba(240,220,0,0.18)'
                          : 'rgba(255,255,255,0.12)',
                      color: isDone ? COLORS.dark : isFuture ? 'rgba(255,255,255,0.28)' : '#fff',
                      border: isToday && !isDone
                        ? `1.5px solid ${COLORS.yellow}`
                        : '1px solid transparent',
                    }}
                  >
                    {isDone ? '✓' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 12px',
            gap: 6,
          }}
        >
          <div>
            <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 4 }}>⭐</div>
            <div
              style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 28,
                color: COLORS.accent,
                lineHeight: 1,
              }}
            >
              {stats.totalPoints}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700 }}>
              poäng
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', width: '80%' }} />
          <div>
            <div style={{ fontSize: 20, lineHeight: 1, marginBottom: 3 }}>🪙</div>
            <div
              style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 22,
                color: '#f0dc00',
                lineHeight: 1,
              }}
            >
              {(() => {
                const ids = new Set(user.unlockedItems || []);
                let spent = 0;
                for (const c of PLAYER_CARDS) { if (ids.has(c.id)) spent += CARD_PACK_COST; }
                for (const c of LEGEND_CARDS) { if (ids.has(c.id)) spent += LEGEND_PACK_COST; }
                return stats.totalPoints - spent;
              })()}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}>
              mynt
            </div>
          </div>
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
      {/* Collector cards CTA */}
      {(() => {
        const ids = new Set(user.unlockedItems || []);
        const pCount = PLAYER_CARDS.filter(c => ids.has(c.id)).length;
        const lCount = LEGEND_CARDS.filter(c => ids.has(c.id)).length;
        const total = pCount + lCount;
        const max = TOTAL_PLAYER_CARDS + TOTAL_LEGEND_CARDS;
        let spent = 0;
        for (const c of PLAYER_CARDS) { if (ids.has(c.id)) spent += CARD_PACK_COST; }
        for (const c of LEGEND_CARDS) { if (ids.has(c.id)) spent += LEGEND_PACK_COST; }
        const mynt = stats.totalPoints - spent;
        const nextCost = pCount >= TOTAL_PLAYER_CARDS ? LEGEND_PACK_COST : CARD_PACK_COST;
        const canBuy = mynt >= nextCost;
        return (
          <button
            onClick={() => setScreen('cards')}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 16,
              border: canBuy && total < max ? `1.5px solid rgba(240,220,0,0.35)` : '1px solid rgba(255,255,255,0.1)',
              background: `linear-gradient(135deg, rgba(0,26,77,0.6), rgba(0,40,104,0.5))`,
              cursor: 'pointer',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 44,
              height: 56,
              borderRadius: 8,
              background: 'linear-gradient(145deg, #001a4d, #002868)',
              border: '2px solid #f0dc00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}>
              ⚽
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 16,
                color: '#fff',
                lineHeight: 1.2,
              }}>
                Samlarkort
              </div>
              <div style={{
                color: total >= max ? '#ffd700' : 'rgba(255,255,255,0.5)',
                fontSize: 12,
                fontWeight: 600,
                marginTop: 2,
              }}>
                {total >= max
                  ? '🏆 Komplett samling!'
                  : `${total}/${max} kort samlade`}
              </div>
            </div>
            <div style={{
              color: canBuy && total < max ? '#f0dc00' : 'rgba(255,255,255,0.35)',
              fontWeight: 700,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexShrink: 0,
            }}>
              {total < max && (canBuy ? '🪙 Öppna kort!' : `🪙 ${nextCost}`)}
              <ArrowRight size={14} />
            </div>
          </button>
        );
      })()}
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

      <button
        onClick={openIntro}
        style={{
          width: '100%',
          padding: '13px 0',
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.88)',
          fontWeight: 800,
          fontSize: 14,
          cursor: 'pointer',
          marginBottom: 8,
          letterSpacing: 0.3,
        }}
      >
        ❓ Hur funkar appen?
      </button>
    </div>
  );
}
