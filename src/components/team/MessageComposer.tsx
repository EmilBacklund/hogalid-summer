'use client';

import { useState } from 'react';
import { Card } from '@/components/common';
import { useTeamMessages } from '@/hooks/useTeamMessages';

const MAX_LEN = 280;

/**
 * Lets a leader/admin post a short announcement to the team feed and remove
 * earlier ones. Rendered only for moderators (the API enforces this too). The
 * posted messages surface in the feed via `generateFeed`.
 */
export function MessageComposer() {
  const { messages, post, remove } = useTeamMessages();
  const [body, setBody] = useState('');

  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && !post.isPending;

  async function send() {
    if (!canSend) return;
    try {
      await post.mutateAsync(trimmed);
      setBody('');
    } catch {
      // Surfaced via post.isError below; keep the draft so nothing is lost.
    }
  }

  return (
    <Card className="mb-4">
      <div className="mb-2 text-sm font-bold text-white/70">📣 Skriv till laget</div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
        placeholder="Skriv ett kort meddelande som syns i lagflödet…"
        rows={3}
        className="focus:ring-hogalid-yellow/40 w-full resize-none rounded-xl border-[1.5px] border-white/20 bg-white/[0.08] px-3.5 py-2.5 text-[14px] text-white outline-none focus:ring-2"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-white/35">
          {body.length}/{MAX_LEN}
        </span>
        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          className="bg-hogalid-yellow text-hogalid-dark rounded-xl px-4 py-2 text-sm font-extrabold disabled:bg-white/10 disabled:text-white/35"
        >
          {post.isPending ? 'Skickar…' : 'Skicka'}
        </button>
      </div>
      {post.isError && (
        <div className="mt-2 text-xs font-semibold text-[#ff9f9f]">
          Kunde inte skicka just nu. Försök igen.
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="mb-2 text-[11px] font-bold tracking-wider text-white/40 uppercase">
            Dina senaste meddelanden
          </div>
          <div className="flex flex-col gap-2">
            {messages.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-2 rounded-xl bg-white/[0.05] px-3 py-2"
              >
                <div className="flex-1 text-[13px] text-white/80">
                  <span className="font-bold text-white">{m.authorName}</span> {m.body}
                </div>
                <button
                  type="button"
                  onClick={() => remove.mutate(m.id)}
                  disabled={remove.isPending}
                  aria-label="Ta bort meddelande"
                  className="shrink-0 rounded-lg bg-white/10 px-2 py-1 text-xs text-white/60"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
