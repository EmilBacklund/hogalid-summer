export const CELEBRATION_LINES = {
  drive: [
    'Högalid F15 kör bara kör!',
    'Full fart framåt!',
    'F15 är dom bästa!',
    'Slay!',
  ],
  brudar: [
    'Vi är Högans brudar!',
    'Åååhh Högalid!',
    'Klappa, klappa nu, klappa för Högalid!',
    'F15 är dom bästa!',
  ],
  hawaii: [
    'Vi ska till Hawaii!',
    'Åååhh Högalid!',
    'Full fart framåt!',
    'Slay!',
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
