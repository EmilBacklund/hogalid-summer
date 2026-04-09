import { useEffect, useMemo, useState } from 'react';
import {
  COLORS,
  BADGES,
  STICKERS,
  STICKER_GROUPS,
  EXERCISES,
  STARTER_OPTIONS,
  AVATAR_REWARDS,
  CATEGORIES,
  getAvailableOptions,
} from '../constants';
import { getLevel, getNextLevel, calcProgress, getEarnedStickers, fetchAllUsersStale } from '../utils';
import { Card, ProgressBar, ButtonLoader } from '../components/common';
import { AvatarSVG, AvatarBuilder } from '../components/avatar';
import { useUser } from '../context/UserContext';
import { ArrowLeft } from 'lucide-react';

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

const TABS = [
  { id: 'avatar', label: 'Avatar', icon: '👧' },
  { id: 'stickers', label: 'Stickers', icon: '🌟' },
  { id: 'badges', label: 'Medaljer', icon: '🏅' },
  { id: 'stats', label: 'Stats', icon: '📊' },
];

export function ProfileScreen() {
  const { user, stats, setScreen, handleUnlock, handleAvatarUpdate, handleUpdateDisplayName } = useUser();
  const [activeTab, setActiveTab] = useState('avatar');
  const [localConfig, setLocalConfig] = useState(() => user.avatarConfig || {});
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.displayName || user.alias);
  const [savingName, setSavingName] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  async function handleUnlockWithLoading(itemId, cost) {
    if (unlocking) return;
    setUnlocking(true);
    await handleUnlock(itemId, cost);
    setUnlocking(false);
  }

  const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(user.avatarConfig);
  const unlockedItems = user.unlockedItems || [];
  const level = getLevel(stats.totalPoints);
  const nextLevel = getNextLevel(stats.totalPoints);
  const progress = calcProgress(stats.totalPoints);
  useEffect(() => {
    const stale = fetchAllUsersStale((fresh) => setAllUsers(fresh || []));
    if (stale) setAllUsers(stale);
  }, []);

  const earnedStickers = useMemo(() => getEarnedStickers(user, stats, allUsers), [user, stats, allUsers]);
  const earnedBadges = BADGES.filter((b) => b.condition(stats));

  const unlockedOptions = useMemo(() => {
    const result = {};
    const allKeys = [
      'skinColor', 'hair', 'hairColor', 'eyes', 'eyebrows',
      'mouth', 'glasses', 'backgroundColor', 'earrings', 'features',
    ];
    for (const key of allKeys) {
      const { unlocked } = getAvailableOptions(key, unlockedItems);
      if (unlocked.length > 0) result[key] = unlocked;
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
      {/* Back button */}
      <button
        onClick={() => setScreen('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
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
        <ArrowLeft size={16} />
        Tillbaka
      </button>

      {/* Profile header */}
      <Card style={{ textAlign: 'center', marginBottom: 20, padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <AvatarSVG avatarConfig={activeTab === 'avatar' ? localConfig : user.avatarConfig} size={100} />
        </div>
        {editingName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={20}
              autoFocus
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  setSavingName(true);
                  await handleUpdateDisplayName(nameInput.trim() || user.alias);
                  setSavingName(false);
                  setEditingName(false);
                } else if (e.key === 'Escape') {
                  setNameInput(user.displayName || user.alias);
                  setEditingName(false);
                }
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: `1px solid ${COLORS.lime}`,
                borderRadius: 8,
                color: '#fff',
                fontFamily: "'Fredoka One', cursive",
                fontSize: 20,
                padding: '4px 10px',
                textAlign: 'center',
                outline: 'none',
                width: 160,
              }}
            />
            <button
              onClick={async () => {
                setSavingName(true);
                await handleUpdateDisplayName(nameInput.trim() || user.alias);
                setSavingName(false);
                setEditingName(false);
              }}
              disabled={savingName}
              style={{
                background: COLORS.lime,
                border: 'none',
                borderRadius: 8,
                color: COLORS.dark,
                fontWeight: 700,
                fontSize: 13,
                padding: '5px 12px',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              {savingName ? '...' : 'Spara'}
            </button>
            <button
              onClick={() => { setNameInput(user.displayName || user.alias); setEditingName(false); }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                padding: '5px 10px',
                cursor: 'pointer',
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              Avbryt
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}>
            <span style={{
              color: '#fff',
              fontFamily: "'Fredoka One', cursive",
              fontSize: 22,
            }}>
              {user.displayName || user.alias}
            </span>
            <button
              onClick={() => { setNameInput(user.displayName || user.alias); setEditingName(true); }}
              title="Redigera smeknamn"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)',
                fontSize: 14,
                padding: '2px 4px',
                lineHeight: 1,
              }}
            >
              ✏️
            </button>
          </div>
        )}
        {editingName && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>
            Du loggar fortfarande in med <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>{user.alias}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <span style={{ color: COLORS.lime, fontSize: 14, fontWeight: 700 }}>
            {level.icon} {level.name}
          </span>
          <span style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: 12,
          }}>|</span>
          <span style={{ color: COLORS.lime, fontSize: 14, fontWeight: 600 }}>
            ⭐ {stats.totalPoints} poäng
          </span>
        </div>

        {/* Level progress bar */}
        <div style={{ marginTop: 12, padding: '0 8px' }}>
          <ProgressBar value={progress} color={COLORS.lime} height={8} />
          {nextLevel && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
              {nextLevel.min - stats.totalPoints}p till {nextLevel.icon} {nextLevel.name}
            </div>
          )}
        </div>

        {/* Save button (avatar tab only) */}
        {activeTab === 'avatar' && hasChanges && (
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

      {/* Tab navigation */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 16,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        padding: 4,
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 11,
                border: 'none',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                fontFamily: "'Nunito', sans-serif",
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'avatar' && (
        <AvatarTab
          localConfig={localConfig}
          setLocalConfig={setLocalConfig}
          unlockedOptions={unlockedOptions}
          unlockedItems={unlockedItems}
          stats={stats}
          user={user}
          handleUnlock={handleUnlockWithLoading}
          unlocking={unlocking}
        />
      )}
      {activeTab === 'badges' && (
        <BadgesTab earnedBadges={earnedBadges} stats={stats} />
      )}
      {activeTab === 'stickers' && (
        <StickersTab earnedStickers={earnedStickers} />
      )}
      {activeTab === 'stats' && (
        <StatsTab stats={stats} user={user} />
      )}
    </div>
  );
}

