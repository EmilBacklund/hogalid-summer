import { useState, useEffect, useMemo } from "react";

const CLUB_LOGO = "data:image/png;base64,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";

// Returnerar dagens datum i lokal tid som YYYY-MM-DD
function localToday() {
  const d = new Date();
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

// ── Palette & helpers ──────────────────────────────────────────────────────────
const COLORS = {
  // Högalid IF brand colors (exact from logo)
  red:       "#dc2828",   // logo red — primary background
  navy:      "#002864",   // logo navy blue — cards, headers
  yellow:    "#f0dc00",   // logo yellow — accents, highlights
  white:     "#ffffff",

  // Aliases used throughout the app
  grass:      "#002864",  // was green, now navy
  grassLight: "#003a8c",  // lighter navy
  lime:       "#f0dc00",  // was lime green, now yellow
  limeGlow:   "#ffe533",
  sky:        "#e8eef8",
  dark:       "#001540",  // deep navy for backgrounds
  mid:        "#dc2828",  // red mid-tone
  card:       "rgba(255,255,255,0.10)",
  cardHover:  "rgba(255,255,255,0.18)",
  accent:     "#f0dc00",  // yellow
  accentPink: "#ff6b6b",  // softened red accent (was pink)
  streak:     "#f0dc00",  // yellow for streaks
};

// Individual levels — 20 levels across 12 weeks
// Poäng = touch + minuter*5. En flitig spelare (~1h/dag, 5 dagar/v) gör
// ~700 touch + 60 min = ~1000 p/vecka = ~12 000 p på 12 veckor.
// Nivå 20 kräver 11 500 p → nåbart men kräver hela sommaren.
const LEVELS = [
  { name: "Nybörjare",       min: 0,     icon: "⚽" },
  { name: "Bollvän",         min: 150,   icon: "🌱" },
  { name: "Övningsproffs",   min: 350,   icon: "👟" },
  { name: "Fötterna vaknar", min: 650,   icon: "💫" },
  { name: "Dribblerska",     min: 1050,  icon: "🌀" },
  { name: "Bollkonstnär",    min: 1550,  icon: "🎨" },
  { name: "Passningskung",   min: 2150,  icon: "🎯" },
  { name: "Fintmästare",     min: 2850,  icon: "🦊" },
  { name: "Touchmaskin",     min: 3650,  icon: "⚙️" },
  { name: "Skottdrottning",  min: 4550,  icon: "💥" },
  { name: "Suldragerska",    min: 5550,  icon: "🐍" },
  { name: "Cruyff-legend",   min: 6650,  icon: "✨" },
  { name: "Jongleringsfé",   min: 7850,  icon: "🎪" },
  { name: "Planstyrare",     min: 9150,  icon: "🧭" },
  { name: "Sommarmästare",   min: 10550, icon: "🏅" },
  { name: "Superproffs",     min: 12050, icon: "🔥" },
  { name: "Elitspelaren",    min: 13650, icon: "⭐" },
  { name: "Fotbollsgeni",    min: 15350, icon: "🧠" },
  { name: "Legendstatus",    min: 17150, icon: "👑" },
  { name: "Sommarlegend",    min: 19050, icon: "🏆" },
];

// Team levels — based on combined (touch + min*5) from ALL players
// 12 spelare × ~1000 p/v × 12 v = ~144 000 p totalt möjligt
const TEAM_LEVELS = [
  { name: "Nybörjarlaget",      min: 0,      icon: "🌱", color: "#94a3b8" },
  { name: "Träningsgänget",     min: 500,    icon: "👟", color: "#dc2828" },
  { name: "Bollkompisarna",     min: 1500,   icon: "🤝", color: "#003a8c" },
  { name: "Sommarklubben",      min: 3000,   icon: "☀️", color: "#eab308" },
  { name: "Fintgänget",         min: 5500,   icon: "🦊", color: "#f97316" },
  { name: "Touchlaget",         min: 9000,   icon: "⚙️", color: "#06b6d4" },
  { name: "Drömteamet",         min: 14000,  icon: "💫", color: "#8b5cf6" },
  { name: "Legendlaget",        min: 21000,  icon: "🔥", color: "#ef4444" },
  { name: "Mästarlaget",        min: 30000,  icon: "👑", color: "#fbbf24" },
  { name: "Odödliga laget",     min: 42000,  icon: "🏆", color: "#f0dc00" },
  { name: "Galaktiska laget",   min: 57000,  icon: "🌟", color: "#f0dc00" },
  { name: "Sommarlegenderna",   min: 75000,  icon: "⚡", color: "#fff" },
];

const BADGES = [
  { id: "first_log",    label: "Första träningen!",   icon: "🎉", condition: (s) => s.totalLogs >= 1 },
  { id: "streak3",      label: "3 dagar i rad",        icon: "🔥", condition: (s) => s.maxStreak >= 3 },
  { id: "streak7",      label: "Hel vecka!",           icon: "💫", condition: (s) => s.maxStreak >= 7 },
  { id: "juggle50",     label: "50 jonglingar i rad",  icon: "🎪", condition: (s) => (s.exerciseHighscores?.jonglera || 0) >= 50 },
  { id: "minutes60",    label: "60 minuter tränat",    icon: "⏱️", condition: (s) => s.totalMinutes >= 60 },
  { id: "minutes300",   label: "5 timmar totalt!",     icon: "🏅", condition: (s) => s.totalMinutes >= 300 },
  { id: "allExercises", label: "Testat allt!",         icon: "🌟", condition: (s) => Object.keys(s.exerciseCounts || {}).length >= 7 },
  { id: "bingo5",       label: "5 utmaningar klara!",  icon: "✅", condition: (s) => (s.bingoCount || 0) >= 5 },
  { id: "bingo10",      label: "Bingomästare!",        icon: "🟩", condition: (s) => (s.bingoCount || 0) >= 10 },
  { id: "bingo20",      label: "Halvvägs till legenden!", icon: "🌈", condition: (s) => (s.bingoCount || 0) >= 20 },
  { id: "bingo35",      label: "Sommaratlet!",         icon: "🏆", condition: (s) => (s.bingoCount || 0) >= 35 },
  { id: "bingo50",      label: "SOMMARLEGEND!",        icon: "👑", condition: (s) => (s.bingoCount || 0) >= 50 },
];

// ── Sommarlovsbingo ────────────────────────────────────────────────────────────
// ⚽ = fotboll/idrott   ☀️ = sommar
const BINGO = [
  // FOTBOLL & IDROTT (35 st)
  { id: "b01", cat: "⚽", label: "Slå 10 straffar med höger fot",          points: 30 },
  { id: "b02", cat: "⚽", label: "Slå 10 straffar med vänster fot",         points: 30 },
  { id: "b03", cat: "⚽", label: "Jonglera i 20 minuter (totalt)",          points: 40 },
  { id: "b04", cat: "⚽", label: "Stå i mål och gör 10 räddningar",         points: 35 },
  { id: "b05", cat: "⚽", label: "Träffa ribban 10 gånger",                 points: 40 },
  { id: "b06", cat: "⚽", label: "Passa 100 passningar med någon",          points: 35 },
  { id: "b07", cat: "⚽", label: "Öva in en målgest",                       points: 20 },
  { id: "b08", cat: "⚽", label: "Kom på en ny hejaramsa till laget",       points: 25 },
  { id: "b09", cat: "⚽", label: "Se en hel VM-match utan att scrolla",     points: 30 },
  { id: "b10", cat: "⚽", label: "Dribbla runt 10 koner utan att missa",    points: 35 },
  { id: "b11", cat: "⚽", label: "Gör 50 toe taps utan paus",               points: 30 },
  { id: "b12", cat: "⚽", label: "Gör 50 tvåfotare utan paus",              points: 30 },
  { id: "b13", cat: "⚽", label: "Jonglera 10 gånger i rad",                points: 30 },
  { id: "b14", cat: "⚽", label: "Jonglera 25 gånger i rad",                points: 50 },
  { id: "b15", cat: "⚽", label: "Gör en Cruyff-fint 20 gånger",            points: 30 },
  { id: "b16", cat: "⚽", label: "Gör 50 suldrag (höger + vänster)",        points: 30 },
  { id: "b17", cat: "⚽", label: "Skjut 20 skott mot mål",                  points: 25 },
  { id: "b18", cat: "⚽", label: "Spela fotboll utomhus i 1 timme",         points: 40 },
  { id: "b19", cat: "⚽", label: "Träna med en kompis",                     points: 25 },
  { id: "b20", cat: "⚽", label: "Stå på höger ben i minst 1 minut",        points: 20 },
  { id: "b21", cat: "⚽", label: "Stå på vänster ben i minst 1 minut",      points: 20 },
  { id: "b22", cat: "⚽", label: "Gör plankan i 45 sekunder",               points: 30 },
  { id: "b23", cat: "⚽", label: "Gör 10 benböj, 10 utfallssteg, 10 upphop", points: 30 },
  { id: "b24", cat: "⚽", label: "Jogga 2 km med en vuxen",                 points: 35 },
  { id: "b25", cat: "⚽", label: "Gör 10 kullerbyttor",                     points: 20 },
  { id: "b26", cat: "⚽", label: "Spela en match (träning eller cupen)",     points: 40 },
  { id: "b27", cat: "⚽", label: "Lär dig en ny trick med bollen",          points: 35 },
  { id: "b28", cat: "⚽", label: "Testa att spela med bara vänsterfoten 10 min", points: 30 },
  { id: "b29", cat: "⚽", label: "Öva nick mot en vägg eller kompis 20 ggr", points: 30 },
  { id: "b30", cat: "⚽", label: "Gör 100 hopp med hopprep",                points: 25 },
  { id: "b31", cat: "⚽", label: "Balansera bollen på foten i 10 sekunder", points: 35 },
  { id: "b32", cat: "⚽", label: "Spela barefoot fotboll på gräs",          points: 20 },
  { id: "b33", cat: "⚽", label: "Titta på ett proffslags träning på YouTube", points: 20 },
  { id: "b34", cat: "⚽", label: "Lär ut en rörelse till någon annan",      points: 30 },
  { id: "b35", cat: "⚽", label: "Gör 3 träningspass i samma vecka",        points: 45 },
  // SOMMAR (15 st)
  { id: "b36", cat: "☀️", label: "Bada 3 gånger på en dag",                points: 25 },
  { id: "b37", cat: "☀️", label: "Plocka ett strå med smultron",            points: 20 },
  { id: "b38", cat: "☀️", label: "Plantera något (blomma, grönsak, frö…)",  points: 25 },
  { id: "b39", cat: "☀️", label: "Läs en bok (minst 50 sidor)",             points: 25 },
  { id: "b40", cat: "☀️", label: "Ät en glass utomhus",                     points: 15 },
  { id: "b41", cat: "☀️", label: "Cykla på en grusväg",                     points: 20 },
  { id: "b42", cat: "☀️", label: "Sov utomhus (tält, hängmatta, trappa…)", points: 30 },
  { id: "b43", cat: "☀️", label: "Hitta och titta på ett djur i naturen",  points: 15 },
  { id: "b44", cat: "☀️", label: "Hjälp till att laga mat",                 points: 20 },
  { id: "b45", cat: "☀️", label: "Skriv ett brev eller vykort till någon",  points: 25 },
  { id: "b46", cat: "☀️", label: "Titta på solnedgången",                   points: 15 },
  { id: "b47", cat: "☀️", label: "Bygg något med händerna (Lego, sandborg, trä…)", points: 20 },
  { id: "b48", cat: "☀️", label: "Laga mat eller baka något från grunden",  points: 30 },
  { id: "b49", cat: "☀️", label: "Gör något snällt för någon utan att berätta det", points: 25 },
  { id: "b50", cat: "☀️", label: "Ha en picknick utomhus",                  points: 20 },
];

// SVG avatar configs: [skinTone, hairColor, hairStyle]
const AVATAR_CONFIGS = [
  { skin: "#FDBCB4", hair: "#2C1810", hairStyle: "long",  label: "A" },
  { skin: "#FDBCB4", hair: "#F4A460", hairStyle: "pony",  label: "B" },
  { skin: "#C68642", hair: "#1a0a00", hairStyle: "long",  label: "C" },
  { skin: "#C68642", hair: "#2C1810", hairStyle: "pony",  label: "D" },
  { skin: "#8D5524", hair: "#0a0000", hairStyle: "afro",  label: "E" },
  { skin: "#8D5524", hair: "#1a0a00", hairStyle: "long",  label: "F" },
  { skin: "#FAEBD7", hair: "#8B7355", hairStyle: "pony",  label: "G" },
  { skin: "#FAEBD7", hair: "#2C1810", hairStyle: "afro",  label: "H" },
];

function AvatarSVG({ config, size = 52, items = [] }) {
  const { skin, hair, hairStyle } = config;
  const hasHat = items.some(id => id === "hat1");
  const hasCrown = items.some(id => id === "crown1");
  const hasStar = items.some(id => id === "star1");
  const hasFire = items.some(id => id === "fire1");
  const hasLightning = items.some(id => id === "lightning");

  return (
    <svg width={size} height={size} viewBox="0 0 52 52" style={{ display: "block", flexShrink: 0 }}>
      {/* Body */}
      <ellipse cx="26" cy="44" rx="11" ry="7" fill="#dc2828" />
      {/* Jersey stripes */}
      <ellipse cx="26" cy="44" rx="4" ry="7" fill="#ff6b6b" />
      {/* Neck */}
      <rect x="23" y="32" width="6" height="5" fill={skin} />
      {/* Head */}
      <ellipse cx="26" cy="27" rx="10" ry="11" fill={skin} />
      {/* Hair back */}
      {hairStyle === "long" && <ellipse cx="26" cy="26" rx="10.5" ry="12" fill={hair} />}
      {hairStyle === "afro" && <ellipse cx="26" cy="22" rx="12" ry="11" fill={hair} />}
      {hairStyle === "pony" && <ellipse cx="26" cy="20" rx="10.5" ry="8" fill={hair} />}
      {/* Face */}
      <ellipse cx="26" cy="27" rx="9" ry="10" fill={skin} />
      {/* Hair top */}
      {hairStyle === "long" && <ellipse cx="26" cy="18" rx="9.5" ry="5" fill={hair} />}
      {hairStyle === "afro" && <ellipse cx="26" cy="18" rx="11" ry="9" fill={hair} />}
      {hairStyle === "pony" && <>
        <ellipse cx="26" cy="18" rx="9.5" ry="5" fill={hair} />
        <ellipse cx="36" cy="22" rx="3" ry="5" fill={hair} />
      </>}
      {/* Eyes */}
      <circle cx="22" cy="26" r="1.5" fill="#1a1a2e" />
      <circle cx="30" cy="26" r="1.5" fill="#1a1a2e" />
      <circle cx="22.5" cy="25.5" r="0.5" fill="white" />
      <circle cx="30.5" cy="25.5" r="0.5" fill="white" />
      {/* Smile */}
      <path d="M22 30 Q26 33 30 30" stroke="#c0524a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Cheeks */}
      <ellipse cx="19" cy="29" rx="2.5" ry="1.5" fill="#ffb3b3" opacity="0.5" />
      <ellipse cx="33" cy="29" rx="2.5" ry="1.5" fill="#ffb3b3" opacity="0.5" />
      {/* Unlockables */}
      {hasHat && <><rect x="15" y="14" width="22" height="4" rx="2" fill="#1e40af" /><rect x="18" y="8" width="16" height="8" rx="3" fill="#2563eb" /></>}
      {hasCrown && <><polygon points="26,6 20,14 23,11 26,14 29,11 32,14" fill="#fbbf24" /><circle cx="26" cy="6" r="1.5" fill="#f59e0b" /></>}
      {hasStar && <text x="35" y="12" fontSize="9" textAnchor="middle">⭐</text>}
      {hasFire && <text x="15" y="12" fontSize="9" textAnchor="middle">🔥</text>}
      {hasLightning && <text x="38" y="20" fontSize="8" textAnchor="middle">⚡</text>}
    </svg>
  );
}

const AVATAR_BASES = AVATAR_CONFIGS; // keep compat alias
const AVATAR_ITEMS_LOCKED = [
  { id: "hat1", label: "Keps", icon: "🧢", cost: 100 },
  { id: "star1", label: "Stjärna", icon: "⭐", cost: 200 },
  { id: "fire1", label: "Eld", icon: "🔥", cost: 400 },
  { id: "crown1", label: "Krona", icon: "👑", cost: 800 },
  { id: "lightning", label: "Blixt", icon: "⚡", cost: 1200 },
];

const EXERCISES = [
  { id: "toetaps", label: "Toe taps", unit: "touch", color: "#f0dc00" },
  { id: "tvafotare", label: "Tvåfotare", unit: "touch", color: "#60a5fa" },
  { id: "jonglera", label: "Jonglera", unit: "touch", hasHighscore: true, color: "#f472b6" },
  { id: "suldrag", label: "Suldrag", unit: "touch", color: "#fb923c" },
  { id: "cruyff", label: "Cruyff-fint", unit: "touch", color: "#a78bfa" },
  { id: "passningar", label: "Passningar", unit: "touch", color: "#ff9f9f" },
  { id: "skott", label: "Skott", unit: "st", color: "#fbbf24" },
  { id: "fritraning", label: "Fri träning", unit: "min", isTime: true, color: "#94a3b8" },
];

// ── Daily & Weekly Challenges ─────────────────────────────────────────────────
const DAILY_CHALLENGES = [
  // Bollkontroll & teknik (30 st)
  { id: "d01", label: "Ta emot 20 kastade bollar med insidan av foten", points: 20, icon: "🦶" },
  { id: "d02", label: "Jonglera bollen 4 gånger utan att nudda marken", points: 20, icon: "⚽" },
  { id: "d03", label: "Gör 30 toe taps utan paus", points: 20, icon: "👟" },
  { id: "d04", label: "Håll bollen stilla på fotryggen i 5 sekunder", points: 25, icon: "⚽" },
  { id: "d05", label: "Gör 20 tvåfotare utan att tappa bollen", points: 20, icon: "🦶" },
  { id: "d06", label: "Jonglera bollen 3 gånger med knät", points: 20, icon: "⚽" },
  { id: "d07", label: "Dribla runt ett föremål 5 gånger med vänsterfoten", points: 20, icon: "🌀" },
  { id: "d08", label: "Gör 10 suldrag med höger och 10 med vänster fot", points: 20, icon: "👟" },
  { id: "d09", label: "Passa bollen mot en vägg 15 gånger i rad", points: 20, icon: "🏃" },
  { id: "d10", label: "Stoppa 5 bollar med sulan när någon rullar mot dig", points: 20, icon: "🦶" },
  { id: "d11", label: "Gör en Cruyff-fint 10 gånger i rad", points: 20, icon: "✨" },
  { id: "d12", label: "Jonglera 6 gånger med växelvis höger och vänster fot", points: 25, icon: "⚽" },
  { id: "d13", label: "Skjut 5 skott och försök träffa ett mål eller en vägg", points: 20, icon: "🥅" },
  { id: "d14", label: "Dribla bollen med insidan fram och tillbaka 10 ggr", points: 20, icon: "🌀" },
  { id: "d15", label: "Ta emot en rullande boll med sulan 10 gånger", points: 20, icon: "🦶" },
  { id: "d16", label: "Jonglera och försök sätta bollen på ryggen av foten", points: 30, icon: "⚽" },
  { id: "d17", label: "Gör 15 passningar mot en vägg med vänsterfoten", points: 20, icon: "🏃" },
  { id: "d18", label: "Håll bollen i luften med axeln 3 gånger", points: 25, icon: "⚽" },
  { id: "d19", label: "Gör 20 toe taps med enbart vänsterfoten", points: 20, icon: "👟" },
  { id: "d20", label: "Passa bollen mot en vägg och ta emot med bröstet", points: 25, icon: "🏃" },
  { id: "d21", label: "Stå på ett ben och rulla bollen under foten 10 ggr", points: 20, icon: "🦶" },
  { id: "d22", label: "Gör en fint och skjut — 5 gånger", points: 20, icon: "🥅" },
  { id: "d23", label: "Dribla runt 3 föremål utan att tappa bollen", points: 20, icon: "🌀" },
  { id: "d24", label: "Jonglera bollen 2 gånger med huvudet", points: 25, icon: "⚽" },
  { id: "d25", label: "Gör 25 passningar med insidan av foten mot en vägg", points: 20, icon: "🏃" },
  { id: "d26", label: "Skjut 3 skott och försök träffa i ett hörn", points: 25, icon: "🥅" },
  { id: "d27", label: "Jonglera bollen och byt fot varje gång i 5 omgångar", points: 20, icon: "⚽" },
  { id: "d28", label: "Gör 10 suldrag och avsluta med ett skott", points: 20, icon: "👟" },
  { id: "d29", label: "Spela keep-away med bollen i 2 minuter ensam", points: 20, icon: "🌀" },
  { id: "d30", label: "Balansera bollen på foten och gå 3 steg", points: 30, icon: "⚽" },
  // Kondition & rörlighet (20 st)
  { id: "d31", label: "Springa runt ett kvarter eller en kort slinga", points: 20, icon: "🏃" },
  { id: "d32", label: "Gör 15 utfallssteg med bollen i händerna", points: 20, icon: "💪" },
  { id: "d33", label: "Hoppa hopprep i 1 minut", points: 20, icon: "💫" },
  { id: "d34", label: "Gör 10 benboj och 10 armhävningar", points: 20, icon: "💪" },
  { id: "d35", label: "Stå i plankan i 30 sekunder", points: 20, icon: "💪" },
  { id: "d36", label: "Gör 20 höga knän på stället i 30 sekunder", points: 20, icon: "🏃" },
  { id: "d37", label: "Stretcha benen ordentligt i 5 minuter", points: 15, icon: "🧘" },
  { id: "d38", label: "Gör 10 kullerbyttor", points: 15, icon: "🌀" },
  { id: "d39", label: "Stå på ett ben i 45 sekunder utan att nudda marken", points: 20, icon: "🦶" },
  { id: "d40", label: "Gör 20 hopp på ett ben — höger och vänster", points: 20, icon: "💫" },
  { id: "d41", label: "Gör 3 set med 10 situps", points: 20, icon: "💪" },
  { id: "d42", label: "Gör 15 armhävningar", points: 20, icon: "💪" },
  { id: "d43", label: "Springa backar 5 gånger (uppför och nedför)", points: 25, icon: "🏃" },
  { id: "d44", label: "Gör 30 jumping jacks", points: 15, icon: "💫" },
  { id: "d45", label: "Ligg i ryggstöd och lyft benen 10 ggr", points: 20, icon: "💪" },
  { id: "d46", label: "Gör 10 utfallssteg framåt och 10 bakåt", points: 20, icon: "💪" },
  { id: "d47", label: "Hoppa över ett föremål fram och tillbaka 20 gånger", points: 20, icon: "💫" },
  { id: "d48", label: "Balansera på ett ben med ögonen stängda i 20 sek", points: 25, icon: "🧘" },
  { id: "d49", label: "Gör 5 minuters uppvärmning: springa, hopp och stretch", points: 20, icon: "🏃" },
  { id: "d50", label: "Gör en 10-minuters promenad med fotbollen under armen", points: 15, icon: "🌿" },
  // Roliga/kreativa (20 st)
  { id: "d51", label: "Hitta på ett eget tricks och visa det för någon", points: 25, icon: "🌟" },
  { id: "d52", label: "Spela fotboll i 10 minuter barfota på gräs", points: 20, icon: "🌿" },
  { id: "d53", label: "Öva din målgest tills du kan den utantill", points: 15, icon: "🎉" },
  { id: "d54", label: "Sjung lagets hejaramsa högt tre gånger", points: 15, icon: "📣" },
  { id: "d55", label: "Spela keep-away med en kompis i 5 minuter", points: 20, icon: "🤝" },
  { id: "d56", label: "Skjut en straff med ögonen stängda", points: 25, icon: "🥅" },
  { id: "d57", label: "Skapa en hinderbana och dribla igenom den", points: 20, icon: "🌀" },
  { id: "d58", label: "Träna med en kompis eller ett syskon i 10 minuter", points: 20, icon: "🤝" },
  { id: "d59", label: "Filma dig själv och titta på en övning du gjort", points: 20, icon: "📱" },
  { id: "d60", label: "Berätta för någon vad du tränat idag", points: 15, icon: "💬" },
  { id: "d61", label: "Sätt upp ett mål för nästa träning och skriv ned det", points: 15, icon: "📝" },
  { id: "d62", label: "Prova att jonglera med en tennisboll istället", points: 25, icon: "⚽" },
  { id: "d63", label: "Spela fotboll mot en lekplatsvägg i 10 minuter", points: 20, icon: "🏃" },
  { id: "d64", label: "Lär dig en ny fotbollsterms på engelska", points: 15, icon: "📚" },
  { id: "d65", label: "Hitta en sten eller kotte och dribla runt den", points: 15, icon: "🌿" },
  { id: "d66", label: "Spela fotboll med en ballong inomhus i 5 min", points: 15, icon: "🎈" },
  { id: "d67", label: "Ta 10 foton av din boll på roliga ställen", points: 15, icon: "📸" },
  { id: "d68", label: "Hitta på en ny övning och lär ut den till en vuxen", points: 25, icon: "💡" },
  { id: "d69", label: "Gör 10 skott med höger och 10 med vänsterfoten", points: 20, icon: "🥅" },
  { id: "d70", label: "Avsluta träningen med att tacka din boll 🙏", points: 15, icon: "⚽" },
];

// Weekly challenges — team goals based on week number
// Each week alternates between touch-heavy and minutes-heavy
const WEEKLY_CHALLENGES = [
  { id: "w01", label: "500 touch tillsammans den här veckan", type: "touch", goal: 500, points: 50 },
  { id: "w02", label: "60 minuters träning tillsammans den här veckan", type: "minutes", goal: 60, points: 50 },
  { id: "w03", label: "800 touch tillsammans den här veckan", type: "touch", goal: 800, points: 60 },
  { id: "w04", label: "90 minuters träning tillsammans den här veckan", type: "minutes", goal: 90, points: 60 },
  { id: "w05", label: "1000 touch tillsammans den här veckan", type: "touch", goal: 1000, points: 70 },
  { id: "w06", label: "120 minuters träning tillsammans den här veckan", type: "minutes", goal: 120, points: 70 },
  { id: "w07", label: "1200 touch tillsammans den här veckan", type: "touch", goal: 1200, points: 75 },
  { id: "w08", label: "150 minuters träning tillsammans den här veckan", type: "minutes", goal: 150, points: 75 },
  { id: "w09", label: "1500 touch tillsammans den här veckan", type: "touch", goal: 1500, points: 80 },
  { id: "w10", label: "180 minuters träning tillsammans den här veckan", type: "minutes", goal: 180, points: 80 },
  { id: "w11", label: "2000 touch tillsammans den här veckan", type: "touch", goal: 2000, points: 90 },
  { id: "w12", label: "200 minuters träning tillsammans den här veckan", type: "minutes", goal: 200, points: 90 },
];

// Get today's daily challenge (same for all players, cycles through all 70)
function getDailyChallenge() {
  const today = localToday();
  const dayNum = Math.floor(new Date(today).getTime() / 86400000);
  return DAILY_CHALLENGES[dayNum % DAILY_CHALLENGES.length];
}

// Get this week's team challenge
function getWeeklyChallenge() {
  const today = localToday();
  const weekNum = Math.floor(new Date(today).getTime() / (86400000 * 7));
  return WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length];
}

