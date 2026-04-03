import { EXERCISES, DAILY_CHALLENGES, BADGES } from '../constants';
import { getLevel } from './levels';
import { computeStats } from './stats';
import { localToday } from './date';

const STREAK_MILESTONES = [3, 5, 7, 10, 14, 21, 30];

export function generateFeed(allUsers, myAlias) {
  const events = [];
  const today = localToday();

  allUsers.forEach(u => {
    const isMe = u.alias === myAlias;
    const logs = [...(u.logs || [])].sort((a, b) => a.date.localeCompare(b.date));

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
          type: 'levelup',
          alias: u.alias,
          isMe,
          text: `gick upp till nivå ${after.icon} ${after.name}`,
          icon: after.icon,
        });
      }
      prevLevelName = after.name;
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
        text: `fick badgen "${b.label}"`,
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
          type: 'streak',
          alias: u.alias,
          isMe,
          text: `har ${stats.streak} dagars streak i rad! 🔥`,
          icon: '🔥',
        });
      }
    }
  });

  // Deduplicate badge events (keep only one per alias+badge)
  const seen = new Set();
  const deduped = events.filter(e => {
    const key = `${e.alias}-${e.type}-${e.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
}
