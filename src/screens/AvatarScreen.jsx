import { useState, useMemo } from 'react';
import {
  COLORS,
  STARTER_OPTIONS,
  AVATAR_REWARDS,
  CATEGORIES,
  getAvailableOptions,
} from '../constants';
import { Card } from '../components/common';
import { AvatarSVG, AvatarBuilder } from '../components/avatar';
import { useUser } from '../context/UserContext';

// Base avatar config for reward preview thumbnails
const PREVIEW_BASE = {
  skinColor: 'f2d3b1',
  hair: 'long01',
  hairColor: '0e0e0e',
  eyes: 'variant01',
  eyebrows: 'variant02',
  mouth: 'variant02',
};

const MAX_PREVIEW = 5;

// Pick evenly-spaced sample of items from a reward for the arch preview
function getPreviewItems(reward) {
  const items = [];
  for (const [category, variants] of Object.entries(reward.unlocks)) {
    const isColor = CATEGORIES.find((c) => c.key === category)?.type === 'color';
    const slots = MAX_PREVIEW - items.length;
    if (variants.length <= slots) {
      variants.forEach((v) => items.push({ category, variant: v, isColor }));
    } else {
      const step = variants.length / slots;
      for (let i = 0; i < slots; i++) {
        items.push({ category, variant: variants[Math.floor(i * step)], isColor });
      }
    }
    if (items.length >= MAX_PREVIEW) break;
  }
  return items;
}

export function AvatarScreen() {
  const { user, stats, setScreen, handleUnlock, handleAvatarUpdate } = useUser();
  const [localConfig, setLocalConfig] = useState(() => user.avatarConfig || {});
  const [saving, setSaving] = useState(false);

  // Check if local config differs from saved config
  const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(user.avatarConfig);

  // Build starter + unlocked options for the builder
  const unlockedItems = user.unlockedItems || [];

  const unlockedOptions = useMemo(() => {
    const result = {};
    const allKeys = [
      'skinColor',
      'hair',
      'hairColor',
      'eyes',
      'eyebrows',
      'mouth',
      'glasses',
      'backgroundColor',
      'earrings',
      'features',
    ];
    for (const key of allKeys) {
      const { unlocked } = getAvailableOptions(key, unlockedItems);
      if (unlocked.length > 0) {
        result[key] = unlocked;
      }
    }
    return result;
  }, [unlockedItems]);

  async function handleSave() {
    setSaving(true);
    await handleAvatarUpdate(localConfig);
    setSaving(false);
  }

  return (
    <div style={{ padding: '20px 16px', fontFamily: "'Nunito', sans-serif" }}>
      <button
        onClick={() => setScreen('home')}
        style={{
          background: 'none',
          border: 'none',
          color: COLORS.lime,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 16,
          padding: 0,
        }}
      >
        ← Tillbaka
      </button>
      <div
        style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 26,
          color: '#fff',
          marginBottom: 4,
        }}
      >
        Min avatar
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
        Anpassa din avatar och lås upp nya prylar!
      </div>

      {/* Avatar preview */}
      <Card style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <AvatarSVG avatarConfig={localConfig} size={120} />
        </div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginTop: 8 }}>
          {user.alias}
        </div>
        <div style={{ color: COLORS.lime, fontSize: 14, marginTop: 2 }}>
          {stats.totalPoints} poäng
        </div>

        {/* Save button */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: 12,
              padding: '10px 28px',
              borderRadius: 12,
              border: 'none',
              background: COLORS.lime,
              color: COLORS.dark,
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'Nunito', sans-serif",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        )}
      </Card>

      {/* Avatar builder */}
      <Card style={{ marginBottom: 20, padding: '16px 14px' }}>
        <AvatarBuilder
          avatarConfig={localConfig}
          onChange={setLocalConfig}
          starterOptions={STARTER_OPTIONS}
          unlockedOptions={unlockedOptions}
        />
      </Card>

      {/* Rewards section */}
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 20,
            color: '#fff',
            marginBottom: 12,
          }}
        >
          Belöningar
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AVATAR_REWARDS.map((reward) => {
            const owned = unlockedItems.includes(reward.id);
            const canBuy = !owned && stats.totalPoints >= reward.cost;
            const unlockCount = Object.values(reward.unlocks).reduce(
              (sum, arr) => sum + arr.length,
              0,
            );
            const previewItems = getPreviewItems(reward);
            const count = previewItems.length;
            const hasArch = count > 1;

            return (
              <Card key={reward.id} style={{ padding: '16px 16px 14px' }}>
                {/* Arch preview of reward items */}
                <div
                  className={`absolute ${canBuy ? 'right-27' : 'right-18 '} ${hasArch ? '-bottom-7' : 'bottom-0'}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    gap: count > 3 ? 0 : 6,
                    marginBottom: 8,
                  }}
                >
                  {previewItems.map((item, i) => {
                    // Arch: center rises up (negative Y), edges stay at baseline
                    const t = hasArch ? (i - (count - 1) / 2) / ((count - 1) / 2) : 0;
                    const yOffset = -(1 - t * t) * 16;
                    const rotation = t * 10;
                    const dist = Math.abs(t);
                    const itemOpacity = owned ? 0.8 - dist * 0.2 : 0.5 - dist * 0.4;
                    const scale = hasArch ? 1 - dist * 0.06 : 1;
                    const transform = hasArch
                      ? `translateY(${yOffset}px) rotate(${rotation}deg) scale(${scale})`
                      : 'none';

                    if (item.isColor) {
                      return (
                        <div
                          key={i}
                          style={{
                            width: 45,
                            height: 45,
                            borderRadius: '50%',
                            backgroundColor: `#${item.variant}`,
                            border: '2px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                            transform,
                            transformOrigin: 'center bottom',
                            opacity: itemOpacity,
                            flexShrink: 0,
                            marginLeft: hasArch ? -6 : 0,
                            marginRight: hasArch ? -6 : 0,
                          }}
                        />
                      );
                    }

                    const { backgroundColor: _bg, ...baseConfig } =
                      user.avatarConfig || PREVIEW_BASE;
                    const previewConfig = {
                      ...baseConfig,
                      [item.category]: item.variant,
                    };
                    return (
                      <div
                        key={i}
                        style={{
                          transform,
                          transformOrigin: 'center bottom',
                          opacity: itemOpacity,
                          filter: owned ? 'none' : 'saturate(0.6) blur(0.4px)',
                          flexShrink: 0,
                          marginLeft: hasArch ? -8 : 0,
                          marginRight: hasArch ? -8 : -10,
                        }}
                      >
                        <AvatarSVG avatarConfig={previewConfig} />
                      </div>
                    );
                  })}
                </div>

                {/* Card info row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{owned ? '✅' : '🔒'}</span>
                      <div>
                        <div
                          style={{
                            color: owned ? COLORS.lime : '#fff',
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {reward.label}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>
                          +{unlockCount} {unlockCount === 1 ? 'val' : 'val'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {owned ? (
                      <div style={{ color: COLORS.lime, fontSize: 12, fontWeight: 600 }}>
                        Upplåst!
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            color: canBuy ? COLORS.yellow : 'rgba(255,255,255,0.4)',
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {reward.cost}p
                        </div>
                        {canBuy && (
                          <button
                            onClick={() => handleUnlock(reward.id, reward.cost)}
                            className="z-40 relative"
                            style={{
                              marginTop: 4,
                              padding: '5px 14px',
                              borderRadius: 10,
                              border: 'none',
                              background: COLORS.lime,
                              color: COLORS.dark,
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                              fontFamily: "'Nunito', sans-serif",
                            }}
                          >
                            Lås upp!
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