// Get ISO week start (Monday) as YYYY-MM-DD
function getWeekStart(dateStr) {
  const d = new Date(dateStr || localToday());
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function getLevel(points) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) { if (points >= l.min) lvl = l; }
  return lvl;
}
function getLevelIndex(points) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) { if (points >= LEVELS[i].min) idx = i; }
  return idx;
}
function getNextLevel(points) {
  return LEVELS.find((l) => l.min > points) || null;
}
function calcProgress(points) {
  const cur = getLevel(points);
  const next = getNextLevel(points);
  if (!next) return 100;
  const range = next.min - cur.min;
  const done = points - cur.min;
  return Math.round((done / range) * 100);
}
function getTeamLevel(points) {
  let lvl = TEAM_LEVELS[0];
  for (const l of TEAM_LEVELS) { if (points >= l.min) lvl = l; }
  return lvl;
}
function getNextTeamLevel(points) {
  return TEAM_LEVELS.find((l) => l.min > points) || null;
}
function calcTeamProgress(points) {
  const cur = getTeamLevel(points);
  const next = getNextTeamLevel(points);
  if (!next) return 100;
  return Math.round(((points - cur.min) / (next.min - cur.min)) * 100);
}


// ── API helpers — talk to Netlify Functions ───────────────────────────────────
const API = "/.netlify/functions";

