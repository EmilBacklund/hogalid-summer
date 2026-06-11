'use client';

import { useState } from 'react';
import { getLevel, getNextLevel, calcProgress } from '@/utils';
import { Card, ProgressBar } from '@/components/common';
import { AvatarSVG } from '@/components/avatar';
import { COLORS } from '@/constants';
import { cn } from '@/lib/cn';
import type { AvatarConfig, Stats, User } from '@/types';

interface ProfileHeaderProps {
  user: User;
  stats: Stats;
  /** The avatar config to render (live edits on the avatar tab, else the saved one). */
  avatarConfig: AvatarConfig;
  showSaveButton: boolean;
  savingAvatar: boolean;
  onSaveAvatar: () => void;
  /** Persist a new display name; resolves when the write completes. */
  onUpdateName: (name: string) => Promise<void>;
}

/** Profile card: avatar, editable display name, level + points progress. */
export function ProfileHeader({
  user,
  stats,
  avatarConfig,
  showSaveButton,
  savingAvatar,
  onSaveAvatar,
  onUpdateName,
}: ProfileHeaderProps) {
  const displayAlias = user.displayAlias || user.alias;
  const shownName = user.displayName || displayAlias;
  const level = getLevel(stats.totalPoints);
  const nextLevel = getNextLevel(stats.totalPoints);
  const progress = calcProgress(stats.totalPoints);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(shownName);
  const [savingName, setSavingName] = useState(false);

  async function commitName() {
    setSavingName(true);
    await onUpdateName(nameInput.trim() || user.alias);
    setSavingName(false);
    setEditingName(false);
  }

  function startEditing() {
    setNameInput(shownName);
    setEditingName(true);
  }

  return (
    <Card className="mb-5 px-5 pt-5 pb-4 text-center">
      <div className="mb-2 flex justify-center">
        <AvatarSVG avatarConfig={avatarConfig} size={100} />
      </div>

      {editingName ? (
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={20}
            aria-label="Smeknamn"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void commitName();
              else if (e.key === 'Escape') {
                setNameInput(shownName);
                setEditingName(false);
              }
            }}
            className="border-hogalid-yellow focus:ring-hogalid-yellow/40 font-display w-40 rounded-lg border bg-white/10 px-2.5 py-1 text-center text-xl text-white outline-none focus:ring-2"
          />
          <button
            type="button"
            onClick={() => void commitName()}
            disabled={savingName}
            className="bg-hogalid-yellow text-hogalid-dark rounded-lg px-3 py-[5px] text-[13px] font-bold"
          >
            {savingName ? '...' : 'Spara'}
          </button>
          <button
            type="button"
            onClick={() => {
              setNameInput(shownName);
              setEditingName(false);
            }}
            className="rounded-lg bg-white/10 px-2.5 py-[5px] text-[13px] text-white/60"
          >
            Avbryt
          </button>
        </div>
      ) : (
        <div className="mt-1.5 flex items-center justify-center gap-1.5">
          <span className="font-display text-[22px] text-white">{shownName}</span>
          <button
            type="button"
            onClick={startEditing}
            title="Redigera smeknamn"
            aria-label="Redigera smeknamn"
            className="px-1 py-0.5 text-sm leading-none text-white/35"
          >
            ✏️
          </button>
        </div>
      )}
      {/* Always visible so it's clear the editable name above is only a
          nickname — the login username never changes. */}
      <div className="mt-1.5 text-[11px] text-white/40">
        👤 Inloggningsnamn: <span className="font-bold text-white/65">{displayAlias}</span>
      </div>
      {editingName && (
        <div className="mt-1 text-[11px] text-white/40">
          Det här ändrar bara ditt <span className="font-bold text-white/65">smeknamn</span> (vad
          andra ser) — du loggar fortfarande in med{' '}
          <span className="font-bold text-white/65">{displayAlias}</span>.
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-center gap-3">
        <span className="text-hogalid-yellow text-sm font-bold">
          {level.icon} {level.name}
        </span>
        <span className="text-xs text-white/30">|</span>
        <span className="text-hogalid-yellow text-sm font-semibold">
          ⭐ {stats.totalPoints} poäng
        </span>
      </div>

      <div className="mt-3 px-2">
        <ProgressBar value={progress} color={COLORS.lime} height={8} />
        {nextLevel && (
          <div className="mt-1 text-[11px] text-white/40">
            {nextLevel.min - stats.totalPoints}p till {nextLevel.icon} {nextLevel.name}
          </div>
        )}
      </div>

      {showSaveButton && (
        <button
          type="button"
          onClick={onSaveAvatar}
          disabled={savingAvatar}
          className={cn(
            'bg-hogalid-yellow text-hogalid-dark mt-3 rounded-xl px-7 py-2.5 text-sm font-bold',
            savingAvatar && 'cursor-not-allowed opacity-60',
          )}
        >
          {savingAvatar ? 'Sparar...' : 'Spara ändringar'}
        </button>
      )}
    </Card>
  );
}
