export const BADGES = [
  { id: "first_log",    label: "Första träningen!",   icon: "🎉", condition: (s) => s.totalLogs >= 1 },
  { id: "streak3",      label: "3 dagar i rad",        icon: "🔥", condition: (s) => s.maxStreak >= 3 },
  { id: "streak7",      label: "Hel vecka!",           icon: "💫", condition: (s) => s.maxStreak >= 7 },
  { id: "juggle50",     label: "50 jonglingar i rad",  icon: "🎪", condition: (s) => (s.exerciseHighscores?.jonglera || 0) >= 50 },
  { id: "minutes60",    label: "60 minuter tränat",    icon: "⏱️", condition: (s) => s.totalMinutes >= 60 },
  { id: "minutes300",   label: "5 timmar totalt!",     icon: "🏅", condition: (s) => s.totalMinutes >= 300 },
  { id: "allExercises", label: "Testat allt!",         icon: "🌟", condition: (s) => Object.keys(s.exerciseCounts || {}).length >= 7 },
  { id: "bingo5",       label: "5 utmaningar klara!",  icon: "✅", condition: (s) => (s.bingoCount || 0) >= 5 },
  { id: "bingo10",      label: "Bingomästare!",        icon: "🟩", condition: (s) => (s.bingoCount || 0) >= 10 },
  { id: "bingo20",      label: "Halvvägs till legenden!", icon: "🌈", condition: (s) => (s.bingoCount || 0) >= 20 },
  { id: "bingo35",      label: "Sommaratlet!",         icon: "🏆", condition: (s) => (s.bingoCount || 0) >= 35 },
  { id: "bingo50",      label: "SOMMARLEGEND!",        icon: "👑", condition: (s) => (s.bingoCount || 0) >= 50 },
];