async function apiGet(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPut(path, body) {
  const r = await fetch(`${API}${path}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiDelete(path, body) {
  const r = await fetch(`${API}${path}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function computeStats(user) {
  const logs = user.logs || [];
  const totalPoints = logs.reduce((s, l) => s + (l.points || 0), 0);
  // Only count actual logged free-training minutes, not touch-derived
  const totalMinutes = logs.reduce((s, l) => {
    const freeEx = (l.exercises || []).find(e => e.id === "fritraning");
    return s + (freeEx ? freeEx.value : 0);
  }, 0);
  const totalLogs = logs.length;
  const exerciseCounts = {};
  const exerciseHighscores = { ...user.highscores };
  let totalTouch = 0;
  logs.forEach((l) => {
    (l.exercises || []).forEach((e) => {
      exerciseCounts[e.id] = (exerciseCounts[e.id] || 0) + (e.value || 0);
      const ex = EXERCISES.find(x => x.id === e.id);
      if (ex && !ex.isTime && e.id !== "skott") totalTouch += (e.value || 0);
    });
  });
  // streak — only count logs that meet the minimum threshold (5 min OR 30 touch)
  // OR football bingo (cat ⚽)
  const qualifyingDays = [...new Set(logs.filter(l => {
    if (l.bingoFootball) return true; // football bingo counts
    if (l.bingo) return false;        // non-football bingo doesn't count
    const mins = (l.exercises || []).find(e => e.id === "fritraning")?.value || 0;
    const touch = (l.exercises || []).reduce((s, e) => {
      const ex = EXERCISES.find(x => x.id === e.id);
      return s + (ex && !ex.isTime && e.id !== "skott" ? (e.value || 0) : 0);
    }, 0);
    return mins >= 5 || touch >= 30;
  }).map(l => l.date))].sort();
  let streak = 0, maxStreak = 0, cur = 0;
  const today = localToday();
  for (let i = 0; i < qualifyingDays.length; i++) {
    if (i === 0) { cur = 1; }
    else {
      const prev = new Date(qualifyingDays[i - 1]);
      const curr = new Date(qualifyingDays[i]);
      const diff = (curr - prev) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    }
    if (cur > maxStreak) maxStreak = cur;
  }
  if (qualifyingDays.length > 0) {
    const last = new Date(qualifyingDays[qualifyingDays.length - 1]);
    const todayD = new Date(today);
    const diff = (todayD - last) / 86400000;
    streak = diff <= 1 ? cur : 0;
  }
  const bingoCount = (user.bingo || []).length;
  return { totalPoints, totalMinutes, totalLogs, totalTouch, exerciseCounts, exerciseHighscores, streak, maxStreak, bingoCount };
}

// ── Mini Components ───────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = COLORS.lime, height = 10 }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 99, height, overflow: "hidden", width: "100%" }}>
      <div style={{
        height: "100%", width: `${Math.min(100, value)}%`, background: color,
        borderRadius: 99, transition: "width 0.6s cubic-bezier(.4,2,.6,1)",
        boxShadow: `0 0 8px ${color}99`
      }} />
    </div>
  );
}

function Card({ children, style = {}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? COLORS.cardHover : COLORS.card,
        borderRadius: 18, padding: "18px 20px",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(8px)",
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}>
      {children}
    </div>
  );
}

