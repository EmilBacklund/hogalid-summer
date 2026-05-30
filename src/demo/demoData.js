// ─────────────────────────────────────────────────────────────────────────────
// Demo mode data — completely client-side, never touches the real database.
// All dates are generated relative to "today" so streaks always look current.
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a YYYY-MM-DD string for N days ago */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Returns most recent Monday on or before the given date string */
function weekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ── Placeholder photos as inline SVGs ────────────────────────────────────────

function svgPhoto(bg, emoji, label) {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">',
    `<rect width="400" height="400" fill="${bg}"/>`,
    `<text x="200" y="185" font-size="110" text-anchor="middle" dominant-baseline="middle">${emoji}</text>`,
    `<text x="200" y="320" font-size="28" font-family="sans-serif" font-weight="bold" fill="rgba(255,255,255,0.85)" text-anchor="middle">${label}</text>`,
    '</svg>',
  ].join('');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export const DEMO_PHOTOS = [
  {
    id: 1001,
    alias: 'ebba',
    uploaderName: 'Ebba',
    imageData: svgPhoto('#1a6b3a', '⚽', 'Träning i parken'),
    mimeType: 'image/svg+xml',
    weekStart: weekStart(daysAgo(3)),
    uploadedAt: daysAgo(3) + 'T14:22:00.000Z',
    date: daysAgo(3),
    status: 'approved',
  },
  {
    id: 1002,
    alias: 'maja',
    uploaderName: 'Maja',
    imageData: svgPhoto('#1e3a8a', '🍦', 'Förtjänad glass!'),
    mimeType: 'image/svg+xml',
    weekStart: weekStart(daysAgo(5)),
    uploadedAt: daysAgo(5) + 'T16:08:00.000Z',
    date: daysAgo(5),
    status: 'approved',
  },
  {
    id: 1003,
    alias: 'wilma',
    uploaderName: 'Wilma',
    imageData: svgPhoto('#7c2d12', '🦊', 'Hittade en räv!'),
    mimeType: 'image/svg+xml',
    weekStart: weekStart(daysAgo(8)),
    uploadedAt: daysAgo(8) + 'T10:45:00.000Z',
    date: daysAgo(8),
    status: 'approved',
  },
  {
    id: 1004,
    alias: 'demo',
    uploaderName: 'Provspelaren',
    imageData: svgPhoto('#4c1d95', '🥅', 'Mitt eget mål!'),
    mimeType: 'image/svg+xml',
    weekStart: weekStart(daysAgo(2)),
    uploadedAt: daysAgo(2) + 'T18:30:00.000Z',
    date: daysAgo(2),
    status: 'approved',
  },
];

// ── Avatar configs ─────────────────────────────────────────────────────────────

const AVATARS = {
  demo:  { skinColor: 'ecad80', hair: 'long02', hairColor: 'cb6820', eyes: 'variant04', eyebrows: 'variant02', mouth: 'variant26', glasses: null, earrings: null, features: null, backgroundColor: null },
  ebba:  { skinColor: 'f2d3b1', hair: 'long10', hairColor: '0e0e0e', eyes: 'variant01', eyebrows: 'variant07', mouth: 'variant22', glasses: null, earrings: null, features: null, backgroundColor: null },
  maja:  { skinColor: '9e5622', hair: 'long05', hairColor: '6a4e35', eyes: 'variant25', eyebrows: 'variant03', mouth: 'variant30', glasses: null, earrings: null, features: null, backgroundColor: null },
  wilma: { skinColor: 'ecad80', hair: 'long12', hairColor: 'b9a05f', eyes: 'variant11', eyebrows: 'variant13', mouth: 'variant27', glasses: null, earrings: null, features: null, backgroundColor: null },
  alva:  { skinColor: 'f2d3b1', hair: 'long07', hairColor: '796a45', eyes: 'variant04', eyebrows: 'variant02', mouth: 'variant22', glasses: 'variant02', earrings: null, features: null, backgroundColor: null },
  nora:  { skinColor: '763900', hair: 'long25', hairColor: '562306', eyes: 'variant19', eyebrows: 'variant07', mouth: 'variant26', glasses: null, earrings: null, features: null, backgroundColor: null },
};

// ── Helper: build a log entry ─────────────────────────────────────────────────

let logIdCounter = 9000;
function mkLog({ daysBack, exercises = [], bingo = false, bingoFootball = false, points }) {
  return {
    id: ++logIdCounter,
    date: daysAgo(daysBack),
    exercises,
    bingo,
    bingoFootball,
    points: points ?? exercises.reduce((s, e) => s + (e.points || 0), 0),
    minutes: exercises.find(e => e.id === 'fritraning')?.value || 0,
    iceCream: 0,
    swim: 0,
    pages: 0,
    title: '',
  };
}

// ── Demo user (the logged-in parent/tester) ───────────────────────────────────

