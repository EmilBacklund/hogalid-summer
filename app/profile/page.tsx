'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BADGES, getAvailableOptions } from '@/constants';
import { computeStats, getEarnedStickers } from '@/utils';
import { TopBar, LoadingSpinner } from '@/components/common';
import { ProfileHeader, AvatarTab, BadgesTab, StickersTab, StatsTab } from '@/components/profile';
import { useUser } from '@/providers/UserProvider';
import { useAllUsers } from '@/hooks/useAllUsers';
import { useProfileMutations } from '@/hooks/useProfileMutations';
import { cn } from '@/lib/cn';
import type { AvatarConfig, User } from '@/types';

type TabId = 'avatar' | 'stickers' | 'badges' | 'stats';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'avatar', label: 'Avatar', icon: '👧' },
  { id: 'stickers', label: 'Stickers', icon: '🌟' },
  { id: 'badges', label: 'Medaljer', icon: '🏅' },
  { id: 'stats', label: 'Stats', icon: '📊' },
];

const AVATAR_KEYS = [
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

export default function ProfilePage() {
  const { user, isLoading } = useUser();
  if (isLoading || !user) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar..." />
      </main>
    );
  }
  return <ProfileContent user={user} />;
}

function ProfileContent({ user }: { user: User }) {
  const router = useRouter();
  const { data: allUsers } = useAllUsers();
  const { updateAvatar, unlockItems, updateDisplayName } = useProfileMutations();

  const stats = useMemo(() => computeStats(user), [user]);
  const [activeTab, setActiveTab] = useState<TabId>('avatar');
  const [localConfig, setLocalConfig] = useState<AvatarConfig>(() => user.avatarConfig || {});
  const [unlocking, setUnlocking] = useState(false);

  const unlockedItems = useMemo(() => user.unlockedItems || [], [user.unlockedItems]);
  const hasChanges = JSON.stringify(localConfig) !== JSON.stringify(user.avatarConfig);

  const earnedStickers = useMemo(
    () => getEarnedStickers(user, stats, allUsers ?? []),
    [user, stats, allUsers],
  );
  const earnedBadges = useMemo(() => BADGES.filter((b) => b.condition(stats)), [stats]);

  const unlockedOptions = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const key of AVATAR_KEYS) {
      const { unlocked } = getAvailableOptions(key, unlockedItems);
      if (unlocked.length > 0) result[key] = unlocked;
    }
    return result;
  }, [unlockedItems]);

  async function handleUnlock(itemId: string, cost: number) {
    if (unlocking || stats.totalPoints < cost) return;
    setUnlocking(true);
    try {
      await unlockItems.mutateAsync([...unlockedItems, itemId]);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md">
      <TopBar />
      <div className="px-4 pt-5 pb-8">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-hogalid-yellow mb-4 flex items-center gap-1 text-[15px] font-bold"
        >
          <ArrowLeft size={16} /> Tillbaka
        </button>

        <ProfileHeader
          user={user}
          stats={stats}
          avatarConfig={activeTab === 'avatar' ? localConfig : user.avatarConfig}
          showSaveButton={activeTab === 'avatar' && hasChanges}
          savingAvatar={updateAvatar.isPending}
          onSaveAvatar={() => void updateAvatar.mutateAsync(localConfig)}
          onUpdateName={async (name) => {
            await updateDisplayName.mutateAsync(name);
          }}
        />

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-2xl bg-white/[0.06] p-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-[11px] py-2.5 text-[13px] transition-all',
                  isActive ? 'bg-white/15 font-bold text-white' : 'font-semibold text-white/45',
                )}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'avatar' && (
          <AvatarTab
            localConfig={localConfig}
            setLocalConfig={setLocalConfig}
            unlockedOptions={unlockedOptions}
            unlockedItems={unlockedItems}
            stats={stats}
            user={user}
            onUnlock={handleUnlock}
            unlocking={unlocking}
          />
        )}
        {activeTab === 'stickers' && <StickersTab earnedStickers={earnedStickers} />}
        {activeTab === 'badges' && <BadgesTab earnedBadges={earnedBadges} stats={stats} />}
        {activeTab === 'stats' && <StatsTab stats={stats} user={user} />}
      </div>
    </main>
  );
}