// ── SCREENS ───────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [avatarBase, setAvatarBase] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!alias.trim() || !password.trim()) { setError("Fyll i alias och lösenord!"); return; }
    // Admin login — local check, no DB
    if (alias.trim().toLowerCase() === "admin" && password === "HögalidF15") {
      onLogin({ alias: "admin", isAdmin: true });
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "register") {
        const user = await apiPost("/users", { alias: alias.trim(), password, avatarBase });
        onLogin(user);
      } else {
        const result = await apiGet(`/users?alias=${alias.trim().toLowerCase()}`);
        if (result.error === "not_found" || result.password !== password) {
          setError("Fel alias eller lösenord!");
        } else {
          onLogin(result);
        }
      }
    } catch (e) {
      if (e.message.includes("409") || e.message.includes("alias_taken")) {
        setError("Det aliset är taget, prova ett annat!");
      } else {
        setError("Något gick fel, försök igen!");
      }
    }
    setBusy(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${COLORS.dark} 0%, #001e6e 60%, ${COLORS.red} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap');
        * { box-sizing: border-box; }
        input { outline: none; }
        input:focus { box-shadow: 0 0 0 3px ${COLORS.lime}66 !important; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={CLUB_LOGO} alt="Högalid IF" style={{ width: 90, height: 90, marginBottom: 8, filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.5))" }} />
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 32, color: COLORS.lime, letterSpacing: 1, lineHeight: 1.1 }}>Högalid F15</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>Sommarlovet 2026 — Träna. Väx. Ha kul!</div>
        </div>

        <Card>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 15, transition: "all 0.2s",
                  background: mode === m ? COLORS.lime : "rgba(255,255,255,0.1)",
                  color: mode === m ? COLORS.dark : "rgba(255,255,255,0.7)" }}>
                {m === "login" ? "Logga in" : "Ny spelare"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Välj din gubbe</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {AVATAR_CONFIGS.map((cfg, i) => (
                  <button key={i} onClick={() => setAvatarBase(i)}
                    style={{ background: avatarBase === i ? COLORS.lime + "44" : "transparent", border: avatarBase === i ? `2px solid ${COLORS.lime}` : "2px solid transparent", borderRadius: 12, padding: 6, cursor: "pointer", transition: "all 0.2s" }}>
                    <AvatarSVG config={cfg} size={44} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {[
            { label: "Alias (smeknamn)", val: alias, set: setAlias, type: "text", ph: "t.ex. Fotbollstjej99" },
            { label: "Lösenord", val: password, set: setPassword, type: "password", ph: "Välj ett lösenord" },
          ].map(({ label, val, set, type, ph }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 5, fontWeight: 600 }}>{label}</div>
              <input value={val} onChange={(e) => set(e.target.value)} type={type} placeholder={ph}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 15, fontFamily: "'Nunito', sans-serif" }} />
            </div>
          ))}

          {error && <div style={{ color: "#ff9f9f", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>⚠️ {error}</div>}

          <button onClick={handleSubmit} disabled={busy}
            style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: busy ? "rgba(240,220,0,0.5)" : COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive", fontSize: 18, cursor: busy ? "not-allowed" : "pointer", letterSpacing: 0.5, transition: "all 0.2s", boxShadow: `0 4px 20px ${COLORS.lime}55` }}>
            {busy ? "Laddar..." : mode === "login" ? "Spela! →" : "Skapa konto →"}
          </button>

          {mode === "login" && (
            <div style={{ textAlign: "center", marginTop: 12, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
              Glömt lösenordet? Fråga tränaren! 🙋
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Log Training Screen ───────────────────────────────────────────────────────
function LogScreen({ user, onSave, onBack }) {
  const [date, setDate] = useState(localToday());
  const [exercises, setExercises] = useState(
    EXERCISES.map((e) => ({ id: e.id, value: "", highscore: "" }))
  );
  const [saved, setSaved] = useState(false);

  const [tooLittle, setTooLittle] = useState(false);

  function setVal(id, field, val) {
    setExercises((prev) => prev.map((e) => e.id === id ? { ...e, [field]: val } : e));
  }

  function handleSave() {
    const filled = exercises.filter((e) => e.value !== "" && Number(e.value) > 0);
    if (filled.length === 0) return;
    const freeEx = exercises.find(e => e.id === "fritraning");
    const totalMins = freeEx && freeEx.value !== "" ? Number(freeEx.value) : 0;
    const totalTouch = filled.reduce((s, e) => {
      const ex = EXERCISES.find((x) => x.id === e.id);
      return s + (ex?.isTime || e.id === "skott" ? 0 : Number(e.value));
    }, 0);

    // Minimum threshold: 5 min OR 30 touch to count as a real session
    const meetsThreshold = totalMins >= 5 || totalTouch >= 30;
    if (!meetsThreshold) {
      setTooLittle(true);
      setTimeout(() => setTooLittle(false), 3000);
      return;
    }
    const points = totalTouch + totalMins * 5;

    // update highscores
    const newHighscores = { ...user.highscores };
    exercises.forEach((e) => {
      if (e.highscore && Number(e.highscore) > 0) {
        if (!newHighscores[e.id] || Number(e.highscore) > newHighscores[e.id]) {
          newHighscores[e.id] = Number(e.highscore);
        }
      }
    });

    const log = { date, exercises: filled.map(e => ({ id: e.id, value: Number(e.value) })), points, minutes: totalMins };
    onSave(log, newHighscores);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 4 }}>Logga träning</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>Fyll i vad du tränat på!</div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>Datum</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ display: "block", marginTop: 5, padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontFamily: "'Nunito', sans-serif", width: "100%" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {EXERCISES.map((ex) => {
          const val = exercises.find((e) => e.id === ex.id);
          return (
            <Card key={ex.id} style={{ borderLeft: `4px solid ${ex.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: ex.color }} />
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{ex.label}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="number" min="0" placeholder={`Antal ${ex.unit}`} value={val?.value || ""}
                  onChange={(e) => setVal(ex.id, "value", e.target.value)}
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontFamily: "'Nunito', sans-serif" }} />
                {ex.hasHighscore && (
                  <input type="number" min="0" placeholder="🏆 Rekord" value={val?.highscore || ""}
                    onChange={(e) => setVal(ex.id, "highscore", e.target.value)}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${COLORS.accent}55`, background: "rgba(255,218,61,0.06)", color: "#fff", fontSize: 14, fontFamily: "'Nunito', sans-serif" }} />
                )}
              </div>
              {ex.hasHighscore && (
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 5 }}>
                  Rekord = flest i rad utan att tappa bollen
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {tooLittle && (
        <div style={{ background: "rgba(220,40,40,0.15)", border: `1px solid ${COLORS.red}`, borderRadius: 12, padding: "12px 16px", marginTop: 16, color: COLORS.red, fontWeight: 600, fontSize: 14 }}>
          ⚠️ Minst 5 minuter eller 30 touch krävs för att träningen ska räknas!
        </div>
      )}
      <button onClick={handleSave}
        style={{ width: "100%", marginTop: 24, padding: "16px 0", borderRadius: 16, border: "none",
          background: saved ? COLORS.grassLight : COLORS.lime, color: COLORS.dark,
          fontFamily: "'Fredoka One', cursive", fontSize: 20, cursor: "pointer",
          boxShadow: `0 4px 24px ${COLORS.lime}55`, transition: "all 0.3s" }}>
        {saved ? "✅ Sparat!" : "Spara träning →"}
      </button>
    </div>
  );
}

// ── Avatar Screen ─────────────────────────────────────────────────────────────
function AvatarScreen({ user, stats, onUnlock, onBack }) {
  return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 4 }}>Min gubbe</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>Lås upp coola prylar med poäng!</div>

      <Card style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <AvatarSVG config={AVATAR_CONFIGS[user.avatarBase || 0]} size={90} items={user.unlockedItems || []} />
        </div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginTop: 8 }}>{user.alias}</div>
        <div style={{ color: COLORS.lime, fontSize: 14, marginTop: 2 }}>⭐ {stats.totalPoints} poäng</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {AVATAR_ITEMS_LOCKED.map((item) => {
          const owned = (user.unlockedItems || []).includes(item.id);
          const canBuy = !owned && stats.totalPoints >= item.cost;
          return (
            <Card key={item.id} style={{ textAlign: "center", opacity: owned || canBuy ? 1 : 0.5 }}>
              <div style={{ fontSize: 40 }}>{owned ? item.icon : "🔒"}</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 4 }}>{item.label}</div>
              {owned ? (
                <div style={{ color: COLORS.lime, fontSize: 12, marginTop: 4 }}>✅ Upplåst!</div>
              ) : (
                <>
                  <div style={{ color: COLORS.accent, fontSize: 12, marginTop: 4 }}>⭐ {item.cost} poäng</div>
                  {canBuy && (
                    <button onClick={() => onUnlock(item.id, item.cost)}
                      style={{ marginTop: 8, padding: "6px 14px", borderRadius: 10, border: "none", background: COLORS.lime, color: COLORS.dark, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                      Lås upp!
                    </button>
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Bingo Screen ──────────────────────────────────────────────────────────────
function BingoScreen({ user, onComplete, onBack }) {
  const done = user.bingo || [];
  const remaining = BINGO.filter(b => !done.includes(b.id));
  const [filter, setFilter] = useState("all"); // all | ⚽ | ☀️
  const [randomPick, setRandomPick] = useState(null);
  const [justDone, setJustDone] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const footballCount = done.filter(id => BINGO.find(b => b.id === id)?.cat === "⚽").length;
  const summerCount   = done.filter(id => BINGO.find(b => b.id === id)?.cat === "☀️").length;
  const totalPoints   = done.reduce((s, id) => s + (BINGO.find(b => b.id === id)?.points || 0), 0);

  const [selectedChallenge, setSelectedChallenge] = useState(null);

  function pickRandom() {
    const pool = remaining.filter(b => filter === "all" || b.cat === filter);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setRandomPick(pick);
  }

  function markDone(id) {
    const challenge = BINGO.find(b => b.id === id);
    onComplete(id, challenge?.points || 0);
    setJustDone(id);
    setRandomPick(null);
    setShowConfetti(true);
    setTimeout(() => { setJustDone(null); setShowConfetti(false); }, 2500);
  }

  // Shuffle once per screen open — undone items random, done items at bottom
  const shuffledBingo = useMemo(() => {
    const undone = BINGO.filter(b => !done.includes(b.id));
    const doneItems = BINGO.filter(b => done.includes(b.id));
    for (let i = undone.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [undone[i], undone[j]] = [undone[j], undone[i]];
    }
    return [...undone, ...doneItems];
  }, []); // empty deps = only runs once on mount

  const displayList = shuffledBingo
    .filter(b => filter === "all" || b.cat === filter);

  return (
    <div style={{ padding: "20px 16px 32px", fontFamily: "'Nunito', sans-serif" }}>
      <Confetti active={showConfetti} />
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>

      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 2 }}>Sommarlovsbingo 🌞</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 18 }}>50 utmaningar — en hel sommar att klara dem!</div>

      {/* Progress summary */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: COLORS.lime }}>{done.length}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>av 50 klara</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#60a5fa" }}>{footballCount}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>⚽ idrott</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fbbf24" }}>{summerCount}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>☀️ sommar</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar value={Math.round((done.length / 50) * 100)} color={COLORS.lime} height={10} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 5 }}>
          +{totalPoints} poäng tjänade från bingo
        </div>
      </Card>

      {/* Bingo milestone badges */}
      {[5, 10, 20, 35, 50].map(milestone => {
        const reached = done.length >= milestone;
        const badge = BADGES.find(b => b.id === `bingo${milestone}`);
        return (
          <div key={milestone} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: reached ? "rgba(168,230,61,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${reached ? COLORS.lime : "rgba(255,255,255,0.1)"}`,
            borderRadius: 10, padding: "4px 10px", marginRight: 6, marginBottom: 12,
            opacity: reached ? 1 : 0.45,
          }}>
            <span style={{ fontSize: 14 }}>{badge?.icon}</span>
            <span style={{ color: reached ? COLORS.lime : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700 }}>{milestone} klara</span>
          </div>
        );
      })}

      {/* Random pick button */}
      <button onClick={pickRandom}
        style={{ width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
          background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.navy})`,
          color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 19,
          cursor: remaining.filter(b => filter === "all" || b.cat === filter).length === 0 ? "not-allowed" : "pointer",
          marginBottom: 14, boxShadow: `0 4px 20px rgba(220,40,40,0.4)`, letterSpacing: 0.5 }}>
        🎲 Slumpa ett uppdrag!
      </button>

      {/* Random pick card */}
      {randomPick && (
        <Card style={{ marginBottom: 16, border: `2px solid ${COLORS.red}`, background: "rgba(220,40,40,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ fontSize: 28 }}>{randomPick.cat}</div>
            <div style={{ background: COLORS.accent, color: COLORS.dark, borderRadius: 8, padding: "3px 10px", fontWeight: 700, fontSize: 13 }}>+{randomPick.points} p</div>
          </div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginBottom: 14, lineHeight: 1.3 }}>{randomPick.label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => markDone(randomPick.id)}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                background: COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive",
                fontSize: 16, cursor: "pointer" }}>
              ✅ Klart!
            </button>
            <button onClick={() => setRandomPick(null)}
              style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" }}>
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* Selected challenge confirm popup */}
      {selectedChallenge && (
        <Card style={{ marginBottom: 16, border: `2px solid ${COLORS.lime}`, background: "rgba(168,230,61,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ fontSize: 28 }}>{selectedChallenge.cat}</div>
            <div style={{ background: COLORS.accent, color: COLORS.dark, borderRadius: 8, padding: "3px 10px", fontWeight: 700, fontSize: 13 }}>+{selectedChallenge.points} p</div>
          </div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, marginBottom: 14, lineHeight: 1.3 }}>{selectedChallenge.label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { markDone(selectedChallenge.id); setSelectedChallenge(null); }}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
                background: COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive",
                fontSize: 16, cursor: "pointer" }}>
              ✅ Klart!
            </button>
            <button onClick={() => setSelectedChallenge(null)}
              style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" }}>
              ✕
            </button>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["all", "Alla 50"], ["⚽", "Fotboll & idrott"], ["☀️", "Sommar"]].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, transition: "all 0.15s",
              background: filter === val ? COLORS.lime : "rgba(255,255,255,0.1)",
              color: filter === val ? COLORS.dark : "rgba(255,255,255,0.7)" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Challenge list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {displayList.map(challenge => {
          const isDone = done.includes(challenge.id);
          const isJust = justDone === challenge.id;
          return (
            <div key={challenge.id}
              onClick={() => !isDone && setSelectedChallenge(challenge)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: isDone ? "rgba(168,230,61,0.1)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${isDone ? COLORS.lime + "55" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 14, padding: "12px 14px",
                cursor: isDone ? "default" : "pointer",
                opacity: isDone ? 0.7 : 1,
                transition: "all 0.2s",
                transform: isJust ? "scale(1.02)" : "scale(1)",
              }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${isDone ? COLORS.lime : "rgba(255,255,255,0.2)"}`,
                background: isDone ? COLORS.lime : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>
                {isDone ? "✓" : challenge.cat}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: isDone ? "rgba(255,255,255,0.5)" : "#fff", fontSize: 14, fontWeight: 600, lineHeight: 1.3, textDecoration: isDone ? "line-through" : "none" }}>
                  {challenge.label}
                </div>
              </div>
              <div style={{ color: isDone ? COLORS.lime : COLORS.accent, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {isDone ? "✅" : `+${challenge.points}p`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Team Screen ───────────────────────────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 32 }, (_, i) => i);
  const colors = [COLORS.yellow, COLORS.red, "#fff", COLORS.navy, COLORS.yellow, "#ff9f9f"];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999, overflow: "hidden" }}>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(i => (
        <div key={i} style={{
          position: "absolute",
          left: `${(i * 37) % 100}%`,
          top: `-${10 + (i * 13) % 30}px`,
          width: (i % 3 === 0) ? 10 : 7,
          height: (i % 3 === 0) ? 10 : 14,
          borderRadius: i % 2 === 0 ? "50%" : 2,
          background: colors[i % colors.length],
          animation: `confettiFall ${1.5 + (i % 5) * 0.3}s ease-in ${(i % 7) * 0.1}s forwards`,
        }} />
      ))}
    </div>
  );
}

