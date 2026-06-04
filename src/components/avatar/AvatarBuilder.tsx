'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/constants';
import type { AvatarConfig } from '@/types';
import { cn } from '@/lib/cn';
import { AvatarSVG } from './AvatarSVG';

const SELECTED_RING = 'border-hogalid-yellow shadow-[0_0_8px_#f0dc0066]';
const UNSELECTED_RING = 'border-white/15';

/** Mini avatar preview used as a selectable option for variant categories. */
function AvatarPreviewButton({
  avatarConfig,
  categoryKey,
  value,
  selected,
  onClick,
  compact,
}: {
  avatarConfig: AvatarConfig;
  categoryKey: string;
  value: string;
  selected: boolean;
  onClick: () => void;
  compact: boolean;
}) {
  const sz = compact ? 40 : 46;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: sz, height: sz }}
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] bg-transparent transition-all',
        selected ? SELECTED_RING : UNSELECTED_RING,
      )}
    >
      <AvatarSVG avatarConfig={{ ...avatarConfig, [categoryKey]: value }} size={sz - 6} />
    </button>
  );
}

/** Color swatch option. */
function ColorButton({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: `#${color}` }}
      className={cn(
        'h-9 w-9 shrink-0 rounded-full border-[3px] transition-all',
        selected ? SELECTED_RING : UNSELECTED_RING,
      )}
      aria-label={`Färg #${color}`}
    />
  );
}

/** "None" option for optional categories. */
function NoneButton({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ingen"
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold transition-all',
        selected
          ? 'border-hogalid-yellow bg-hogalid-yellow text-hogalid-dark'
          : 'border-white/15 bg-white/10 text-white/40',
      )}
    >
      ✕
    </button>
  );
}

interface AvatarBuilderProps {
  avatarConfig: AvatarConfig;
  onChange: (next: AvatarConfig) => void;
  starterOptions: Record<string, string[]>;
  unlockedOptions?: Record<string, string[]>;
  /** Smaller sizing for tight spaces (e.g. the login screen). */
  compact?: boolean;
}

/** Shared avatar customization UI (tabs per category + option grids). */
export function AvatarBuilder({
  avatarConfig,
  onChange,
  starterOptions,
  unlockedOptions = {},
  compact = false,
}: AvatarBuilderProps) {
  const [activeTab, setActiveTab] = useState('hair');

  const visibleCats = CATEGORIES.filter((cat) => {
    if (cat.alwaysVisible) return true;
    return (
      (starterOptions[cat.key]?.length ?? 0) > 0 || (unlockedOptions[cat.key]?.length ?? 0) > 0
    );
  });

  const activeCat = CATEGORIES.find((c) => c.key === activeTab) ?? CATEGORIES[0]!;
  const starterVals = starterOptions[activeTab] ?? [];
  const unlockedVals = unlockedOptions[activeTab] ?? [];
  const isOptional = !activeCat.alwaysVisible || activeTab === 'glasses';
  const currentValue = avatarConfig[activeTab];

  const select = (value: string | null) => onChange({ ...avatarConfig, [activeTab]: value });

  const renderOption = (val: string) =>
    activeCat.type === 'color' ? (
      <ColorButton
        key={val}
        color={val}
        selected={currentValue === val}
        onClick={() => select(val)}
      />
    ) : (
      <AvatarPreviewButton
        key={val}
        avatarConfig={avatarConfig}
        categoryKey={activeTab}
        value={val}
        selected={currentValue === val}
        onClick={() => select(val)}
        compact={compact}
      />
    );

  return (
    <div>
      {/* Category tabs */}
      <div className={cn('flex flex-wrap gap-1.5 pb-2', compact ? 'mb-2.5' : 'mb-3.5')}>
        {visibleCats.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveTab(cat.key)}
            className={cn(
              'shrink-0 rounded-[20px] font-bold whitespace-nowrap transition-all',
              compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-[13px]',
              activeTab === cat.key
                ? 'bg-hogalid-yellow text-hogalid-dark'
                : 'bg-white/10 text-white/60',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Starter options */}
      <div
        className={cn(
          'flex flex-wrap',
          compact ? 'gap-1.5' : 'gap-2',
          unlockedVals.length > 0 && 'mb-1.5',
        )}
      >
        {isOptional && <NoneButton selected={currentValue == null} onClick={() => select(null)} />}
        {starterVals.map(renderOption)}
      </div>

      {/* Unlocked options */}
      {unlockedVals.length > 0 && (
        <>
          <div className="my-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-[rgba(240,220,0,0.25)]" />
            <span className="text-hogalid-yellow text-[10px] font-bold tracking-[1px] uppercase">
              Upplåst
            </span>
            <div className="h-px flex-1 bg-[rgba(240,220,0,0.25)]" />
          </div>
          <div className={cn('flex flex-wrap', compact ? 'gap-1.5' : 'gap-2')}>
            {unlockedVals.map(renderOption)}
          </div>
        </>
      )}
    </div>
  );
}
