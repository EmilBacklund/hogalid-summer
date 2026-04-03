import { useState } from 'react';
import { COLORS } from '../../constants/colors';
import { CATEGORIES } from '../../constants/avatar';
import { AvatarSVG } from './AvatarSVG';

// Mini avatar preview button for variant options
function AvatarPreviewButton({ avatarConfig, categoryKey, value, selected, onClick, compact }) {
  const previewConfig = { ...avatarConfig, [categoryKey]: value };
  const sz = compact ? 40 : 46;
  return (
    <button
      onClick={onClick}
      style={{
        width: sz,
        height: sz,
        borderRadius: '50%',
        padding: 0,
        background: 'transparent',
        border: selected ? `3px solid ${COLORS.lime}` : '3px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        flexShrink: 0,
        overflow: 'hidden',
        boxShadow: selected ? `0 0 8px ${COLORS.lime}66` : 'none',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AvatarSVG avatarConfig={previewConfig} size={sz - 6} />
    </button>
  );
}

// Color swatch button
function ColorButton({ color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: `#${color}`,
        border: selected ? `3px solid ${COLORS.lime}` : '3px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        flexShrink: 0,
        boxShadow: selected ? `0 0 8px ${COLORS.lime}66` : 'none',
        transition: 'all 0.15s',
      }}
    />
  );
}

// "None" button for optional categories
function NoneButton({ selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: selected ? COLORS.lime : 'rgba(255,255,255,0.1)',
        color: selected ? COLORS.dark : 'rgba(255,255,255,0.4)',
        border: selected ? `2px solid ${COLORS.lime}` : '2px solid rgba(255,255,255,0.15)',
        cursor: 'pointer',
        flexShrink: 0,
        fontSize: 16,
        fontWeight: 700,
        fontFamily: "'Nunito', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      ✕
    </button>
  );
}

/**
 * AvatarBuilder — shared component for avatar customization.
 *
 * Props:
 *  - avatarConfig: current config object
 *  - onChange: (newConfig) => void
 *  - starterOptions: object keyed by category, arrays of starter values
 *  - unlockedOptions: object keyed by category, arrays of unlocked values (optional)
 *  - compact: boolean — if true, uses smaller sizing (for LoginScreen)
 */
export function AvatarBuilder({
  avatarConfig,
  onChange,
  starterOptions,
  unlockedOptions = {},
  compact = false,
}) {
  const [activeTab, setActiveTab] = useState('skinColor');

  // Determine which categories to show
  const visibleCats = CATEGORIES.filter((cat) => {
    if (cat.alwaysVisible) return true;
    // Show non-always-visible categories only if they have options
    const starter = starterOptions[cat.key] || [];
    const unlocked = unlockedOptions[cat.key] || [];
    return starter.length > 0 || unlocked.length > 0;
  });

  const activeCat = CATEGORIES.find((c) => c.key === activeTab) || CATEGORIES[0];
  const starterVals = starterOptions[activeTab] || [];
  const unlockedVals = unlockedOptions[activeTab] || [];
  const isOptional = !activeCat.alwaysVisible || activeTab === 'glasses';
  const currentValue = avatarConfig[activeTab];

  function handleSelect(value) {
    onChange({ ...avatarConfig, [activeTab]: value });
  }

  return (
    <div>
      {/* Category tabs */}
      <div style={{ position: 'relative', marginBottom: compact ? 10 : 14 }}>
        {/* Scroll fade hint on right edge */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 32,
            zIndex: 1,
            pointerEvents: 'none',
            borderRadius: '0 8px 8px 0',
          }}
        />
        <div
          className="flex-wrap"
          style={{
            display: 'flex',
            gap: 6,
            paddingBottom: 8,
          }}
        >
          {visibleCats.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className="flex-1"
              style={{
                padding: compact ? '6px 12px' : '8px 14px',
                borderRadius: 20,
                border: 'none',
                background: activeTab === cat.key ? COLORS.lime : 'rgba(255,255,255,0.1)',
                color: activeTab === cat.key ? COLORS.dark : 'rgba(255,255,255,0.6)',
                fontSize: compact ? 12 : 13,
                fontWeight: 700,
                fontFamily: "'Nunito', sans-serif",
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options for active category */}
      <div>
        {/* Starter options */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: compact ? 6 : 8,
            marginBottom: unlockedVals.length > 0 ? 6 : 0,
          }}
        >
          {isOptional && (
            <NoneButton
              selected={currentValue === null || currentValue === undefined}
              onClick={() => handleSelect(null)}
            />
          )}
          {starterVals.map((val) =>
            activeCat.type === 'color' ? (
              <ColorButton
                key={val}
                color={val}
                selected={currentValue === val}
                onClick={() => handleSelect(val)}
              />
            ) : (
              <AvatarPreviewButton
                key={val}
                avatarConfig={avatarConfig}
                categoryKey={activeTab}
                value={val}
                selected={currentValue === val}
                onClick={() => handleSelect(val)}
                compact={compact}
              />
            ),
          )}
        </div>

        {/* Unlocked options (after divider) */}
        {unlockedVals.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(240,220,0,0.25)' }} />
              <span
                style={{
                  color: COLORS.yellow,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Upplåst
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(240,220,0,0.25)' }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 8 }}>
              {unlockedVals.map((val) =>
                activeCat.type === 'color' ? (
                  <ColorButton
                    key={val}
                    color={val}
                    selected={currentValue === val}
                    onClick={() => handleSelect(val)}
                  />
                ) : (
                  <AvatarPreviewButton
                    key={val}
                    avatarConfig={avatarConfig}
                    categoryKey={activeTab}
                    value={val}
                    selected={currentValue === val}
                    onClick={() => handleSelect(val)}
                    compact={compact}
                  />
                ),
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