function TeamScreen({ currentUser, onBack }) {
  const [allUsers, setAllUsers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    apiGet("/users").then(setAllUsers).catch(() => setAllUsers([])).finally(() => setLoadingTeam(false));
  }, []);

  const allStats = allUsers.map((u) => {
    const s = computeStats(u);
    return { alias: u.alias, bingo: u.bingo || [], ...s };
  });
  const totalTeamMinutes = allStats.reduce((s, u) => s + u.totalMinutes, 0);
  const totalTeamTouch  = allStats.reduce((s, u) => s + u.totalTouch, 0);
  const totalTeamLogs   = allStats.reduce((s, u) => s + u.totalLogs, 0);
  const allBingoDone = new Set(allStats.flatMap(u => u.bingo));
  const totalTeamBingo = allStats.reduce((s, u) => s + u.bingo.length, 0);
  const uniqueTeamBingo = allBingoDone.size;
  const teamPoints = totalTeamTouch + totalTeamMinutes * 5;

  const allActiveDays = new Set(
    allUsers.flatMap(u =>
      (u.logs || []).filter(l => {
        if (l.bingoFootball) return true;
        if (l.bingo) return false;
        const mins = (l.exercises || []).find(e => e.id === "fritraning")?.value || 0;
        const touch = (l.exercises || []).reduce((s, e) => {
          const ex = EXERCISES.find(x => x.id === e.id);
          return s + (ex && !ex.isTime && e.id !== "skott" ? (e.value || 0) : 0);
        }, 0);
        return mins >= 5 || touch >= 30;
      }).map(l => l.date).filter(Boolean)
    )
  );
  const sortedDays = [...allActiveDays].sort();
  let teamStreak = 0, teamCur = 0;
  const today = localToday();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) { teamCur = 1; }
    else {
      const diff = (new Date(sortedDays[i]) - new Date(sortedDays[i-1])) / 86400000;
      teamCur = diff === 1 ? teamCur + 1 : 1;
    }
  }
  if (sortedDays.length > 0) {
    const lastDay = sortedDays[sortedDays.length - 1];
    const diffToday = (new Date(today) - new Date(lastDay)) / 86400000;
    teamStreak = diffToday <= 1 ? teamCur : 0;
  }

  if (loadingTeam) return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
      Laddar lagets data...
    </div>
  );
  const teamLevel     = getTeamLevel(teamPoints);
  const nextTeamLevel = getNextTeamLevel(teamPoints);
  const teamProgress  = calcTeamProgress(teamPoints);

  const [showConfetti, setShowConfetti] = useState(false);
  const prevTeamLevel = useState(teamLevel.name)[0];

  // Show confetti briefly on mount if we just leveled up (stored in sessionStorage)
  useEffect(() => {
    const key = "fball_last_team_level";
    const last = sessionStorage.getItem(key);
    if (last && last !== teamLevel.name) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    sessionStorage.setItem(key, teamLevel.name);
  }, []);

  const myStats = allStats.find(u => u.alias === currentUser.alias);

  // Next few team levels to show as "road ahead"
  const currentIdx = TEAM_LEVELS.findIndex(l => l.name === teamLevel.name);
  const upcomingLevels = TEAM_LEVELS.slice(currentIdx + 1, currentIdx + 4);

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      <Confetti active={showConfetti} />
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 4 }}>Laget 💪</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>Träna mer — klättra upp i nivåer!</div>

      {/* Current team level card */}
      <Card style={{ marginBottom: 16, border: `2px solid ${teamLevel.color || COLORS.lime}`, background: "rgba(0,40,100,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{teamLevel.icon}</div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Lagets nivå</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: teamLevel.color || COLORS.lime, lineHeight: 1.1 }}>{teamLevel.name}</div>
          </div>
        </div>
        <ProgressBar value={teamProgress} color={teamLevel.color || COLORS.lime} height={14} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{teamPoints.toLocaleString("sv")} poäng</span>
          {nextTeamLevel
            ? <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>→ {nextTeamLevel.icon} {nextTeamLevel.name} ({(nextTeamLevel.min - teamPoints).toLocaleString("sv")} kvar)</span>
            : <span style={{ color: COLORS.accent, fontSize: 12 }}>🏆 Maxnivå!</span>
          }
        </div>
      </Card>

      {/* Team streak */}
      <Card style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>🔥</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Lagstreak</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 32, color: COLORS.yellow, lineHeight: 1.1 }}>
            {teamStreak} <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)" }}>dag{teamStreak !== 1 ? "ar" : ""} i rad</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 3 }}>
            {teamStreak === 0
              ? "Ingen har loggat idag — håll strecket vid liv! 💪"
              : teamStreak === 1
              ? "Bra start — kom tillbaka imorgon! 🌱"
              : teamStreak < 7
              ? "Bra jobbat laget — fortsätt! 🌟"
              : teamStreak < 14
              ? "Över en vecka — ni är oslagbara! 🏆"
              : "Legendarisk streak — WOW! 👑"}
          </div>
        </div>
      </Card>

      {/* Upcoming levels teaser */}
      {upcomingLevels.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Kommande nivåer</div>
          <div style={{ display: "flex", gap: 8 }}>
            {upcomingLevels.map((lvl, i) => (
              <div key={lvl.name} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 8px", textAlign: "center", opacity: 1 - i * 0.2 }}>
                <div style={{ fontSize: 22 }}>{lvl.icon}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 3, fontWeight: 600 }}>{lvl.name}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 2 }}>{lvl.min.toLocaleString("sv")} p</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team stats */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Lagets totaler</div>
        {[
          { label: "Antal spelare",          val: allStats.length,                       icon: "👥" },
          { label: "Inloggade träningar",     val: totalTeamLogs,                         icon: "📅" },
          { label: "Minuter tränat",          val: totalTeamMinutes,                      icon: "⏱" },
          { label: "Touch totalt",            val: totalTeamTouch.toLocaleString("sv"),   icon: "🦶" },
          { label: "Bingo-uppdrag klarade",  val: `${totalTeamBingo} (${uniqueTeamBingo} unika)`, icon: "🌞" },
        ].map(({ label, val, icon }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{icon} {label}</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{val}</span>
          </div>
        ))}
      </Card>

      {/* My contribution */}
      {myStats && (
        <Card style={{ border: `1.5px solid ${COLORS.lime}` }}>
          <div style={{ color: COLORS.lime, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Mitt bidrag till laget</div>
          {[
            { label: "Mina träningsminuter", val: myStats.totalMinutes,    icon: "⏱" },
            { label: "Mina touch",           val: myStats.totalTouch,      icon: "🦶" },
            { label: "Mina pass",            val: myStats.totalLogs,       icon: "📅" },
            { label: "Mina bingo-uppdrag",   val: myStats.bingoCount || 0, icon: "🌞" },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{icon} {label}</span>
              <span style={{ color: COLORS.lime, fontWeight: 700, fontSize: 15 }}>{val}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function Countdown() {
  const TARGET = new Date("2026-08-17T00:00:00");
  function calc() {
    const diff = TARGET - new Date();
    if (diff <= 0) return null;
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!t) return (
    <Card style={{ textAlign: "center", marginBottom: 16, background: "rgba(168,230,61,0.12)", border: `1.5px solid ${COLORS.lime}` }}>
      <div style={{ fontSize: 28 }}>🎉</div>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: COLORS.lime }}>Dags för träning igen!</div>
    </Card>
  );

  return (
    <Card style={{ marginBottom: 16, background: "rgba(240,220,0,0.07)", border: `1.5px solid rgba(240,220,0,0.4)` }}>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        ⚽ Första träningen efter sommarlovet
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
        {[["days","dagar"],["hours","tim"],["minutes","min"],["seconds","sek"]].map(([key, lbl]) => (
          <div key={key} style={{ textAlign: "center", background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 4px" }}>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: COLORS.accent, lineHeight: 1 }}>
              {String(t[key]).padStart(2, "0")}
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textAlign: "center", marginTop: 8 }}>17 augusti 🗓</div>
    </Card>
  );
}

// ── Home Dashboard ────────────────────────────────────────────────────────────
function HomeScreen({ user, stats, onNav }) {
  const level = getLevel(stats.totalPoints);
  const nextLevel = getNextLevel(stats.totalPoints);
  const progress = calcProgress(stats.totalPoints);
  const earnedBadges = BADGES.filter((b) => b.condition(stats));

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <button onClick={() => onNav("avatar")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
          <AvatarSVG config={AVATAR_CONFIGS[user.avatarBase || 0]} size={56} items={user.unlockedItems || []} />
        </button>
        <div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: "#fff", lineHeight: 1.1 }}>Hej, {user.alias}! 👋</div>
          <div style={{ color: COLORS.lime, fontSize: 14, fontWeight: 600 }}>{level.icon} {level.name}</div>
        </div>
      </div>

      {/* Countdown */}
      <Countdown />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>🔥</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: COLORS.yellow }}>{stats.streak}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>dagars streak</div>
        </Card>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>⭐</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 28, color: COLORS.accent }}>{stats.totalPoints}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>totala poäng</div>
        </Card>
      </div>

      {/* Level progress */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{level.icon} {level.name}</span>
          {nextLevel && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>→ {nextLevel.icon} {nextLevel.name}</span>}
        </div>
        <ProgressBar value={progress} color={COLORS.lime} height={12} />
        {nextLevel && (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 6 }}>
            {nextLevel.min - stats.totalPoints} poäng kvar
          </div>
        )}
      </Card>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Träningsmin", val: stats.totalMinutes, icon: "⏱" },
          { label: "Touch totalt", val: stats.totalTouch, icon: "🦶" },
          { label: "Längsta streak", val: stats.maxStreak, icon: "💪" },
        ].map(({ label, val, icon }) => (
          <Card key={label} style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: "#fff" }}>{val}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Mina badges</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {earnedBadges.map((b) => (
              <div key={b.id} style={{ background: "rgba(240,220,0,0.12)", border: `1px solid rgba(240,220,0,0.35)`, borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <span style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 600 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highscores */}
      {Object.keys(user.highscores || {}).length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ color: COLORS.accent, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>🏆 Mina rekord</div>
          {Object.entries(user.highscores).map(([id, val]) => {
            const ex = EXERCISES.find((e) => e.id === id);
            return ex ? (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 4 }}>
                <span>{ex.label}</span><span style={{ color: COLORS.accent, fontWeight: 700 }}>{val} i rad</span>
              </div>
            ) : null;
          })}
        </Card>
      )}

      {/* Daily + Weekly challenges widget */}
      {(() => {
        const today = localToday();
        const daily = getDailyChallenge();
        const weekly = getWeeklyChallenge();
        const dailyDone = (user.completedDaily || {})[today] === daily.id;
        const weekStart = getWeekStart(today);
        const users = {};  // Weekly team data shown fully in ChallengesScreen
        let weekTouch = 0, weekMins = 0;
        Object.values(users).forEach(u => {
          (u.logs || []).forEach(l => {
            if (!l.bingo && l.date >= weekStart && l.date <= today) {
              weekMins += l.minutes || 0;
              (l.exercises || []).forEach(e => {
                const ex = EXERCISES.find(x => x.id === e.id);
                if (ex && !ex.isTime && e.id !== "skott") weekTouch += (e.value || 0);
              });
            }
          });
        });
        const weekVal = weekly.type === "touch" ? weekTouch : weekMins;
        const weekPct = Math.min(100, Math.round((weekVal / weekly.goal) * 100));
        const weekDone = weekPct >= 100;
        return (
          <Card style={{ marginBottom: 12, padding: "16px 16px 14px", cursor: "pointer" }} onClick={() => onNav("challenges")}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>⚡ Utmaningar</div>
              <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 600 }}>Se alla →</div>
            </div>

            {/* Daily section */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: COLORS.yellow, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                📅 Dagens utmaning
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 20, lineHeight: 1.3 }}>{daily.icon}</span>
                <div style={{ flex: 1, color: dailyDone ? "rgba(255,255,255,0.4)" : "#fff", fontSize: 14, fontWeight: 600, lineHeight: 1.35, textDecoration: dailyDone ? "line-through" : "none" }}>
                  {daily.label}
                </div>
                <div style={{ color: dailyDone ? COLORS.lime : COLORS.yellow, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {dailyDone ? "✅" : `+${daily.points}p`}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }} />

            {/* Weekly section */}
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                🤝 Lagets veckoutmaning
              </div>
              <div style={{ color: weekDone ? COLORS.lime : "#fff", fontSize: 13, fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>
                {weekly.label} {weekDone ? "🎉" : ""}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={weekPct} color={weekDone ? COLORS.lime : COLORS.yellow} height={8} />
                </div>
                <span style={{ color: weekDone ? COLORS.lime : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, flexShrink: 0, minWidth: 36, textAlign: "right" }}>
                  {weekVal}/{weekly.goal}
                </span>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* Action buttons */}
      <button onClick={() => onNav("log")}
        style={{ width: "100%", padding: "18px 0", borderRadius: 18, border: "none", background: COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive", fontSize: 22, cursor: "pointer", marginBottom: 10, boxShadow: `0 6px 28px ${COLORS.lime}55`, letterSpacing: 0.5 }}>
        ⚽ Logga träning!
      </button>
      <button onClick={() => onNav("bingo")}
        style={{ width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
          background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.navy})`,
          color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 19,
          cursor: "pointer", marginBottom: 10, boxShadow: `0 4px 20px rgba(220,40,40,0.35)`, letterSpacing: 0.5 }}>
        🌞 Sommarlovsbingo — {(user.bingo || []).length}/50 klara
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={() => onNav("avatar")}
          style={{ padding: "14px 0", borderRadius: 14, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: "pointer" }}>
          👧 Min gubbe
        </button>
        <button onClick={() => onNav("team")}
          style={{ padding: "14px 0", borderRadius: 14, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: "pointer" }}>
          🤝 Laget
        </button>
        <button onClick={() => onNav("history")}
          style={{ padding: "14px 0", borderRadius: 14, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: "pointer", gridColumn: "span 2" }}>
          📋 Mina träningar
        </button>
      </div>
    </div>
  );
}

// ── Challenges Screen ──────────────────────────────────────────────────────────
function ChallengesScreen({ user, onCompleteDaily, onBack }) {
  const today = localToday();
  const weekStart = getWeekStart(today);
  const daily = getDailyChallenge();
  const weekly = getWeeklyChallenge();

  const completedDaily = user.completedDaily || {};
  const dailyDoneToday = completedDaily[today] === daily.id;

  const [allUsers, setAllUsers] = useState([]);
  useEffect(() => {
    apiGet("/users").then(setAllUsers).catch(() => setAllUsers([]));
  }, []);

  let weekTouch = 0, weekMinutes = 0;
  allUsers.forEach(u => {
    (u.logs || []).forEach(l => {
      if (!l.bingo && l.date >= weekStart && l.date <= today) {
        weekMinutes += l.minutes || 0;
        (l.exercises || []).forEach(e => {
          const ex = EXERCISES.find(x => x.id === e.id);
          if (ex && !ex.isTime && e.id !== "skott") weekTouch += (e.value || 0);
        });
      }
    });
  });
  const weekValue = weekly.type === "touch" ? weekTouch : weekMinutes;
  const weekProgress = Math.min(100, Math.round((weekValue / weekly.goal) * 100));
  const weekDone = weekValue >= weekly.goal;

  // History of completed daily challenges
  const dailyHistory = Object.entries(completedDaily)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)
    .map(([date, id]) => ({ date, challenge: DAILY_CHALLENGES.find(d => d.id === id) }))
    .filter(e => e.challenge);

  return (
    <div style={{ padding: "20px 16px 32px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 2 }}>Utmaningar ⚡</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>Dagens uppdrag + veckans lagutmaning</div>

      {/* Daily challenge */}
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>📅 Dagens uppdrag</div>
      <Card style={{ marginBottom: 20, border: dailyDoneToday ? `1.5px solid ${COLORS.lime}` : `1.5px solid rgba(240,220,0,0.3)`, background: dailyDoneToday ? "rgba(240,220,0,0.08)" : "rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 36, lineHeight: 1 }}>{daily.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: dailyDoneToday ? "rgba(255,255,255,0.5)" : "#fff", fontWeight: 700, fontSize: 16, lineHeight: 1.3, textDecoration: dailyDoneToday ? "line-through" : "none" }}>
              {daily.label}
            </div>
            <div style={{ color: COLORS.yellow, fontSize: 13, fontWeight: 700, marginTop: 3 }}>+{daily.points} poäng</div>
          </div>
        </div>
        {dailyDoneToday ? (
          <div style={{ background: "rgba(240,220,0,0.15)", borderRadius: 10, padding: "10px 14px", textAlign: "center", color: COLORS.yellow, fontWeight: 700, fontSize: 15 }}>
            ✅ Klarat idag!
          </div>
        ) : (
          <button onClick={() => onCompleteDaily(daily.id, daily.points)}
            style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: COLORS.yellow, color: COLORS.dark, fontFamily: "'Fredoka One', cursive", fontSize: 18, cursor: "pointer" }}>
            ✅ Jag har gjort det!
          </button>
        )}
      </Card>

      {/* Weekly team challenge */}
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🤝 Veckans lagutmaning</div>
      <Card style={{ marginBottom: 20, border: weekDone ? `1.5px solid ${COLORS.lime}` : "1px solid rgba(255,255,255,0.15)", background: weekDone ? "rgba(240,220,0,0.08)" : "rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}>{weekly.type === "touch" ? "🦶" : "⏱"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{weekly.label}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>Vecka från {weekStart}</div>
          </div>
        </div>
        <ProgressBar value={weekProgress} color={weekDone ? COLORS.lime : COLORS.yellow} height={14} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            {weekly.type === "touch" ? `${weekTouch} touch` : `${weekMinutes} min`}
          </span>
          <span style={{ color: weekDone ? COLORS.lime : COLORS.yellow, fontWeight: 700, fontSize: 13 }}>
            {weekDone ? "🎉 Klart!" : `${weekly.goal - weekValue} kvar`}
          </span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 6, textAlign: "center" }}>
          Träna och logga — det räknas automatiskt!
        </div>
      </Card>

      {/* Daily history */}
      {dailyHistory.length > 0 && (
        <>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✨ Senaste klarade</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dailyHistory.map(({ date, challenge }) => (
              <div key={date} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ fontSize: 22 }}>{challenge.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, textDecoration: "line-through" }}>{challenge.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>{date}</div>
                </div>
                <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 700 }}>+{challenge.points}p</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Log History / Edit Screen ─────────────────────────────────────────────────
function LogHistoryScreen({ user, onUpdate, onBack }) {
  const logs = (user.logs || [])
    .map((l, i) => ({ ...l, _idx: i }))
    .filter(l => !l.bingo)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const [editing, setEditing] = useState(null); // { _idx, date, exercises[] }
  const [confirmDelete, setConfirmDelete] = useState(null);

  function startEdit(log) {
    const exState = EXERCISES.map(ex => {
      const found = (log.exercises || []).find(e => e.id === ex.id);
      return { id: ex.id, value: found ? String(found.value) : "", highscore: "" };
    });
    setEditing({ _idx: log._idx, date: log.date, exercises: exState });
  }

  function setVal(id, val) {
    setEditing(prev => ({ ...prev, exercises: prev.exercises.map(e => e.id === id ? { ...e, value: val } : e) }));
  }

  function saveEdit() {
    const filled = editing.exercises.filter(e => e.value !== "" && Number(e.value) > 0);
    const freeEx = editing.exercises.find(e => e.id === "fritraning");
    const totalMins = freeEx?.value ? Number(freeEx.value) : 0;
    const totalTouch = filled.reduce((s, e) => {
      const ex = EXERCISES.find(x => x.id === e.id);
      return s + (ex?.isTime || e.id === "skott" ? 0 : Number(e.value));
    }, 0);
    const points = totalTouch + totalMins * 5;
    const updated = { date: editing.date, exercises: filled.map(e => ({ id: e.id, value: Number(e.value) })), points, minutes: totalMins };
    onUpdate("edit", editing._idx, updated);
    setEditing(null);
  }

  function deleteLog(idx) {
    onUpdate("delete", idx, null);
    setConfirmDelete(null);
  }

  if (editing) return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Avbryt</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: "#fff", marginBottom: 4 }}>Redigera träning</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 18 }}>{editing.date}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {EXERCISES.map(ex => {
          const val = editing.exercises.find(e => e.id === ex.id);
          return (
            <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", borderLeft: `3px solid ${ex.color}` }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 14, flex: 1 }}>{ex.label}</div>
              <input type="number" min="0" placeholder={`0 ${ex.unit}`} value={val?.value || ""}
                onChange={e => setVal(ex.id, e.target.value)}
                style={{ width: 80, padding: "7px 10px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontFamily: "'Nunito', sans-serif", textAlign: "right" }} />
            </div>
          );
        })}
      </div>
      <button onClick={saveEdit}
        style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: COLORS.lime, color: COLORS.dark, fontFamily: "'Fredoka One', cursive", fontSize: 19, cursor: "pointer" }}>
        💾 Spara ändringar
      </button>
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 32px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 4 }}>Mina träningar</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>{logs.length} pass loggade</div>

      {logs.length === 0 && (
        <div style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 }}>Inga träningar loggade än!</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {logs.map(log => {
          const totalMins = (log.exercises || []).find(e => e.id === "fritraning")?.value || 0;
          const totalTouch = (log.exercises || []).reduce((s, e) => {
            const ex = EXERCISES.find(x => x.id === e.id);
            return s + (ex && !ex.isTime && e.id !== "skott" ? (e.value || 0) : 0);
          }, 0);
          const isConfirming = confirmDelete === log._idx;
          return (
            <Card key={log._idx} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>📅 {log.date}</div>
                <div style={{ color: COLORS.yellow, fontWeight: 700, fontSize: 13 }}>+{log.points || 0} p</div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 10 }}>
                {totalMins > 0 && <span>⏱ {totalMins} min  </span>}
                {totalTouch > 0 && <span>🦶 {totalTouch} touch  </span>}
                {(log.exercises || []).filter(e => e.id === "skott" && e.value > 0).map(e =>
                  <span key="skott">🥅 {e.value} skott</span>
                )}
              </div>
              {isConfirming ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => deleteLog(log._idx)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: COLORS.red, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    🗑 Ja, ta bort
                  </button>
                  <button onClick={() => setConfirmDelete(null)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" }}>
                    Avbryt
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(log)}
                    style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    ✏️ Redigera
                  </button>
                  <button onClick={() => setConfirmDelete(log._idx)}
                    style={{ padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(220,40,40,0.4)", background: "transparent", color: COLORS.red, fontSize: 14, cursor: "pointer" }}>
                    🗑
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Admin Screen ──────────────────────────────────────────────────────────────
function AdminScreen({ onLogout }) {
  const [players, setPlayers] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    apiGet("/users").then(users => {
      const mapped = users.map(u => {
        const s = computeStats(u);
        const logs = u.logs || [];
        const allDates = logs.map(l => l.date).filter(Boolean).sort();
        const lastActivity = allDates.length > 0 ? allDates[allDates.length - 1] : null;
        return { ...u, ...s, lastActivity, bingoList: u.bingo || [] };
      }).sort((a, b) => (b.lastActivity || "").localeCompare(a.lastActivity || ""));
      setPlayers(mapped);
    }).catch(() => setPlayers([])).finally(() => setLoadingAdmin(false));
  }, []);

  const [showPw, setShowPw] = useState({});
  const today = localToday();

  function daysSince(dateStr) {
    if (!dateStr) return null;
    return Math.floor((new Date(today) - new Date(dateStr)) / 86400000);
  }
  function activityColor(days) {
    if (days === null) return "rgba(255,255,255,0.3)";
    if (days === 0) return COLORS.lime;
    if (days <= 3) return COLORS.accent;
    if (days <= 7) return "#fb923c";
    return "#f87171";
  }

  if (loadingAdmin) return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
      Laddar spelardata...
    </div>
  );
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${COLORS.dark} 0%, #001e6e 60%, #002864 100%)`, fontFamily: "'Nunito', sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><img src={CLUB_LOGO} alt="" style={{ width: 32, height: 32 }} /><span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: COLORS.lime }}>Admin — Högalid F15</span></div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Sommarlovet 2026</div>
        </div>
        <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, borderRadius: 8, padding: "6px 12px" }}>Logga ut</button>
      </div>

      <div style={{ padding: "16px 16px 40px" }}>

        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Spelare", val: players.length, icon: "👥" },
            { label: "Träningar loggade", val: players.reduce((s, p) => s + p.totalLogs, 0), icon: "📅" },
            { label: "Bingo klarade", val: players.reduce((s, p) => s + p.bingoCount, 0), icon: "🌞" },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.09)", borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: COLORS.lime }}>{val}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Player cards */}
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Alla spelare ({players.length}) — sorterat senast aktiv
        </div>

        {players.length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: 40 }}>Inga spelare registrerade än.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {players.map(p => {
            const days = daysSince(p.lastActivity);
            const color = activityColor(days);
            const level = getLevel(p.totalPoints);
            return (
              <div key={p.alias} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "14px 16px" }}>

                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AvatarSVG config={AVATAR_CONFIGS[p.avatarBase || 0]} size={32} items={p.unlockedItems || []} />
                      <div>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{p.alias}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{level.icon} {level.name}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color, fontWeight: 700, fontSize: 13 }}>
                      {days === null ? "Aldrig loggat" : days === 0 ? "Aktiv idag ✅" : `${days} dag${days === 1 ? "" : "ar"} sedan`}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
                      {p.lastActivity || "—"}
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                  {[
                    { lbl: "Poäng",    val: p.totalPoints,   col: COLORS.accent },
                    { lbl: "Minuter",  val: p.totalMinutes,  col: COLORS.lime },
                    { lbl: "Touch",    val: p.totalTouch,    col: "#60a5fa" },
                    { lbl: "Bingo",    val: `${p.bingoCount}/50`, col: COLORS.yellow },
                  ].map(({ lbl, val, col }) => (
                    <div key={lbl} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "7px 6px", textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: col }}>{val}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 1 }}>{lbl}</div>
                    </div>
                  ))}
                </div>

                {/* Streak */}
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 8 }}>
                  🔥 Streak: <span style={{ color: "#fff", fontWeight: 700 }}>{p.streak}</span> dagar &nbsp;|&nbsp;
                  Bästa: <span style={{ color: "#fff", fontWeight: 700 }}>{p.maxStreak}</span> dagar &nbsp;|&nbsp;
                  Pass: <span style={{ color: "#fff", fontWeight: 700 }}>{p.totalLogs}</span>
                </div>

                {/* Password row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px 12px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>🔑 Lösenord:</span>
                  <span style={{ color: showPw[p.alias] ? COLORS.accent : "transparent", fontSize: 13, fontWeight: 700, background: showPw[p.alias] ? "none" : "rgba(255,255,255,0.15)", borderRadius: 6, padding: "1px 8px", userSelect: showPw[p.alias] ? "text" : "none", letterSpacing: showPw[p.alias] ? 0 : 2 }}>
                    {showPw[p.alias] ? p.password : "••••••••"}
                  </span>
                  <button onClick={() => setShowPw(prev => ({ ...prev, [p.alias]: !prev[p.alias] }))}
                    style={{ marginLeft: "auto", background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.6)", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                    {showPw[p.alias] ? "Dölj" : "Visa"}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────
// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("home");
  const [loading, setLoading] = useState(false);

  function handleLogin(u) { setUser(u); setScreen("home"); }
  function handleLogout() { setUser(null); setScreen("home"); }

  async function handleSaveLog(log, newHighscores) {
    setLoading(true);
    try {
      // Add log to DB
      await apiPost("/logs", { alias: user.alias, log });
      // Update highscores on user
      const updated = await apiPut("/users", { alias: user.alias, highscores: newHighscores });
      setUser(updated);
      setScreen("home");
    } catch (e) { alert("Kunde inte spara: " + e.message); }
    setLoading(false);
  }

  async function handleUnlock(itemId, cost) {
    const stats = computeStats(user);
    if (stats.totalPoints < cost) return;
    const newItems = [...(user.unlockedItems || []), itemId];
    try {
      const updated = await apiPut("/users", { alias: user.alias, unlockedItems: newItems });
      setUser(updated);
    } catch (e) { alert("Kunde inte låsa upp: " + e.message); }
  }

  async function handleBingoDone(challengeId, bonusPoints) {
    if ((user.bingo || []).includes(challengeId)) return;
    try {
      await apiPost("/bingo", { alias: user.alias, challengeId });
      const challenge = BINGO.find(b => b.id === challengeId);
      const isFootball = challenge?.cat === "⚽";
      await apiPost("/logs", {
        alias: user.alias,
        log: { date: localToday(), exercises: [], points: bonusPoints, minutes: 0, bingo: true, bingoFootball: isFootball }
      });
      // Reload user
      const updated = await apiGet(`/users?alias=${user.alias.toLowerCase()}`);
      setUser(updated);
    } catch (e) { alert("Kunde inte markera bingo: " + e.message); }
  }

  async function handleCompleteDaily(challengeId, points) {
    const today = localToday();
    const newCompleted = { ...(user.completedDaily || {}), [today]: challengeId };
    try {
      await apiPost("/logs", {
        alias: user.alias,
        log: { date: today, exercises: [], points, minutes: 0, dailyChallenge: true }
      });
      const updated = await apiPut("/users", { alias: user.alias, completedDaily: newCompleted });
      setUser(updated);
    } catch (e) { alert("Kunde inte markera utmaning: " + e.message); }
  }

  async function handleUpdateLog(action, logId, updatedLog) {
    try {
      if (action === "delete") {
        await apiDelete("/logs", { id: logId });
      } else if (action === "edit") {
        await apiPut("/logs", { id: logId, log: updatedLog });
      }
      const updated = await apiGet(`/users?alias=${user.alias.toLowerCase()}`);
      setUser(updated);
    } catch (e) { alert("Kunde inte uppdatera träning: " + e.message); }
  }

  const bgStyle = {
    minHeight: "100vh",
    background: `linear-gradient(160deg, ${COLORS.dark} 0%, #001e6e 50%, ${COLORS.red} 100%)`,
    fontFamily: "'Nunito', sans-serif",
    color: "#fff",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
  };

  if (!user) return (
    <div style={bgStyle}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: ${COLORS.dark}; } input[type=number]::-webkit-inner-spin-button { opacity: 1; }`}</style>
      <LoginScreen onLogin={handleLogin} />
    </div>
  );

  if (user.isAdmin) return <AdminScreen onLogout={handleLogout} />;

  const stats = computeStats(user);

  return (
    <div style={bgStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${COLORS.dark}; }
        input:focus { outline: none; box-shadow: 0 0 0 3px ${COLORS.lime}66; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>

      {loading && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, height: 3, background: COLORS.lime, animation: "none" }} />
      )}

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={CLUB_LOGO} alt="" style={{ width: 28, height: 28 }} />
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: COLORS.lime }}>Högalid F15</span>
        </div>
        <button onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>Logga ut</button>
      </div>

      {screen === "home"       && <HomeScreen user={user} stats={stats} onNav={setScreen} />}
      {screen === "log"        && <LogScreen user={user} onSave={handleSaveLog} onBack={() => setScreen("home")} />}
      {screen === "challenges" && <ChallengesScreen user={user} onCompleteDaily={handleCompleteDaily} onBack={() => setScreen("home")} />}
      {screen === "history"    && <LogHistoryScreen user={user} onUpdate={handleUpdateLog} onBack={() => setScreen("home")} />}
      {screen === "avatar"     && <AvatarScreen user={user} stats={stats} onUnlock={handleUnlock} onBack={() => setScreen("home")} />}
      {screen === "team"       && <TeamScreen currentUser={user} onBack={() => setScreen("home")} />}
      {screen === "bingo"      && <BingoScreen user={user} onComplete={handleBingoDone} onBack={() => setScreen("home")} />}
    </div>
  );
}
