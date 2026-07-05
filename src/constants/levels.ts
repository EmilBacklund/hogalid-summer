// Individual levels — 29 levels across 12 weeks
// Poäng = touch + minuter*5. En flitig spelare (~1h/dag, 5 dagar/v) gör
// ~700 touch + 60 min = ~1000 p/vecka = ~12 000 p på 12 veckor.
//
// Nivå 1–20 är grundstegen (max 19 050). Prestige-nivåerna däröver lades
// till vid halvtid sommaren 2026, kalibrerade mot verklig aktivitet: toppen
// hade då ~43 000 p och var på väg mot ~65–70 000 till säsongsslut. Sista
// nivån (68 000) ska bara vara nåbar för den som håller full fart hela vägen.
import type { Level, TeamLevel } from '../types';

export const LEVELS: Level[] = [
  { name: 'Nybörjare', min: 0, icon: '⚽' },
  { name: 'Bollvän', min: 150, icon: '🌱' },
  { name: 'Övningsproffs', min: 350, icon: '👟' },
  { name: 'Fötterna vaknar', min: 650, icon: '💫' },
  { name: 'Dribblerska', min: 1050, icon: '🌀' },
  { name: 'Bollkonstnär', min: 1550, icon: '🎨' },
  { name: 'Passningskung', min: 2150, icon: '🎯' },
  { name: 'Fintmästare', min: 2850, icon: '🦊' },
  { name: 'Touchmaskin', min: 3650, icon: '⚙️' },
  { name: 'Skottdrottning', min: 4550, icon: '💥' },
  { name: 'Suldragerska', min: 5550, icon: '🐍' },
  { name: 'Cruyff-legend', min: 6650, icon: '✨' },
  { name: 'Jongleringsfé', min: 7850, icon: '🎪' },
  { name: 'Planstyrare', min: 9150, icon: '🧭' },
  { name: 'Sommarmästare', min: 10550, icon: '🏅' },
  { name: 'Superproffs', min: 12050, icon: '🔥' },
  { name: 'Elitspelaren', min: 13650, icon: '⭐' },
  { name: 'Fotbollsgeni', min: 15350, icon: '🧠' },
  { name: 'Legendstatus', min: 17150, icon: '👑' },
  { name: 'Sommarlegend', min: 19050, icon: '🏆' },
  // ── Prestige-nivåer ──────────────────────────────────────────────────────
  { name: 'Världsstjärna', min: 21000, icon: '🌍' },
  { name: 'Diamantbollen', min: 24500, icon: '💎' },
  { name: 'Kometen', min: 28500, icon: '☄️' },
  { name: 'Supernova', min: 33000, icon: '🎆' },
  { name: 'Sommar-GOAT', min: 38000, icon: '🐐' },
  { name: 'Utomjordisk', min: 44000, icon: '🛸' },
  { name: 'Ostoppbar', min: 51000, icon: '🚀' },
  { name: 'Odödlig', min: 59000, icon: '⚡' },
  { name: 'Alla tiders sommarlegend', min: 68000, icon: '🌟' },
];

// Team levels — based on combined (touch + min*5) from ALL players
// 12 spelare × ~900-1100 p/v × 12 v = ~130 000-158 000 p totalt möjligt
export const TEAM_LEVELS: TeamLevel[] = [
  { name: 'Nybörjarlaget', min: 0, icon: '🌱', color: '#94a3b8' },
  { name: 'Träningsgänget', min: 800, icon: '👟', color: '#dc2828' },
  { name: 'Bollkompisarna', min: 2200, icon: '🤝', color: '#003a8c' },
  { name: 'Sommarklubben', min: 4500, icon: '☀️', color: '#eab308' },
  { name: 'Fintgänget', min: 8000, icon: '🦊', color: '#f97316' },
  { name: 'Touchlaget', min: 12500, icon: '⚙️', color: '#06b6d4' },
  { name: 'Drömteamet', min: 18500, icon: '💫', color: '#8b5cf6' },
  { name: 'Legendlaget', min: 26000, icon: '🔥', color: '#ef4444' },
  { name: 'Mästarlaget', min: 36000, icon: '👑', color: '#fbbf24' },
  { name: 'Odödliga laget', min: 50000, icon: '🏆', color: '#f0dc00' },
  { name: 'Galaktiska laget', min: 68000, icon: '🌟', color: '#f0dc00' },
  { name: 'Sommarlegenderna', min: 118000, icon: '⚡', color: '#fff' },
];
