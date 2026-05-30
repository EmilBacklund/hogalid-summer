'use client';

import { COLORS } from '@/constants';
import { ButtonLoader } from '@/components/common';
import type { BingoTile } from '@/types';

interface ChallengeListProps {
  items: BingoTile[];
  doneIds: string[];
  selectedChallenge: BingoTile | null;
  setSelectedChallenge: (challenge: BingoTile | null) => void;
  justDoneId: string | null;
  busy: boolean;
  onMarkDone: (id: string) => void;
  theme?: 'dark' | 'light';
}

/**
 * Tappable list of challenges; tapping an undone row expands a "mark done"
 * action. The dark/light theme drives a palette of rgba colors, so those values
 * stay inline (genuinely computed per theme + per row state).
 */
export function ChallengeList({
  items,
  doneIds,
  selectedChallenge,
  setSelectedChallenge,
  justDoneId,
  busy,
  onMarkDone,
  theme = 'dark',
}: ChallengeListProps) {
  const isLight = theme === 'light';
  const cardBg = isLight ? 'rgba(29,53,87,0.06)' : 'rgba(255,255,255,0.06)';
  const doneBg = isLight ? 'rgba(168,230,61,0.18)' : 'rgba(168,230,61,0.1)';
  const baseBorder = isLight ? 'rgba(29,53,87,0.12)' : 'rgba(255,255,255,0.08)';
  const iconBorder = isLight ? 'rgba(29,53,87,0.25)' : 'rgba(255,255,255,0.2)';
  const textColor = isLight ? '#1d3557' : '#fff';
  const doneTextColor = isLight ? 'rgba(29,53,87,0.55)' : 'rgba(255,255,255,0.5)';
  const secondaryColor = isLight ? 'rgba(29,53,87,0.68)' : 'rgba(255,255,255,0.6)';
  const closeBorder = isLight ? 'rgba(29,53,87,0.18)' : 'rgba(255,255,255,0.2)';
  const selectedBg = isLight ? 'rgba(168,230,61,0.16)' : 'rgba(168,230,61,0.08)';

  return (
    <div className="flex flex-col gap-2">
      {items.map((challenge) => {
        const isDone = doneIds.includes(challenge.id);
        const isJust = justDoneId === challenge.id;
        const isSelected = selectedChallenge?.id === challenge.id;
        return (
          <div key={challenge.id}>
            <button
              type="button"
              onClick={() => !isDone && setSelectedChallenge(isSelected ? null : challenge)}
              disabled={isDone}
              className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-all"
              style={{
                background: isDone ? doneBg : cardBg,
                border: `1px solid ${isDone ? `${COLORS.lime}55` : isSelected ? COLORS.lime : baseBorder}`,
                borderRadius: isSelected ? '14px 14px 0 0' : 14,
                cursor: isDone ? 'default' : 'pointer',
                opacity: isDone ? 0.72 : 1,
                transform: isJust ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
                style={{
                  border: `2px solid ${isDone ? COLORS.lime : iconBorder}`,
                  background: isDone ? COLORS.lime : 'transparent',
                  color: isLight && !isDone ? '#1d3557' : undefined,
                }}
              >
                {isDone ? '✓' : challenge.cat}
              </div>
              <div className="flex-1">
                <div
                  className="text-sm leading-snug font-semibold"
                  style={{
                    color: isDone ? doneTextColor : textColor,
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}
                >
                  {challenge.label}
                </div>
              </div>
              <div
                className="shrink-0 text-[13px] font-extrabold"
                style={{ color: isDone ? COLORS.lime : COLORS.accent }}
              >
                {isDone ? '✅' : `+${challenge.points}p`}
              </div>
            </button>
            {isSelected && !isDone && (
              <div
                className="px-3.5 py-3"
                style={{
                  background: selectedBg,
                  border: `1px solid ${COLORS.lime}`,
                  borderTop: 'none',
                  borderRadius: '0 0 14px 14px',
                }}
              >
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onMarkDone(challenge.id)}
                    disabled={busy}
                    className="font-display flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-base"
                    style={{
                      background: busy ? 'rgba(240,220,0,0.5)' : COLORS.lime,
                      color: COLORS.dark,
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy ? (
                      <>
                        <ButtonLoader color={COLORS.dark} /> Sparar...
                      </>
                    ) : (
                      '✅ Klart!'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChallenge(null)}
                    disabled={busy}
                    className="rounded-xl px-4 py-3 text-sm"
                    style={{
                      border: `1px solid ${closeBorder}`,
                      background: 'transparent',
                      color: secondaryColor,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
