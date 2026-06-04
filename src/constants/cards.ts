// Collector cards — Swedish Women's National Team 2026
// Enriched with profile data from playerCards.ts
import { PLAYER_CARD_PROFILES, LEGEND_CARD_PROFILES } from './playerCards';
import type { Card, PlayerCardProfile } from '../types';

const PLAYER_FILES: string[] = [
  'Amanda_Ilestedt.jpg',
  'Amanda_Nildén.jpg',
  'Beata_Olsson.jpg',
  'Bella_Andersson.jpg',
  'Elma_Junttila_Nelhage.jpg',
  'Evelyn_Ijeh.jpg',
  'Felicia_Schröder.jpg',
  'Filippa_Angeldahl.jpg',
  'Fridolina_Rolfö.jpg',
  'Hanna_Bennison.jpg',
  'Hanna_Lundkvist.jpg',
  'Jennifer_Falk.jpg',
  'Johanna_Rytting_Kaneryd.jpg',
  'Julia_Zigiotti_Olme.jpg',
  'Matilda_Vinberg.jpg',
  'Monica_Jusu_Bah.jpg',
  'Rebecka_Blomqvist.jpg',
  'Rusul_Rosa_Kafaji.jpg',
  'Smilla_Holmberg.jpg',
  'Sofia_Reidy.jpg',
  'Stina_Blackstenius.jpg',
  'Tove_Enblom.jpg',
  'Zecira_Musovic.jpg',
];

// Build profile lookup by imageFile
const profileByFile: Record<string, PlayerCardProfile> = {};
for (const p of PLAYER_CARD_PROFILES) {
  profileByFile[p.imageFile] = p;
}

export const PLAYER_CARDS: Card[] = PLAYER_FILES.map((file, i) => {
  const profile = profileByFile[file];
  return {
    id: `card_${file.replace('.jpg', '').toLowerCase()}`,
    name: profile?.name || file.replace('.jpg', '').replace(/_/g, ' '),
    image: `/spelarbilder/${file}`,
    type: 'player',
    number: i + 1,
    position: profile?.position || null,
    club: profile?.currentClub || null,
    youthClub: profile?.youthClub || null,
    blurb: profile?.blurb || null,
  };
});

const LEGEND_EMOJIS = ['👑', '🏅', '⚡', '🔥', '🛡️', '⭐'];

export const LEGEND_CARDS: Card[] = LEGEND_CARD_PROFILES.map((profile, i) => ({
  id: profile.id,
  name: profile.name,
  image: `/spelarbilder/${profile.imageFile}`,
  type: 'legend',
  number: PLAYER_CARDS.length + i + 1,
  emoji: LEGEND_EMOJIS[i] || '👑',
  position: profile.position || null,
  club: profile.currentClub || null,
  youthClub: profile.youthClub || null,
  blurb: profile.blurb || null,
}));

export const ALL_CARDS: Card[] = [...PLAYER_CARDS, ...LEGEND_CARDS];

// Cost per card opening (in "coins" = points spent on cards).
export const CARD_PACK_COST = 350;
// Legend cards cost more — they're a bonus goal
export const LEGEND_PACK_COST = 500;

export const TOTAL_PLAYER_CARDS = PLAYER_CARDS.length;
export const TOTAL_LEGEND_CARDS = LEGEND_CARDS.length;
export const TOTAL_ALL_CARDS = ALL_CARDS.length;
