import { EXERCISES, BINGO } from '../constants';
import { localToday } from './date';

export function computeStats(user) {
  const logs = user.logs || [];
  const totalPoints = logs.reduce((s, l) => s + (l.points || 0), 0);
  // Only count actual logged free-training minutes, not touch-derived
  const totalMinutes = logs.reduce((s, l) => {
    const freeEx = (l.exercises || []).find(e => e.id === "fritraning");
    return s + (freeEx ? freeEx.value : 0);
  }, 0);
  const totalLogs = logs.length;
  const exerciseCounts = {};
  const exerciseHighscores = { ...user.highscores };
  let totalTouch = 0;
  logs.forEach((l) => {
    (l.exercises || []).forEach((e) => {
      exerciseCounts[e.id] = (exerciseCounts[e.id] || 0) + (e.value || 0);
      const ex = EXERCISES.find(x => x.id === e.id);
      if (ex && !ex.isTime && e.id !== "skott") totalTouch += (e.value || 0);
    });
  });
  // streak — only count logs that meet the minimum threshold (5 min OR 30 touch)
  // OR football bingo (cat ⚽)
  const qualifyingDays = [...new Set(logs.filter(l => {
    if (l.bingoFootball) return true; // football bingo counts
    if (l.bingo) return false;        // non-football bingo doesn't count
    const mins = (l.exercises || []).find(e => e.id === "fritraning")?.value || 0;
    const touch = (l.exercises || []).reduce((s, e) => {
      const ex = EXERCISES.find(x => x.id === e.id);
      return s + (ex && !ex.isTime && e.id !== "skott" ? (e.value || 0) : 0);
    }, 0);
    return mins >= 5 || touch >= 30;
  }).map(l => l.date))].sort();
  let streak = 0, maxStreak = 0, cur = 0;
  const today = localToday();
  for (let i = 0; i < qualifyingDays.length; i++) {
    if (i === 0) { cur = 1; }
    else {
      const prev = new Date(qualifyingDays[i - 1]);
      const curr = new Date(qualifyingDays[i]);
      const diff = (curr - prev) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    }
    if (cur > maxStreak) maxStreak = cur;
  }
  if (qualifyingDays.length > 0) {
    const last = new Date(qualifyingDays[qualifyingDays.length - 1]);
    const todayD = new Date(today);
    const diff = (todayD - last) / 86400000;
    streak = diff <= 1 ? cur : 0;
  }
  const bingoCount = (user.bingo || []).length;

  // Bingo line completions (10 cols × 5 rows)
  const bingoDoneSet = new Set(user.bingo || []);
  let bingoLines = 0;
  for (let row = 0; row < 5; row++) {
    if (Array.from({ length: 10 }, (_, c) => BINGO[row * 10 + c]).every(b => b && bingoDoneSet.has(b.id))) bingoLines++;
  }
  for (let col = 0; col < 10; col++) {
    if (Array.from({ length: 5 }, (_, r) => BINGO[r * 10 + col]).every(b => b && bingoDoneSet.has(b.id))) bingoLines++;
  }

  // Summer activity totals
  const totalIceCream = logs.reduce((s, l) => s + (l.iceCream || 0), 0);
  const totalSwim     = logs.reduce((s, l) => s + (l.swim || 0), 0);
  const totalPages    = logs.reduce((s, l) => s + (l.pages || 0), 0);
  const photoCount    = user.photoCount || 0;

  // Summer streaks — days in a row with at least 1 of each activity
  function calcSummerStreak(field) {
    const days = [...new Set(logs.filter(l => (l[field] || 0) >= 1).map(l => l.date))].sort();
    let cur = 0;
    for (let i = 0; i < days.length; i++) {
      cur = i === 0 ? 1 : (new Date(days[i]) - new Date(days[i - 1])) / 86400000 === 1 ? cur + 1 : 1;
    }
    if (days.length === 0) return 0;
    return (new Date(today) - new Date(days[days.length - 1])) / 86400000 <= 1 ? cur : 0;
  }
  const iceCreamStreak = calcSummerStreak('iceCream');
  const swimStreak     = calcSummerStreak('swim');
  const readStreak     = calcSummerStreak('pages');

  return { totalPoints, totalMinutes, totalLogs, totalTouch, exerciseCounts, exerciseHighscores, streak, maxStreak, bingoCount, bingoLines, totalIceCream, totalSwim, totalPages, photoCount, iceCreamStreak, swimStreak, readStreak };
}
