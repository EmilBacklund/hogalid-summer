import type { Badge } from '../types';

export const BADGES: Badge[] = [
  { id: 'streak7', label: 'Hel vecka!', icon: '💫', condition: (s) => s.maxStreak >= 7 },
  { id: 'streak14', label: 'Två veckor i rad!', icon: '🌠', condition: (s) => s.maxStreak >= 14 },
  {
    id: 'juggle50',
    label: '50 jonglingar i rad',
    icon: '🎪',
    condition: (s) => (s.exerciseHighscores?.jonglera || 0) >= 50,
  },
  {
    id: 'minutes300',
    label: '5 timmar totalt!',
    icon: '🏅',
    condition: (s) => s.totalMinutes >= 300,
  },
  { id: 'paparazzi', label: 'Paparazzi', icon: '🎞️', condition: (s) => (s.photoCount || 0) >= 10 },
  {
    id: 'allExercises',
    label: 'Testat allt!',
    icon: '🌟',
    condition: (s) => Object.keys(s.exerciseCounts || {}).length >= 7,
  },
  {
    id: 'bingo10',
    label: 'Bingomästare!',
    icon: '🟩',
    condition: (s) => (s.bingoCount || 0) >= 10,
  },
  {
    id: 'bingo20',
    label: 'Halvvägs till legenden!',
    icon: '🌈',
    condition: (s) => (s.bingoCount || 0) >= 20,
  },
  { id: 'bingo35', label: 'Sommaratlet!', icon: '🏆', condition: (s) => (s.bingoCount || 0) >= 35 },
  {
    id: 'bingo50',
    label: 'SOMMARLEGEND!',
    icon: '👑',
    condition: (s) => (s.bingoCount || 0) >= 50,
  },
  { id: 'bingoline', label: 'Bingolinje!', icon: '🎯', condition: (s) => (s.bingoLines || 0) >= 1 },
];
