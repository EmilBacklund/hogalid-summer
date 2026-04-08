// Collector cards — Swedish Women's National Team 2026
// Enriched with profile data from playerCards.js

import { PLAYER_CARD_PROFILES } from './playerCards';

const PLAYER_FILES = [
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
const profileByFile = {};
for (const p of PLAYER_CARD_PROFILES) {
  profileByFile[p.imageFile] = p;
}

export const PLAYER_CARDS = PLAYER_FILES.map((file, i) => {
  const profile = profileByFile[file] || {};
  return {
    id: `card_${file.replace('.jpg', '').toLowerCase()}`,
    name: profile.name || file.replace('.jpg', '').replace(/_/g, ' '),
    image: `/spelarbilder/${file}`,
    type: 'player',
    number: i + 1,
    position: profile.position || null,
    club: profile.currentClub || null,
    youthClub: profile.youthClub || null,
    blurb: profile.blurb || null,
  };
});

export const LEGEND_CARDS = [
  { id: 'legend_pia_sundhage',     name: 'Pia Sundhage',      type: 'legend', number: 24, emoji: '👑' },
  { id: 'legend_hanna_ljungberg',  name: 'Hanna Ljungberg',   type: 'legend', number: 25, emoji: '⚡' },
  { id: 'legend_caroline_seger',   name: 'Caroline Seger',    type: 'legend', number: 26, emoji: '🏅' },
  { id: 'legend_lotta_schelin',    name: 'Lotta Schelin',     type: 'legend', number: 27, emoji: '🔥' },
  { id: 'legend_hedvig_lindahl',   name: 'Hedvig Lindahl',    type: 'legend', number: 28, emoji: '🧤' },
];

export const ALL_CARDS = [...PLAYER_CARDS, ...LEGEND_CARDS];

// Cost per card opening (in "coins" = points spent on cards).
// ~1000 points/week earned by active player. 23 cards over 10 weeks =
// ~2.3 cards/week. 350 × 2.3 ≈ 805 coins/week, leaving ~200p/week for avatars.
export const CARD_PACK_COST = 350;

// Legend cards cost more — they're a bonus goal
export const LEGEND_PACK_COST = 500;

export const TOTAL_PLAYER_CARDS = PLAYER_CARDS.length; // 23
export const TOTAL_LEGEND_CARDS = LEGEND_CARDS.length;  // 5
export const TOTAL_ALL_CARDS = ALL_CARDS.length;         // 28
