// Options available to all players from registration
export const STARTER_OPTIONS = {
  hair: [
    'long01',
    'long02',
    'long04',
    'long05',
    'long07',
    'long09',
    'long10',
    'long12',
    'long25',
    'short19',
  ],
  hairColor: ['0e0e0e', '6a4e35', '796a45', '562306', 'ac6511', 'b9a05f', 'cb6820', 'e5d7a3'],
  skinColor: ['9e5622', '763900', 'ecad80', 'f2d3b1'],
  eyes: ['variant01', 'variant04', 'variant11', 'variant19', 'variant25'],
  eyebrows: ['variant02', 'variant03', 'variant07', 'variant13'],
  mouth: ['variant02', 'variant22', 'variant26', 'variant27', 'variant30'],
  glasses: ['variant02', 'variant03', 'variant04', 'variant05'],
};

// Reward tiers — each unlocks new options in one or more categories
export const AVATAR_REWARDS = [
  {
    id: 'midsommarkrans',
    label: 'Midsommarkrans',
    cost: 100,
    unlocks: { hair: ['long08'] },
  },
  {
    id: 'nya_munnar',
    label: 'Nya munnar',
    cost: 200,
    unlocks: {
      mouth: [
        'variant01',
        'variant03',
        'variant04',
        'variant05',
        'variant06',
        'variant07',
        'variant08',
        'variant09',
        'variant10',
        'variant11',
        'variant12',
        'variant13',
        'variant14',
        'variant15',
        'variant16',
        'variant17',
        'variant18',
        'variant19',
        'variant20',
        'variant21',
        'variant23',
        'variant24',
        'variant25',
        'variant28',
        'variant29',
      ],
    },
  },
  {
    id: 'bakgrundsfarg',
    label: 'Bakgrundsfärg',
    cost: 300,
    unlocks: { backgroundColor: ['dba3be', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'] },
  },
  {
    id: 'nya_ogonbryn',
    label: 'Nya ögonbryn',
    cost: 450,
    unlocks: {
      eyebrows: [
        'variant01',
        'variant04',
        'variant05',
        'variant06',
        'variant08',
        'variant09',
        'variant10',
        'variant11',
        'variant12',
        'variant14',
        'variant15',
      ],
    },
  },
  {
    id: 'nya_frisyrer',
    label: 'Nya frisyrer',
    cost: 600,
    unlocks: {
      hair: [
        'long03',
        'long06',
        'long11',
        'long13',
        'long14',
        'long15',
        'long16',
        'long17',
        'long18',
        'long19',
        'long20',
        'long21',
        'long22',
        'long23',
        'long24',
        'long26',
      ],
    },
  },
  {
    id: 'nya_ogon',
    label: 'Nya ögon',
    cost: 800,
    unlocks: {
      eyes: [
        'variant02',
        'variant03',
        'variant05',
        'variant06',
        'variant07',
        'variant08',
        'variant09',
        'variant10',
        'variant12',
        'variant13',
        'variant14',
        'variant15',
        'variant16',
        'variant17',
        'variant18',
        'variant20',
        'variant21',
        'variant22',
        'variant23',
        'variant24',
        'variant26',
      ],
    },
  },
  {
    id: 'nya_harfarger',
    label: 'Nya hårfärger',
    cost: 1000,
    unlocks: { hairColor: ['3eac2c', '85c2c6', '592454', 'ab2a18', 'afafaf', 'dba3be'] },
  },
  {
    id: 'orhangen',
    label: 'Örhängen',
    cost: 1300,
    unlocks: {
      earrings: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06'],
    },
  },
  {
    id: 'ansiktsdrag',
    label: 'Ansiktsdrag',
    cost: 1600,
    unlocks: { features: ['birthmark', 'blush', 'freckles', 'mustache'] },
  },
  {
    id: 'solglasogon',
    label: 'Solglasögon',
    cost: 2000,
    unlocks: { glasses: ['variant01'] },
  },
];

// Category display names and types (for UI rendering)
export const CATEGORIES = [
  { key: 'hair', label: 'Frisyr', type: 'variant', alwaysVisible: true },
  { key: 'hairColor', label: 'Hårfärg', type: 'color', alwaysVisible: true },
  { key: 'eyes', label: 'Ögon', type: 'variant', alwaysVisible: true },
  { key: 'skinColor', label: 'Hudfärg', type: 'color', alwaysVisible: true },
  { key: 'eyebrows', label: 'Ögonbryn', type: 'variant', alwaysVisible: true },
  { key: 'mouth', label: 'Mun', type: 'variant', alwaysVisible: true },
  { key: 'glasses', label: 'Glasögon', type: 'variant', alwaysVisible: true },
  { key: 'backgroundColor', label: 'Bakgrund', type: 'color', alwaysVisible: false },
  { key: 'earrings', label: 'Örhängen', type: 'variant', alwaysVisible: false },
  { key: 'features', label: 'Ansiktsdrag', type: 'variant', alwaysVisible: false },
];

// Generate a random avatar config from starter options
export function randomAvatarConfig() {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return {
    skinColor: pick(STARTER_OPTIONS.skinColor),
    hair: pick(STARTER_OPTIONS.hair),
    hairColor: pick(STARTER_OPTIONS.hairColor),
    eyes: pick(STARTER_OPTIONS.eyes),
    eyebrows: pick(STARTER_OPTIONS.eyebrows),
    mouth: pick(STARTER_OPTIONS.mouth),
    glasses: null,
    earrings: null,
    features: null,
    backgroundColor: null,
  };
}

// Get available options for a category: { starter: [...], unlocked: [...] }
export function getAvailableOptions(categoryKey, unlockedItems = []) {
  const starter = STARTER_OPTIONS[categoryKey] || [];
  const unlocked = [];

  for (const reward of AVATAR_REWARDS) {
    if (unlockedItems.includes(reward.id) && reward.unlocks[categoryKey]) {
      unlocked.push(...reward.unlocks[categoryKey]);
    }
  }

  return { starter, unlocked };
}

// Check if a category has any available options (starter or unlocked)
export function isCategoryAvailable(categoryKey, unlockedItems = []) {
  const { starter, unlocked } = getAvailableOptions(categoryKey, unlockedItems);
  return starter.length > 0 || unlocked.length > 0;
}
