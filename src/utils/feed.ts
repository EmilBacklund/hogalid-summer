import { EXERCISES, DAILY_CHALLENGES, BADGES } from '../constants';
import { getLevel, getTeamLevel } from './levels';
import { computeStats } from './stats';
import { localToday, getWeekStart } from './date';
import { computeWeeklyHistory, getWeeklyChallengeForDate } from './weeklyHistory';
import { getWeeklyLevelInfo, WEEKLY_LEVEL_NAMES } from './challenges';
import type { FeedEvent, Photo, User } from '../types';

const STREAK_MILESTONES = [3, 5, 7, 10, 14, 21, 30];

export function generateFeed(
  allUsers: User[],
  myAlias: string,
  seasonStart: string | null,
  photos: Photo[] = [],
): FeedEvent[] {
  const events: FeedEvent[] = [];
  const today = localToday();
  const nameByAlias: Record<string, string> = Object.fromEntries(
    allUsers.map((u) => [u.alias, u.displayName || u.displayAlias || u.alias]),
  );

  allUsers.forEach((u) => {
    const isMe = u.alias === myAlias;
    const displayAlias = u.displayName || u.displayAlias || u.alias;
    const logs = [...(u.logs || [])].sort((a, b) => a.date.localeCompare(b.date));

    // Joined team
    if (u.joinedAt) {
      const joinDate = u.joinedAt.slice(0, 10);
      events.push({
        date: joinDate,
        type: 'joined',
        alias: displayAlias,
        isMe,
        text: `har just gått med i HögalidF15! 🎉`,
        icon: '🆕',
      });
    }

    // Daily challenges completed
    Object.entries(u.completedDaily || {}).forEach(([date, challengeId]) => {
      const challenge = DAILY_CHALLENGES.find((c) => c.id === challengeId);
      events.push({
        date,
        type: 'daily',
        alias: displayAlias,
        isMe,
        text: `klarade dagsuppdraget "${challenge?.label || challengeId}"`,
        icon: challenge?.icon || '✅',
      });
    });

    // Level ups — track cumulative points
    let cumPoints = 0;
    let prevLevelName: string | null = null;
    logs.forEach((l) => {
      const before = getLevel(cumPoints);
      cumPoints += l.points || 0;
      const after = getLevel(cumPoints);
      if (prevLevelName !== null && after.name !== before.name) {
        events.push({
          date: l.date,
          createdAt: l.createdAt || '',
          type: 'levelup',
          alias: displayAlias,
          isMe,
          text: `gick upp till nivå ${after.icon} ${after.name}`,
          icon: after.icon,
        });
      }
      prevLevelName = after.name;
    });

    // Penalty game results — title format: 'penalty:GOALS:TOTAL'
    (u.logs || [])
      .filter((l) => l.title && l.title.startsWith('penalty:'))
      .forEach((l) => {
        const parts = l.title.slice('penalty:'.length).split(':').map(Number);
        const goals = parts[0] ?? 0;
        const total = parts[1] ?? 0;
        const icon = goals === total ? '🏆' : goals >= 7 ? '⚽' : goals >= 4 ? '🥅' : '🧤';
        events.push({
          date: l.date,
          createdAt: l.createdAt || '',
          type: 'penalty',
          alias: displayAlias,
          isMe,
          text: `satte ${goals} av ${total} straffar och fick ${goals} poäng! ${icon}`,
          icon,
        });
      });

    // Bingo line bonuses — title starts with "🎯"
    (u.logs || [])
      .filter((l) => l.title && l.title.startsWith('🎯'))
      .forEach((l) => {
        events.push({
          date: l.date,
          createdAt: l.createdAt || '',
          type: 'bingoline',
          alias: displayAlias,
          isMe,
          text: `klarade en bingorad! ${l.title}`,
          icon: '🎯',
        });
      });

    // Badge earned — approximate with the last log date
    const stats = computeStats(u);
    const earned = BADGES.filter((b) => b.condition(stats));
    earned.forEach((b) => {
      const lastLog = logs[logs.length - 1];
      events.push({
        date: lastLog?.date || today,
        type: 'badge',
        alias: displayAlias,
        isMe,
        text: `fick medaljen "${b.label}"`,
        icon: b.icon,
      });
    });

    // Streak milestones (only if active today)
    const lastQualifyingLog = logs
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
      .pop();

    if (lastQualifyingLog) {
      const daysSince =
        (new Date(today).getTime() - new Date(lastQualifyingLog.date).getTime()) / 86400000;
      if (daysSince <= 1 && STREAK_MILESTONES.includes(stats.streak)) {
        events.push({
          date: lastQualifyingLog.date,
          createdAt: lastQualifyingLog.createdAt || '',
          type: 'streak',
          alias: displayAlias,
          isMe,
          text: `har ${stats.streak} dagars streak i rad! 🔥`,
          icon: '🔥',
        });
      }
    }
  });

  photos.forEach((photo) => {
    const alias = photo.uploaderName || photo.alias;
    events.push({
      date: photo.date || (photo.uploadedAt || '').slice(0, 10) || today,
      createdAt: photo.uploadedAt || '',
      type: 'photo',
      alias,
      isMe: photo.alias === myAlias,
      text: 'la till en bild i fotoalbumet!',
      icon: '📸',
      target: 'album',
      photoId: photo.id,
    });
  });

  // Weekly challenge: level-ups during current week (day by day)
  if (seasonStart) {
    const weekStart = getWeekStart(today);
    const weekEnd = today;
    const challenge = getWeeklyChallengeForDate(weekStart, seasonStart);

    const allDates = [
      ...new Set(
        allUsers.flatMap((u) =>
          (u.logs || [])
            .filter((l) => !l.bingo && l.date >= weekStart && l.date <= weekEnd)
            .map((l) => l.date),
        ),
      ),
    ].sort();

    let prevLevel = 0;
    allDates.forEach((date) => {
      let touch = 0;
      let minutes = 0;
      allUsers.forEach((u) => {
        (u.logs || [])
          .filter((l) => !l.bingo && l.date >= weekStart && l.date <= date)
          .forEach((l) => {
            minutes += l.minutes || 0;
            (l.exercises || []).forEach((e) => {
              const ex = EXERCISES.find((x) => x.id === e.id);
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
    history.forEach(({ weekEnd: we, levelInfo: li }) => {
      events.push({
        date: we,
        type: 'weeklyend',
        alias: 'Laget',
        isMe: false,
        text:
          li.level > 0
            ? `avslutade veckan på Nivå ${li.level} — ${li.levelName} ${li.isMaxLevel ? '🔥' : '✅'}`
            : `klarade inte veckoutmaningen den veckan ❌`,
        icon: li.level > 0 ? (li.isMaxLevel ? '🔥' : '🏆') : '❌',
      });
    });
  }

  // Team level progression — based on cumulative season points from all players
  {
    const allLogsByDate = allUsers
      .flatMap((u) => (u.logs || []).map((l) => ({ date: l.date, points: l.points || 0 })))
      .sort((a, b) => a.date.localeCompare(b.date));

    const allDates = [...new Set(allLogsByDate.map((l) => l.date))].sort();
    let cumTeamPoints = 0;
    let prevTeamLevelName: string | null = null;

    allDates.forEach((date) => {
      const pointsOnDate = allLogsByDate
        .filter((l) => l.date === date)
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

  // Buddy challenge completions — parse '🤝buddy:PARTNER:AMOUNT:EXERCISEID' logs.
  // Only emit one event per challenge pair (the pair who completes last triggers it).
  const buddyEventKeys = new Set<string>();
  allUsers.forEach((u) => {
    const displayAlias = u.displayName || u.displayAlias || u.alias;
    (u.logs || []).forEach((l) => {
      if (!l.title || !l.title.startsWith('🤝buddy:')) return;
      const parts = l.title.slice('🤝buddy:'.length).split(':');
      if (parts.length < 3) return;
      const partner = parts[0] ?? '';
      const amount = parts[1] ?? '';
      const exerciseId = parts[2] ?? '';
      const ex = EXERCISES.find((e) => e.id === exerciseId);
      const pairKey = [u.alias, partner].sort().join('|') + `|${exerciseId}|${amount}`;
      if (buddyEventKeys.has(pairKey)) return;
      buddyEventKeys.add(pairKey);
      const isMe = u.alias === myAlias || partner === myAlias;
      const partnerLabel = nameByAlias[partner] || partner;
      events.push({
        date: l.date,
        createdAt: l.createdAt || '',
        type: 'buddy',
        alias: displayAlias,
        isMe,
        text: `& ${partnerLabel} klarade kompisutmaningen: ${amount} ${ex?.label || exerciseId}! 🤝`,
        icon: '🤝',
      });
    });
  });

  // Deduplicate (keep only one per alias+badge / alias+photo / alias+type+date+text)
  const seen = new Set<string>();
  const deduped = events.filter((e) => {
    const key =
      e.type === 'badge'
        ? `${e.alias}-${e.type}-${e.text}`
        : e.type === 'photo'
          ? `${e.alias}-${e.type}-${e.photoId}`
          : `${e.alias}-${e.type}-${e.date}-${e.createdAt || ''}-${e.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped
    .sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      const aTime = a.createdAt || '';
      const bTime = b.createdAt || '';
      if (bTime && !aTime) return 1;
      if (aTime && !bTime) return -1;
      return bTime.localeCompare(aTime);
    })
    .slice(0, 40);
}
