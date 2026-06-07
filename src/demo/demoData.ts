// Demo-mode fixtures. These never touch the backend — every value here is
// served by `demoHandle` (see demoMode.ts) when the demo flag is active, so the
// real API is physically unreachable while a visitor explores the app.
//
// IMPORTANT: photo `url`s MUST be inline `data:` URIs. The real album points
// `Photo.url` at the auth-gated `/api/photos/:id` route, which a demo session
// can never reach — so we embed the bytes directly to keep <img> tags offline.

import type { Config, Log, PhotosPage, User } from '@/types';

/** YYYY-MM-DD for `offset` days before today (0 = today), in local time. */
function dayAgo(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

let nextLogId = 1;
function log(offset: number, partial: Partial<Log> & { exercises: Log['exercises'] }): Log {
  const date = dayAgo(offset);
  const points = partial.points ?? 0;
  return {
    id: nextLogId++,
    date,
    exercises: partial.exercises,
    points,
    minutes: partial.minutes ?? 0,
    bingo: partial.bingo ?? false,
    bingoFootball: partial.bingoFootball ?? false,
    dailyChallenge: partial.dailyChallenge ?? false,
    iceCream: partial.iceCream ?? 0,
    swim: partial.swim ?? 0,
    pages: partial.pages ?? 0,
    title: partial.title ?? '',
    createdAt: `${date}T18:00:00.000Z`,
  };
}

// A six-day streak ending today, with a mix of touches, free training and
// summer activities so every stat card on the home screen has something to show.
const DEMO_LOGS: Log[] = [
  log(0, {
    title: 'Toe taps i parken',
    exercises: [
      { id: 'toetaps', value: 120 },
      { id: 'fritraning', value: 20 },
    ],
    points: 60,
    iceCream: 1,
    swim: 1,
  }),
  log(1, {
    title: 'Jonglering',
    exercises: [
      { id: 'jonglera', value: 45 },
      { id: 'passningar', value: 100 },
    ],
    points: 55,
    pages: 30,
  }),
  log(2, {
    title: 'Skott mot mål',
    exercises: [
      { id: 'skott', value: 20 },
      { id: 'fritraning', value: 30 },
    ],
    points: 50,
    swim: 1,
  }),
  log(3, {
    title: 'Cruyff-fint',
    exercises: [
      { id: 'cruyff', value: 60 },
      { id: 'suldrag', value: 80 },
    ],
    points: 45,
    iceCream: 1,
  }),
  log(4, {
    title: 'Fri träning med kompis',
    exercises: [{ id: 'fritraning', value: 45 }],
    points: 40,
    bingoFootball: true,
    pages: 50,
  }),
  log(5, {
    title: 'Tvåfotare',
    exercises: [
      { id: 'tvafotare', value: 150 },
      { id: 'toetaps', value: 100 },
    ],
    points: 65,
    swim: 1,
  }),
];

/** The demo player. role 'player' so it behaves like a normal account. */
export const DEMO_USER: User = {
  alias: 'demo',
  role: 'player',
  displayAlias: 'Demo',
  displayName: 'Demo Förälder',
  avatarConfig: {
    hair: 'long05',
    hairColor: '6a4e35',
    skinColor: 'ecad80',
    eyes: 'variant04',
    eyebrows: 'variant03',
    mouth: 'variant22',
    glasses: null,
  },
  unlockedItems: [],
  highscores: { jonglera: 45 },
  secretFlags: {},
  joinedAt: dayAgo(6),
  photoCount: 2,
  logs: DEMO_LOGS,
  bingo: ['b01', 'b11', 'b40', 'b39', 'b03'],
  bonusBingo: [],
  bingoTwo: [],
  adultBingo: [],
  completedDaily: { [dayAgo(0)]: 'd01' },
};

/** A small team so the leaderboard and team screens look alive. */
function teammate(alias: string, displayAlias: string, points: number, bingo: string[]): User {
  return {
    alias,
    role: 'player',
    displayAlias,
    avatarConfig: {},
    unlockedItems: [],
    highscores: {},
    secretFlags: {},
    joinedAt: dayAgo(6),
    photoCount: 0,
    logs: [
      log(0, {
        title: '',
        exercises: [{ id: 'toetaps', value: Math.round(points / 2) }],
        points,
      }),
    ],
    bingo,
    bonusBingo: [],
    bingoTwo: [],
    adultBingo: [],
    completedDaily: {},
  };
}

export const DEMO_TEAM_USERS: User[] = [
  DEMO_USER,
  teammate('astrid', 'Astrid', 420, ['b01', 'b02', 'b11', 'b12', 'b40', 'b39']),
  teammate('vera', 'Vera', 360, ['b01', 'b11', 'b40']),
  teammate('siri', 'Siri', 295, ['b03', 'b40', 'b39', 'b41']),
  teammate('ebba', 'Ebba', 240, ['b01', 'b40']),
  teammate('nova', 'Nova', 180, ['b40']),
];

// Inline SVG "photos" so the album renders without ever hitting the backend.
function svgPhoto(bg: string, emoji: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${bg}"/><text x="50%" y="50%" font-size="180" text-anchor="middle" dominant-baseline="central">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEMO_PHOTOS: PhotosPage = {
  photos: [
    {
      id: 1,
      alias: 'astrid',
      uploaderName: 'Astrid',
      mimeType: 'image/svg+xml',
      weekStart: dayAgo(2),
      uploadedAt: `${dayAgo(1)}T12:00:00.000Z`,
      date: dayAgo(1),
      url: svgPhoto('#1d4ed8', '⚽'),
      status: 'approved',
    },
    {
      id: 2,
      alias: 'demo',
      uploaderName: 'Demo Förälder',
      mimeType: 'image/svg+xml',
      weekStart: dayAgo(5),
      uploadedAt: `${dayAgo(3)}T15:30:00.000Z`,
      date: dayAgo(3),
      url: svgPhoto('#0e7490', '🏊'),
      status: 'approved',
    },
  ],
  nextOffset: null,
};

export const DEMO_CONFIG: Config = {
  seasonStart: dayAgo(6),
  countdownDate: null,
};
