'use client';

import { forwardRef, useState } from 'react';
import { COLORS } from '@/constants';
import { Card } from '@/components/common';
import { cn } from '@/lib/cn';
import type { FeedEvent } from '@/types';
import type { ReactionMap } from '@/hooks/useReactions';

const FEED_PAGE_SIZE = 20;
const REACTION_EMOJIS = ['🔥', '👏', '⚽', '💪'];

interface ActivityFeedProps {
  feed: FeedEvent[];
  myAlias: string;
  reactions: ReactionMap;
  onToggleReaction: (eventKey: string, emoji: string) => void;
  onOpenPhoto: () => void;
  defaultExpanded?: boolean;
}

/** Team activity feed with per-event emoji reactions + pagination. */
export const ActivityFeed = forwardRef<HTMLDivElement, ActivityFeedProps>(function ActivityFeed(
  { feed, myAlias, reactions, onToggleReaction, onOpenPhoto, defaultExpanded = false },
  ref,
) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [page, setPage] = useState(0);

  if (feed.length === 0) return <div ref={ref} />;

  const totalPages = Math.ceil(feed.length / FEED_PAGE_SIZE);
  const pageStart = page * FEED_PAGE_SIZE;
  const paginated = feed.slice(pageStart, pageStart + FEED_PAGE_SIZE);

  function renderEvent(e: FeedEvent, idx: number) {
    const isMaxLevel = e.type === 'weeklylevel' && e.text.includes('Nivå 10');
    const isTeamLevel = e.type === 'teamlevel';
    const isTeamEvent = e.type === 'weeklylevel' || e.type === 'weeklyend' || isTeamLevel;
    const eventKey = `${e.type}|${e.alias}|${e.date}|${e.icon}`;
    const eventReactions = reactions[eventKey] || {};
    const counts: Record<string, number> = {};
    Object.values(eventReactions).forEach((em) => {
      counts[em] = (counts[em] || 0) + 1;
    });
    const myReaction = eventReactions[myAlias];
    const bg = isMaxLevel
      ? 'rgba(255,100,0,0.1)'
      : isTeamLevel
        ? 'rgba(139,92,246,0.1)'
        : isTeamEvent
          ? 'rgba(255,255,255,0.06)'
          : e.isMe
            ? 'rgba(240,220,0,0.08)'
            : 'rgba(255,255,255,0.04)';
    const border = isMaxLevel
      ? '2px solid #ff6a00'
      : isTeamLevel
        ? '1px solid rgba(139,92,246,0.5)'
        : isTeamEvent
          ? '1px solid rgba(255,255,255,0.12)'
          : e.isMe
            ? '1px solid rgba(240,220,0,0.25)'
            : '1px solid transparent';
    const aliasColor = isMaxLevel
      ? '#ff6a00'
      : isTeamLevel
        ? '#a78bfa'
        : isTeamEvent
          ? COLORS.lime
          : e.isMe
            ? COLORS.yellow
            : COLORS.lime;
    const textColor = isMaxLevel
      ? 'rgba(255,100,0,0.9)'
      : isTeamLevel
        ? 'rgba(167,139,250,0.9)'
        : e.isMe
          ? 'rgba(240,220,0,0.8)'
          : 'rgba(255,255,255,0.7)';

    const isPhoto = e.type === 'photo';
    return (
      <div
        key={idx}
        role={isPhoto ? 'button' : undefined}
        tabIndex={isPhoto ? 0 : undefined}
        onClick={isPhoto ? onOpenPhoto : undefined}
        onKeyDown={
          isPhoto
            ? (evt) => {
                if (evt.key === 'Enter' || evt.key === ' ') {
                  evt.preventDefault();
                  onOpenPhoto();
                }
              }
            : undefined
        }
        className={cn('rounded-xl px-3 py-2', isMaxLevel && 'animate-fire-glow')}
        style={{ background: bg, border, cursor: isPhoto ? 'pointer' : 'default' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 text-xl">{e.icon}</div>
          <div className="flex-1">
            <span className="text-[13px] font-bold" style={{ color: aliasColor }}>
              {e.alias}
            </span>
            <span className="text-[13px]" style={{ color: textColor }}>
              {' '}
              {e.text}
            </span>
          </div>
          <div className="shrink-0 text-[11px] text-white/25">{e.date}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {REACTION_EMOJIS.map((emoji) => {
            const count = counts[emoji] || 0;
            const mine = myReaction === emoji;
            return (
              <button
                key={emoji}
                type="button"
                aria-pressed={mine}
                aria-label={`Reagera med ${emoji}`}
                onClick={(evt) => {
                  evt.stopPropagation();
                  onToggleReaction(eventKey, mine ? '' : emoji);
                }}
                className="flex items-center gap-1 rounded-[20px] border px-2.5 py-[3px] text-[13px]"
                style={{
                  background: mine ? 'rgba(240,220,0,0.2)' : 'rgba(255,255,255,0.07)',
                  borderColor: mine ? 'rgba(240,220,0,0.4)' : 'rgba(255,255,255,0.12)',
                  color: mine ? COLORS.yellow : 'rgba(255,255,255,0.6)',
                }}
              >
                {emoji}
                {count > 0 && <span className="text-[11px]">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={ref} className="scroll-mt-2" />
      <Card className="mb-4">
        <div className="mb-3 text-sm font-bold text-white/70">📰 Lagflöde</div>
        {!expanded ? (
          <>
            <div className="flex flex-col gap-2">{feed.slice(0, 3).map(renderEvent)}</div>
            {feed.length > 3 && (
              <button
                type="button"
                onClick={() => {
                  setExpanded(true);
                  setPage(0);
                }}
                className="mt-2.5 w-full text-center text-xs text-white/40"
              >
                ▼ Visa alla {feed.length} händelser
              </button>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {paginated.map((e, idx) => renderEvent(e, pageStart + idx))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((v) => v - 1)}
                disabled={page === 0}
                aria-label="Föregående sida"
                className={cn('text-xl', page === 0 ? 'text-white/15' : 'text-white/50')}
              >
                ←
              </button>
              <span className="text-xs text-white/30">
                Sida {page + 1} av {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((v) => v + 1)}
                disabled={page >= totalPages - 1}
                aria-label="Nästa sida"
                className={cn(
                  'text-xl',
                  page >= totalPages - 1 ? 'text-white/15' : 'text-white/50',
                )}
              >
                →
              </button>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="mt-1.5 w-full text-center text-xs text-white/40"
            >
              ▲ Visa färre
            </button>
          </>
        )}
      </Card>
    </>
  );
});