/* ─── Avatar Tab ─── */
function AvatarTab({ localConfig, setLocalConfig, unlockedOptions, unlockedItems, stats, user, handleUnlock, unlocking }) {
  return (
    <>
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
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 20,
          color: '#fff',
          marginBottom: 12,
        }}>
          Belöningar
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AVATAR_REWARDS.map((reward) => {
            const owned = unlockedItems.includes(reward.id);
            const canBuy = !owned && stats.totalPoints >= reward.cost;
            const unlockCount = Object.values(reward.unlocks).reduce(
              (sum, arr) => sum + arr.length, 0,
            );
            const previewItems = getPreviewItems(reward);
            const count = previewItems.length;
            const hasArch = count > 1;

            return (
              <Card key={reward.id} style={{ padding: '16px 16px 14px' }}>
                {/* Arch preview */}
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

                    const { backgroundColor: _bg, ...baseConfig } = user.avatarConfig || PREVIEW_BASE;
                    const previewConfig = { ...baseConfig, [item.category]: item.variant };
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{owned ? '✅' : '🔒'}</span>
                      <div>
                        <div style={{
                          color: owned ? COLORS.lime : '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                        }}>
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
                        <div style={{
                          color: canBuy ? COLORS.yellow : 'rgba(255,255,255,0.4)',
                          fontSize: 13,
                          fontWeight: 700,
                        }}>
                          {reward.cost}p
                        </div>
                        {canBuy && (
                          <button
                            onClick={() => handleUnlock(reward.id, reward.cost)}
                            disabled={unlocking}
                            className="z-40 relative"
                            style={{
                              marginTop: 4,
                              padding: '5px 14px',
                              borderRadius: 10,
                              border: 'none',
                              background: unlocking ? 'rgba(240,220,0,0.5)' : COLORS.lime,
                              color: COLORS.dark,
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: unlocking ? 'not-allowed' : 'pointer',
                              fontFamily: "'Nunito', sans-serif",
                              opacity: unlocking ? 0.7 : 1,
                              transition: 'all 0.2s',
                            }}
                          >
                            {unlocking ? <ButtonLoader color={COLORS.dark} /> : 'Lås upp!'}
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
    </>
  );
}

/* ─── Badges Tab ─── */
function BadgesTab({ earnedBadges, stats }) {
  const allBadges = BADGES;
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  return (
    <div>
      {/* Summary */}
      <div style={{
        textAlign: 'center',
        marginBottom: 16,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: 600,
      }}>
        {earnedBadges.length} av {allBadges.length} medaljer upplåsta
      </div>

      {/* Badge grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {allBadges.map((badge) => {
          const earned = earnedIds.has(badge.id);
          return (
            <Card
              key={badge.id}
              style={{
                padding: '14px 16px',
                opacity: earned ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{
                fontSize: 28,
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                background: earned ? 'rgba(240,220,0,0.12)' : 'rgba(255,255,255,0.05)',
                border: earned ? '1px solid rgba(240,220,0,0.35)' : '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
              }}>
                {earned ? badge.icon : '🔒'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: earned ? COLORS.yellow : 'rgba(255,255,255,0.5)',
                  fontWeight: 700,
                  fontSize: 14,
                }}>
                  {badge.label}
                </div>
                <div style={{
                  color: earned ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
                  fontSize: 12,
                  marginTop: 2,
                }}>
                  {getBadgeDescription(badge.id)}
                </div>
              </div>
              {earned && (
                <div style={{ color: COLORS.lime, fontSize: 18, flexShrink: 0 }}>✅</div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getBadgeDescription(id) {
  const descriptions = {
    streak7: 'Håll en streak i 7 dagar',
    streak14: 'Håll en streak i 14 dagar',
    juggle50: 'Jonglera 50 gånger i rad',
    minutes300: 'Träna totalt 5 timmar',
    paparazzi: 'Ladda upp 10 bilder i fotoalbumet',
    allExercises: 'Testa minst 7 olika övningar',
    bingo10: 'Klara 10 bingoutmaningar',
    bingo20: 'Klara 20 bingoutmaningar',
    bingo35: 'Klara 35 bingoutmaningar',
    bingo50: 'Klara alla 50 bingoutmaningar',
    bingoline: 'Klara en hel rad eller kolumn i bingo',
  };
  return descriptions[id] || '';
}

function StickersTab({ earnedStickers }) {
  const earnedIds = new Set(earnedStickers.map((sticker) => sticker.id));

  return (
    <div>
      <div
        style={{
          textAlign: 'center',
          marginBottom: 16,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {earnedStickers.length} av {STICKERS.length} stickers upplåsta
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {STICKER_GROUPS.map((group) => {
          const groupStickers = STICKERS.filter((sticker) => sticker.group === group);
          return (
            <div key={group}>
              <div
                style={{
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                {group}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {groupStickers.map((sticker) => {
                  const earned = earnedIds.has(sticker.id);
                  return (
                    <div
                      key={sticker.id}
                      style={{
                        borderRadius: 16,
                        padding: '12px 10px 10px',
                        background: earned
                          ? 'linear-gradient(160deg, rgba(240,220,0,0.18), rgba(255,255,255,0.08))'
                          : 'rgba(255,255,255,0.05)',
                        border: earned
                          ? '1px solid rgba(240,220,0,0.35)'
                          : '1px solid rgba(255,255,255,0.08)',
                        opacity: earned ? 1 : 0.42,
                        textAlign: 'center',
                        minHeight: 104,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div style={{ fontSize: 28, lineHeight: 1 }}>{earned ? sticker.icon : '🔒'}</div>
                      <div
                        style={{
                          color: earned ? COLORS.yellow : 'rgba(255,255,255,0.5)',
                          fontSize: 11,
                          fontWeight: 800,
                          lineHeight: 1.2,
                          marginTop: 8,
                        }}
                      >
                        {sticker.label}
                      </div>
                      <div
                        style={{
                          color: earned ? 'rgba(255,255,255,0.52)' : 'rgba(255,255,255,0.28)',
                          fontSize: 10,
                          lineHeight: 1.25,
                          marginTop: 5,
                        }}
                      >
                        {sticker.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Stats Tab ─── */
function StatsTab({ stats, user }) {
  return (
    <div>
      {/* Streak cards */}
      <div style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 18,
        color: '#fff',
        marginBottom: 10,
      }}>
        Streaks
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Fotboll', val: stats.streak,         icon: '⚽', color: COLORS.lime },
          { label: 'Glass',   val: stats.iceCreamStreak, icon: '🍦', color: '#f9a8d4' },
          { label: 'Bad',     val: stats.swimStreak,     icon: '🏊', color: '#60a5fa' },
          { label: 'Läsning', val: stats.readStreak,     icon: '📖', color: '#86efac' },
        ].map(({ label, val, icon, color }) => (
          <Card key={label} style={{ textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 28,
              color,
              lineHeight: 1.1,
              marginTop: 2,
            }}>
              {val}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>
              dagar i rad
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Totals */}
      <div style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 18,
        color: '#fff',
        marginBottom: 10,
      }}>
        Totalt
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Träningsmin', val: stats.totalMinutes, icon: '⏱' },
          { label: 'Touch totalt', val: stats.totalTouch, icon: '🦶' },
          { label: 'Längsta streak', val: stats.maxStreak, icon: '💪' },
          { label: 'Glassar', val: stats.totalIceCream, icon: '🍦' },
          { label: 'Bad', val: stats.totalSwim, icon: '🏊' },
          { label: 'Sidor lästa', val: stats.totalPages, icon: '📖' },
        ].map(({ label, val, icon }) => (
          <Card key={label} style={{ textAlign: 'center', padding: '12px 8px' }}>
            <div style={{ fontSize: 22 }}>{icon}</div>
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 22,
              color: '#fff',
            }}>
              {val}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Highscores */}
      {Object.keys(user.highscores || {}).length > 0 && (
        <>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 18,
            color: '#fff',
            marginBottom: 10,
          }}>
            Rekord
          </div>
          <Card style={{ marginBottom: 16 }}>
            {Object.entries(user.highscores).map(([id, val]) => {
              const ex = EXERCISES.find((e) => e.id === id);
              return ex ? (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <span>{ex.label}</span>
                  <span style={{ color: COLORS.accent, fontWeight: 700 }}>{val} i rad</span>
                </div>
              ) : null;
            })}
          </Card>
        </>
      )}
    </div>
  );
}
