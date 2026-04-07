import { EXERCISES, DAILY_CHALLENGES, BADGES } from '../constants';
import { getLevel, getTeamLevel } from './levels';
import { computeStats } from './stats';
import { localToday, getWeekStart } from './date';
import { computeWeeklyHistory } from './weeklyHistory';
import { getWeeklyLevelInfo, WEEKLY_LEVEL_NAMES } from './challenges';
import { getWeeklyChallengeForDate } from './weeklyHistory';

const STREAK_MILESTONES = [3, 5, 7, 10, 14, 21, 30];

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

export function generateFeed(allUsers, myAlias, seasonStart) {
  const events = [];
  const today = localToday();

  allUsers.forEach(u => {
    const isMe = u.alias === myAlias;
    const logs = [...(u.logs || [])].sort((a, b) => a.date.localeCompare(b.date));

    // Joined team
    if (u.joinedAt) {
      const joinDate = u.joinedAt.slice(0, 10);
      events.push({
        date: joinDate,
        type: 'joined',
        alias: u.alias,
        isMe,
        text: `har just gått med i HögalidF15! 🎉`,
        icon: '🆕',
      });
    }

    // Daily challenges completed
    Object.entries(u.completedDaily || {}).forEach(([date, challengeId]) => {
      const challenge = DAILY_CHALLENGES.find(c => c.id === challengeId);
      events.push({
        date,
        type: 'daily',
        alias: u.alias,
        isMe,
        text: `klarade dagsuppdraget "${challenge?.label || challengeId}"`,
        icon: challenge?.icon || '✅',
      });
    });

    // Level ups — track cumulative points
    let cumPoints = 0;
    let prevLevelName = null;
    logs.forEach(l => {
      const before = getLevel(cumPoints);
      cumPoints += l.points || 0;
      const after = getLevel(cumPoints);
      if (prevLevelName !== null && after.name !== before.name) {
        events.push({
          date: l.date,
          createdAt: l.createdAt || '',
          type: 'levelup',
          alias: u.alias,
          isMe,
          text: `gick upp till nivå ${after.icon} ${after.name}`,
          icon: after.icon,
        });
      }
      prevLevelName = after.name;
    });

    // Penalty game results — title format: 'penalty:GOALS:TOTAL'
    (u.logs || []).filter(l => l.title && l.title.startsWith('penalty:')).forEach(l => {
      const [goals, total] = l.title.slice('penalty:'.length).split(':').map(Number);
      const icon = goals === total ? '🏆' : goals >= 7 ? '⚽' : goals >= 4 ? '🥅' : '🧤';
      events.push({
        date: l.date,
        createdAt: l.createdAt || '',
        type: 'penalty',
        alias: u.alias,
        isMe,
        text: `satte ${goals} av ${total} straffar och fick ${goals} poäng! ${icon}`,
        icon,
      });
    });

    // Badge earned — check earned badges and approximate with join/log dates
    const stats = computeStats(u);
    const earned = BADGES.filter(b => b.condition(stats));
    earned.forEach(b => {
      // Use the last log date as approximate date, or today
      const lastLog = logs[logs.length - 1];
      events.push({
        date: lastLog?.date || today,
        type: 'badge',
        alias: u.alias,
        isMe,
        text: `fick medaljen "${b.label}"`,
        icon: b.icon,
      });
    });

    // Streak milestones (only if active today)
    const lastQualifyingLog = logs.filter(l => {
      if (l.bingoFootball) return true;
      if (l.bingo) return false;
      const mins = (l.exercises || []).find(e => e.id === 'fritraning')?.value || 0;
      const touch = (l.exercises || []).reduce((s, e) => {
        const ex = EXERCISES.find(x => x.id === e.id);
        return s + (ex && !ex.isTime && e.id !== 'skott' ? e.value || 0 : 0);
      }, 0);
      return mins >= 5 || touch >= 30;
    }).pop();

    if (lastQualifyingLog) {
      const daysSince = (new Date(today) - new Date(lastQualifyingLog.date)) / 86400000;
      if (daysSince <= 1 && STREAK_MILESTONES.includes(stats.streak)) {
        events.push({
          date: lastQualifyingLog.date,
          createdAt: lastQualifyingLog.createdAt || '',
          type: 'streak',
          alias: u.alias,
          isMe,
          text: `har ${stats.streak} dagars streak i rad! 🔥`,
          icon: '🔥',
        });
      }
    }
  });

  // Weekly challenge: level-ups during current week (day by day)
  if (seasonStart) {
    const today = localToday();
    const weekStart = getWeekStart(today);
    const weekEnd = today;
    const challenge = getWeeklyChallengeForDate(weekStart, seasonStart);

    // Collect all relevant dates in the current week
    const allDates = [...new Set(
      allUsers.flatMap(u => (u.logs || [])
        .filter(l => !l.bingo && l.date >= weekStart && l.date <= weekEnd)
        .map(l => l.date)
      )
    )].sort();

    let prevLevel = 0;
    allDates.forEach(date => {
      let touch = 0, minutes = 0;
      allUsers.forEach(u => {
        (u.logs || []).filter(l => !l.bingo && l.date >= weekStart && l.date <= date).forEach(l => {
          minutes += l.minutes || 0;
          (l.exercises || []).forEach(e => {
            const ex = EXERCISES.find(x => x.id === e.id);
            if (ex && !ex.isTime && e.id !== 'skott') touch += e.value || 0;
          });
        });
      });
      const val = challenge.type === 'touch' ? touch : minutes;
      const levelInfo = getWeeklyLevelInfo(val, challenge.goal);
      if (levelInfo.level > prevLevel) {
        for (let lvl = prevLevel + 1; lvl <= levelInfo.level; lvl++) {
          events.push({
            date,
            type: 'weeklylevel',
            alias: 'Laget',
            isMe: false,
            text: `nådde Nivå ${lvl} — ${WEEKLY_LEVEL_NAMES[lvl - 1]} i veckoutmaningen! ${lvl === 10 ? '🔥' : '🏅'}`,
            icon: lvl === 10 ? '🔥' : '🏅',
          });
        }
        prevLevel = levelInfo.level;
      }
    });

    // Historical week endings
    const history = computeWeeklyHistory(allUsers, seasonStart);
    history.forEach(({ weekStart: ws, weekEnd: we, challenge: c, levelInfo: li }) => {
      events.push({
        date: we,
        type: 'weeklyend',
        alias: 'Laget',
        isMe: false,
        text: li.level > 0
          ? `avslutade veckan på Nivå ${li.level} — ${li.levelName} ${li.isMaxLevel ? '🔥' : '✅'}`
          : `klarade inte veckoutmaningen den veckan ❌`,
        icon: li.level > 0 ? (li.isMaxLevel ? '🔥' : '🏆') : '❌',
      });
    });
  }

  // Team level progression — based on cumulative season points from all players
  {
    const allLogsByDate = allUsers
      .flatMap(u => (u.logs || []).map(l => ({ date: l.date, points: l.points || 0 })))
      .sort((a, b) => a.date.localeCompare(b.date));

    const allDates = [...new Set(allLogsByDate.map(l => l.date))].sort();
    let cumTeamPoints = 0;
    let prevTeamLevelName = null;

    allDates.forEach(date => {
      const pointsOnDate = allLogsByDate
        .filter(l => l.date === date)
        .reduce((s, l) => s + l.points, 0);
      const before = getTeamLevel(cumTeamPoints);
      cumTeamPoints += pointsOnDate;
      const after = getTeamLevel(cumTeamPoints);
      if (prevTeamLevelName !== null && after.name !== before.name) {
        events.push({
          date,
          type: 'teamlevel',
          alias: 'Laget',
          isMe: false,
          text: `nådde lagnivå ${after.icon} ${after.name}! 🎉`,
          icon: after.icon,
        });
      }
      prevTeamLevelName = after.name;
    });
  }

  // Buddy challenge completions — parse '🤝buddy:PARTNER:AMOUNT:EXERCISEID' logs
  // Only emit one event per challenge pair (the pair who completes last triggers it)
  const buddyEventKeys = new Set();
  allUsers.forEach(u => {
    (u.logs || []).forEach(l => {
      if (!l.title || !l.title.startsWith('🤝buddy:')) return;
      // title = '🤝buddy:PARTNER:AMOUNT:EXERCISEID'
      const parts = l.title.slice('🤝buddy:'.length).split(':');
      if (parts.length < 3) return;
      const [partner, amount, exerciseId] = parts;
      const ex = EXERCISES.find(e => e.id === exerciseId);
      // Deduplicate: canonical key = sorted aliases + exercise + amount
      const pairKey = [u.alias, partner].sort().join('|') + `|${exerciseId}|${amount}`;
      if (buddyEventKeys.has(pairKey)) return;
      buddyEventKeys.add(pairKey);
      const isMe = u.alias === myAlias || partner === myAlias;
      events.push({
        date: l.date,
        createdAt: l.createdAt || '',
        type: 'buddy',
        alias: u.alias,
        isMe,
        text: `& ${partner} klarade kompisutmaningen: ${amount} ${ex?.label || exerciseId}! 🤝`,
        icon: '🤝',
      });
    });
  });

  // Deduplicate badge events (keep only one per alias+badge)
  const seen = new Set();
  const deduped = events.filter(e => {
    const key = `${e.alias}-${e.type}-${e.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => {
    // Primary: date descending
    const dateCmp = b.date.localeCompare(a.date);
    if (dateCmp !== 0) return dateCmp;
    // Secondary: createdAt descending — events with a timestamp beat those without
    const aTime = a.createdAt || '';
    const bTime = b.createdAt || '';
    if (bTime && !aTime) return 1;   // b has time, a doesn't → b wins
    if (aTime && !bTime) return -1;  // a has time, b doesn't → a wins
    return bTime.localeCompare(aTime);
  }).slice(0, 40);
}