export const DEMO_USER = {
  alias: 'demo',
  displayAlias: 'Provspelaren',
  displayName: '',
  role: 'demo',
  avatarConfig: AVATARS.demo,
  unlockedItems: ['midsommarkrans'],
  highscores: { jonglering: 45 },
  secretFlags: {},
  joinedAt: daysAgo(22),
  photoCount: 1,
  completedDaily: [],
  bingo: ['b13', 'b07', 'b19', 'b11', 'b20', 'b21'],
  bonusBingo: [],
  bingoTwo: [],
  adultBingo: [],
  logs: [
    // 5-day active streak (today → 4 days ago) — qualifying = ≥30 touch or ≥5 min free
    mkLog({ daysBack: 0,  exercises: [{ id: 'jonglering', value: 48, points: 0 }],                         points: 20 }),
    mkLog({ daysBack: 1,  exercises: [{ id: 'fritraning', value: 20, points: 0 }],                         points: 20 }),
    mkLog({ daysBack: 2,  exercises: [{ id: 'jonglering', value: 60, points: 0 }, { id: 'skott', value: 15, points: 0 }], points: 25 }),
    mkLog({ daysBack: 3,  exercises: [{ id: 'fritraning', value: 15, points: 0 }],                         points: 15 }),
    mkLog({ daysBack: 4,  exercises: [{ id: 'jonglering', value: 35, points: 0 }],                         points: 15 }),
    // Older sporadic logs
    mkLog({ daysBack: 7,  exercises: [{ id: 'fritraning', value: 30, points: 0 }],                         points: 30 }),
    mkLog({ daysBack: 10, exercises: [{ id: 'jonglering', value: 80, points: 0 }],                         points: 25 }),
    mkLog({ daysBack: 13, exercises: [{ id: 'skott', value: 20, points: 0 }, { id: 'fritraning', value: 20, points: 0 }], points: 30 }),
    mkLog({ daysBack: 16, exercises: [{ id: 'jonglering', value: 45, points: 0 }],                         points: 20 }),
    mkLog({ daysBack: 20, exercises: [{ id: 'fritraning', value: 60, points: 0 }],                         points: 50 }),
    // Bingo logs
    mkLog({ daysBack: 5,  bingo: true, bingoFootball: true, exercises: [],                                  points: 30 }), // b13 jonglera 5 i rad
    mkLog({ daysBack: 9,  bingo: true, bingoFootball: false, exercises: [],                                  points: 15 }), // b07 målgest
  ],
};

// ── Lag-kompolar ──────────────────────────────────────────────────────────────

function makeTeamUser(alias, displayAlias, avatarKey, daysBackPattern, bingoIds, unlockedItems = []) {
  return {
    alias,
    displayAlias,
    displayName: '',
    role: 'player',
    avatarConfig: AVATARS[avatarKey] || AVATARS.demo,
    unlockedItems,
    highscores: {},
    secretFlags: {},
    joinedAt: daysAgo(28),
    photoCount: 0,
    completedDaily: [],
    bingo: bingoIds,
    bonusBingo: [],
    bingoTwo: [],
    adultBingo: [],
    logs: daysBackPattern.map((d, i) => mkLog({
      daysBack: d,
      exercises: i % 3 === 0
        ? [{ id: 'fritraning', value: 20 + (i * 3), points: 0 }]
        : i % 3 === 1
          ? [{ id: 'jonglering', value: 30 + (i * 4), points: 0 }]
          : [{ id: 'skott', value: 10, points: 0 }, { id: 'fritraning', value: 10, points: 0 }],
      points: 15 + (i % 5) * 10,
    })),
  };
}

// Ebba — toppspelaren, 12-dagars streak
const ebbaDays = [0,1,2,3,4,5,6,7,8,9,10,11,14,17,20,23];
const EBBA = makeTeamUser('ebba', 'Ebba', 'ebba', ebbaDays,
  ['b01','b02','b03','b06','b07','b09','b11','b12','b13','b17','b18','b19','b22','b24','b26'],
  ['midsommarkrans', 'nya_munnar']);

// Patch Ebba's points to look impressive
EBBA.logs = EBBA.logs.map((l, i) => ({ ...l, points: [45,30,40,35,50,30,40,25,35,45,30,40,35,30,40,45][i] || 30 }));

// Maja — aktiv, 8-dagars streak
const majaDays = [0,1,2,3,4,5,6,7,10,13,16,19];
const MAJA = makeTeamUser('maja', 'Maja', 'maja', majaDays,
  ['b07','b11','b13','b17','b18','b19','b22','b26']);
MAJA.logs = MAJA.logs.map((l, i) => ({ ...l, points: [35,30,25,40,30,35,25,30,35,30,25,35][i] || 25 }));

// Wilma — jämn, 6-dagars streak
const wilmaDays = [0,1,2,3,4,5,9,12,15,18];
const WILMA = makeTeamUser('wilma', 'Wilma', 'wilma', wilmaDays,
  ['b07','b11','b18','b19','b22']);
WILMA.logs = WILMA.logs.map((l, i) => ({ ...l, points: [30,25,35,25,30,25,30,25,30,25][i] || 25 }));

// Alva — lite sporadisk, 4-dagars streak
const alvaDays = [0,1,2,3,7,11,15,19];
const ALVA = makeTeamUser('alva', 'Alva', 'alva', alvaDays,
  ['b07','b13','b19']);
ALVA.logs = ALVA.logs.map((l, i) => ({ ...l, points: [25,20,25,20,25,20,25,20][i] || 20 }));

// Nora — nybörjare, 2-dagars streak
const noraDays = [0,1,5,10];
const NORA = makeTeamUser('nora', 'Nora', 'nora', noraDays,
  ['b07','b19']);
NORA.logs = NORA.logs.map((l, i) => ({ ...l, points: [20,15,20,15][i] || 15 }));

// Export all team members (including demo user, just like the real /users endpoint)
export const DEMO_TEAM_USERS = [EBBA, MAJA, WILMA, { ...DEMO_USER }, ALVA, NORA];
