export function AvatarSVG({ config, size = 52, items = [] }) {
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
