import type { Exercise, SummerActivity } from '../types';

export const EXERCISES: Exercise[] = [
  { id: 'toetaps', label: 'Toe taps', unit: 'touch', color: '#f0dc00', max: 1000 },
  { id: 'tvafotare', label: 'Tvåfotare', unit: 'touch', color: '#60a5fa', max: 1000 },
  {
    id: 'jonglera',
    label: 'Jonglera',
    unit: 'touch',
    hasHighscore: true,
    color: '#f472b6',
    max: 500,
  },
  { id: 'suldrag', label: 'Suldrag', unit: 'touch', color: '#fb923c', max: 1000 },
  { id: 'cruyff', label: 'Cruyff-fint', unit: 'touch', color: '#a78bfa', max: 500 },
  { id: 'passningar', label: 'Passningar', unit: 'touch', color: '#ff9f9f', max: 500 },
  { id: 'skott', label: 'Skott', unit: 'st', color: '#fbbf24', max: 100 },
  { id: 'fritraning', label: 'Fri träning', unit: 'min', isTime: true, color: '#94a3b8', max: 180 },
];

export const SUMMER_ACTIVITIES: SummerActivity[] = [
  { id: 'iceCream', label: 'Glass', icon: '🍦', unit: 'glassar', color: '#f9a8d4', max: 10 },
  { id: 'swim', label: 'Bad', icon: '🏊', unit: 'gånger', color: '#60a5fa', max: 10 },
  { id: 'pages', label: 'Läsning', icon: '📖', unit: 'sidor', color: '#86efac', max: 500 },
];
