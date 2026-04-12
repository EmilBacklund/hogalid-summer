export const CELEBRATION_LINES = {
  drive: [
    'Högalid F15 kör bara kör!',
    'Full fart framåt!',
    'F15 är dom bästa!',
    'Slay!',
    'Vi har seglat över havet, för att se det bästa laget, Högalid!',
    'Tagga till, tagga till, vi är Högalid!',
    '🎵 Hela natten, hela sommaren, Högalid kör på vårt sätt! 🎵',
    '🎵 Upp, upp, upp, nu är det vår stund, tillsammans glänser vi! 🎵',
  ],
  brudar: [
    'Vi är Högans brudar!',
    'Åååhh Högalid!',
    'Klappa, klappa nu, klappa för Högalid!',
    'F15 är dom bästa!',
    'Vi har seglat över havet, för att se det bästa laget, Högalid!',
    'Högalid åh Högalid, vi tackar motståndarna, å domaren var också bra, åh alla kämpa jättebra!',
    'Tagga till, tagga till, vi står aldrig still!',
    '🎵 Hey, nu kör vi, låt alla veta, vi vill bara spela boll! 🎵',
  ],
  hawaii: [
    'Vi ska till Hawaii!',
    'Åååhh Högalid!',
    'Full fart framåt!',
    'Slay!',
    '🎵 Gnarly sommar, gnarly lag, Högalid F15! 🎵',
    '🎵 Hela natten, hela sommaren, Högalid kör på vårt sätt! 🎵',
    '🎵 Upp, upp, upp, tillsammans blir vi gyllene! 🎵',
    '🎵 Hey, nu kör vi, låt alla veta, vi vill bara spela boll! 🎵',
  ],
};

export function getCelebrationLine(group, seed = '') {
  const lines = CELEBRATION_LINES[group] || [];
  if (lines.length === 0) return '';

  const source = `${group}:${seed}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }

  return lines[hash % lines.length];
}
