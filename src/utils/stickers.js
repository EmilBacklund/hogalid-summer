import { STICKERS } from '../constants/stickers';
import { getWeekStart } from './date';

function getWeekday(dateStr) {
  return new Date(dateStr).getDay();
}

function getRealTrainingLogs(user) {
  return (user.logs || []).filter((log) => !log.bingo && !log.dailyChallenge && !(log.title || '').startsWith('🤝buddy:'));
}

function countByWeek(logs) {
  const byWeek = {};
  logs.forEach((log) => {
    const week = getWeekStart(log.date);
    if (!byWeek[week]) byWeek[week] = new Set();
    byWeek[week].add(log.date);
  });
  return Object.fromEntries(
    Object.entries(byWeek).map(([week, dates]) => [week, dates.size]),
  );
}

function getExerciseDayCount(logs, exerciseId) {
  return new Set(
    logs
      .filter((log) => (log.exercises || []).some((exercise) => exercise.id === exerciseId && (exercise.value || 0) > 0))
      .map((log) => log.date),
  ).size;
}

function hasSingleExerciseValue(logs, exerciseId, minValue) {
  return logs.some((log) =>
    (log.exercises || []).some((exercise) => exercise.id === exerciseId && (exercise.value || 0) >= minValue),
  );
}

function countSummerActivitiesByWeek(logs) {
  const byWeek = {};
  logs.forEach((log) => {
    const total = (log.iceCream || 0) + (log.swim || 0) + (log.pages || 0 ? 1 : 0);
    if (total <= 0) return;
    const week = getWeekStart(log.date);
    byWeek[week] = (byWeek[week] || 0) + total;
  });
  return byWeek;
}

export function getStickerContext(user, stats) {
  const realLogs = getRealTrainingLogs(user);
  const weekCounts = Object.values(countByWeek(realLogs));
  const completedDailyCount = Object.keys(user.completedDaily || {}).length;
  const buddyCompletions = (user.logs || []).filter((log) => (log.title || '').startsWith('🤝buddy:')).length;
  const summerWeekCounts = Object.values(countSummerActivitiesByWeek(user.logs || []));

  return {
    user,
    stats,
    realLogs,
    completedDailyCount,
    buddyCompletions,
    photoCount: stats.photoCount || 0,
    hasWeekday: (weekday) => realLogs.some((log) => getWeekday(log.date) === weekday),
    maxLogsInWeek: weekCounts.length ? Math.max(...weekCounts) : 0,
    hasExercise: (exerciseId) => realLogs.some((log) => (log.exercises || []).some((exercise) => exercise.id === exerciseId && (exercise.value || 0) > 0)),
    exerciseDayCount: (exerciseId) => getExerciseDayCount(realLogs, exerciseId),
    hasSingleExerciseValue: (exerciseId, minValue) => hasSingleExerciseValue(realLogs, exerciseId, minValue),
    hasSummerActivity: (field) => (user.logs || []).some((log) => (log[field] || 0) >= 1),
    hasAnySummerActivity: () => (user.logs || []).some((log) => (log.iceCream || 0) + (log.swim || 0) + (log.pages || 0 ? 1 : 0) > 0),
    maxSummerActivitiesInWeek: summerWeekCounts.length ? Math.max(...summerWeekCounts) : 0,
  };
}

const STICKER_CONDITIONS = {
  start_shot: (ctx) => ctx.realLogs.length >= 1,
  monday_starter: (ctx) => ctx.hasWeekday(1),
  tuesday_touch: (ctx) => ctx.hasWeekday(2),
  wednesday_warrior: (ctx) => ctx.hasWeekday(3),
  first_thursday: (ctx) => ctx.hasWeekday(4),
  friday_focus: (ctx) => ctx.hasWeekday(5),
  saturday_smile: (ctx) => ctx.hasWeekday(6),
  sunday_hero: (ctx) => ctx.hasWeekday(0),
  week_three_logs: (ctx) => ctx.maxLogsInWeek >= 3,
  week_five_logs: (ctx) => ctx.maxLogsInWeek >= 5,
  streak2: (ctx) => ctx.stats.maxStreak >= 2,
  streak3: (ctx) => ctx.stats.maxStreak >= 3,
  first_daily: (ctx) => ctx.completedDailyCount >= 1,
  three_dailies: (ctx) => ctx.completedDailyCount >= 3,
  five_dailies: (ctx) => ctx.completedDailyCount >= 5,

  toetaps_friend: (ctx) => ctx.hasExercise('toetaps'),
  twofoot_friend: (ctx) => ctx.hasExercise('tvafotare'),
  cruyff_friend: (ctx) => ctx.hasExercise('cruyff'),
  juggle_friend: (ctx) => ctx.hasExercise('jonglera'),
  passing_friend: (ctx) => ctx.hasExercise('passningar'),
  shot_happy: (ctx) => ctx.hasExercise('skott'),
  free_training_20: (ctx) => ctx.hasSingleExerciseValue('fritraning', 20),
  toetaps_100: (ctx) => ctx.hasSingleExerciseValue('toetaps', 100),
  twofoot_100: (ctx) => ctx.hasSingleExerciseValue('tvafotare', 100),
  shot_ten: (ctx) => ctx.hasSingleExerciseValue('skott', 10),
  cruyff_three_days: (ctx) => ctx.exerciseDayCount('cruyff') >= 3,
  juggle_three_days: (ctx) => ctx.exerciseDayCount('jonglera') >= 3,
  passing_three_days: (ctx) => ctx.exerciseDayCount('passningar') >= 3,
  shot_three_days: (ctx) => ctx.exerciseDayCount('skott') >= 3,

  bingo_start: (ctx) => ctx.stats.bingoCount >= 1,
  bingo_five: (ctx) => ctx.stats.bingoCount >= 5,
  photographer: (ctx) => ctx.photoCount >= 1,
  album_friend: (ctx) => ctx.photoCount >= 3,
  master_photographer: (ctx) => ctx.photoCount >= 5,

  buddy_first: (ctx) => ctx.buddyCompletions >= 1,
  buddy_triple: (ctx) => ctx.buddyCompletions >= 3,
  summer_start: (ctx) => ctx.hasAnySummerActivity(),
  icecream_day: (ctx) => ctx.hasSummerActivity('iceCream'),
  swim_day: (ctx) => ctx.hasSummerActivity('swim'),
  reading_day: (ctx) => ctx.hasSummerActivity('pages'),
  icecream_three: (ctx) => (ctx.stats.totalIceCream || 0) >= 3,
  swim_three: (ctx) => (ctx.stats.totalSwim || 0) >= 3,
  reading_thirty: (ctx) => (ctx.stats.totalPages || 0) >= 30,
  summer_triple_week: (ctx) => ctx.maxSummerActivitiesInWeek >= 3,
  summer_allrounder: (ctx) => ctx.hasSummerActivity('iceCream') && ctx.hasSummerActivity('swim') && ctx.hasSummerActivity('pages'),
};

export function getEarnedStickers(user, stats) {
  const ctx = getStickerContext(user, stats);
  return STICKERS.filter((sticker) => STICKER_CONDITIONS[sticker.id]?.(ctx));
}
