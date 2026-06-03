'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, ShieldCheck, X } from 'lucide-react';
import { COLORS } from '@/constants';
import { usePhotoModeration } from '@/hooks/usePhotoModeration';
import { cn } from '@/lib/cn';
import type { Photo } from '@/types';

/**
 * Leaders' photo-approval queue (SEC — minors' photos are never published until
 * a leader has seen them). Shown on the team page only to moderators. Approving
 * publishes the photo to the album; rejecting deletes it. Hidden entirely when
 * the queue is empty so it never nags an idle leader. Tapping a thumbnail opens
 * a full-size preview so a moderator can actually see what they're approving.
 */
export function PhotoModeration() {
  const { pending, isLoading, approve, reject } = usePhotoModeration();
  const [viewing, setViewing] = useState<Photo | null>(null);

  // Nothing to moderate (or still loading the first time) — render nothing.
  if (isLoading || pending.length === 0) return null;

  const busyId =
    (approve.isPending ? (approve.variables as number) : null) ??
    (reject.isPending ? (reject.variables as number) : null);

  return (
    <div
      className="mb-4 rounded-2xl p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(0,40,100,0.85) 0%, rgba(240,180,0,0.22) 100%)',
        border: '1px solid rgba(240,220,0,0.3)',
      }}
    >
      {viewing && (
        <PhotoPreview
          photo={viewing}
          busy={busyId === viewing.id}
          onApprove={() => {
            approve.mutate(viewing.id);
            setViewing(null);
          }}
          onReject={() => {
            reject.mutate(viewing.id);
            setViewing(null);
          }}
          onClose={() => setViewing(null)}
        />
      )}
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck size={18} style={{ color: COLORS.yellow }} />
        <div className="font-display text-[18px] text-white">
          Bilder att godkänna ({pending.length})
        </div>
      </div>
      <div className="mb-3 text-[13px] leading-snug text-white/60">
        Bilder visas i lagets album först när du har godkänt dem.
      </div>

      <div className="flex flex-col gap-3">
        {pending.map((photo) => {
          const busy = busyId === photo.id;
          return (
            <div key={photo.id} className="flex items-center gap-3 rounded-xl bg-black/20 p-2.5">
              <button
                type="button"
                onClick={() => setViewing(photo)}
                aria-label={`Visa foto av ${photo.uploaderName}`}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#dfe7f4]"
              >
                {/* Auth-gated /api/photos/:id — moderators may view pending bytes. */}
                <Image
                  src={photo.url}
                  alt={`Foto av ${photo.uploaderName}`}
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-white">
                  {photo.uploaderName}
                </div>
                <div className="text-[12px] text-white/50">{photo.date}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  aria-label="Avvisa"
                  disabled={busy}
                  onClick={() => reject.mutate(photo.id)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80',
                    busy && 'opacity-40',
                  )}
                >
                  <X size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Godkänn"
                  disabled={busy}
                  onClick={() => approve.mutate(photo.id)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl font-black',
                    busy ? 'bg-white/20 text-white/50' : 'bg-hogalid-yellow text-hogalid-dark',
                  )}
                >
                  <Check size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Full-screen preview of a single pending photo so a moderator can see it
 * properly before deciding. Approving/rejecting from here runs the same
 * mutations as the inline buttons and closes the overlay.
 */
function PhotoPreview({
  photo,
  busy,
  onApprove,
  onReject,
  onClose,
}: {
  photo: Photo;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label="Stäng"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[1100] flex flex-col items-center justify-center gap-4 bg-black/85 px-4 py-6"
    >
      <div className="relative h-[60vh] w-full max-w-[460px] overflow-hidden rounded-2xl bg-[#dfe7f4]">
        {/* Auth-gated /api/photos/:id — moderators may view pending bytes. */}
        <Image
          src={photo.url}
          alt={`Foto av ${photo.uploaderName}`}
          fill
          unoptimized
          sizes="460px"
          className="object-contain"
        />
      </div>
      <div className="text-center">
        <div className="text-[15px] font-bold text-white">{photo.uploaderName}</div>
        <div className="text-[12px] text-white/50">{photo.date}</div>
      </div>
      <div className="flex w-full max-w-[460px] gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-[15px] font-bold text-white',
            busy && 'opacity-40',
          )}
        >
          <X size={18} /> Avvisa
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-black',
            busy ? 'bg-white/20 text-white/50' : 'bg-hogalid-yellow text-hogalid-dark',
          )}
        >
          <Check size={18} /> Godkänn
        </button>
      </div>
    </div>
  );
}
