'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAdminPhotos } from '@/hooks/useAdminPhotos';
import { cn } from '@/lib/cn';

/**
 * Admin photo moderation: a collapsible gallery of every album photo (approved
 * and pending) with per-photo delete, for taking down inappropriate images.
 * Deletion removes the bytes and the metadata row via `DELETE /api/photos/:id`.
 * Mounted only inside the admin page, and only fetches once expanded.
 */
export function PhotoGallery() {
  const [open, setOpen] = useState(false);
  const { photos, isLoading, remove, approve } = useAdminPhotos(open);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3.5 text-white"
      >
        <span>
          <span className="text-xs font-bold tracking-wider text-white/50 uppercase">
            📸 Lagets foton
          </span>
          {open && photos.length > 0 && (
            <span className="text-hogalid-yellow ml-2 text-[13px] font-bold">
              {photos.length} st
            </span>
          )}
        </span>
        <span className="text-xs text-white/40">{open ? '▲ Dölj' : '▼ Visa'}</span>
      </button>

      {open && (
        <div className="rounded-b-2xl border border-t-0 border-white/10 bg-white/[0.04] px-4 py-3">
          {isLoading ? (
            <div className="py-2 text-[13px] text-white/40">Laddar foton...</div>
          ) : photos.length === 0 ? (
            <div className="py-2 text-[13px] text-white/30">Inga foton uppladdade än.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {photos.map((photo) => {
                const busy =
                  (remove.isPending && remove.variables === photo.id) ||
                  (approve.isPending && approve.variables === photo.id);
                return (
                  <div key={photo.id} className="relative overflow-hidden rounded-xl bg-black/30">
                    <div className="relative aspect-square w-full">
                      {/* Auth-gated /api/photos/:id — admin may view pending bytes. */}
                      <Image
                        src={photo.url}
                        alt={`Foto av ${photo.uploaderName}`}
                        fill
                        unoptimized
                        sizes="180px"
                        className="object-cover"
                      />
                      {photo.status === 'pending' && (
                        <span className="text-hogalid-yellow absolute top-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold">
                          Väntar
                        </span>
                      )}
                    </div>
                    <div className="absolute right-0 bottom-0 left-0 flex items-center justify-between gap-2 bg-black/65 px-2 py-1.5">
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-bold text-white">
                          {photo.uploaderName}
                        </div>
                        <div className="text-[10px] text-white/45">{photo.date}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {photo.status === 'pending' && (
                          <button
                            type="button"
                            aria-label="Godkänn"
                            onClick={() => approve.mutate(photo.id)}
                            disabled={busy}
                            className={cn(
                              'rounded-md px-2 py-1 text-[11px] font-bold',
                              busy
                                ? 'bg-white/20 text-white/50'
                                : 'bg-hogalid-yellow text-hogalid-dark',
                            )}
                          >
                            ✓
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label="Ta bort"
                          onClick={() => remove.mutate(photo.id)}
                          disabled={busy}
                          className={cn(
                            'rounded-md px-2 py-1 text-[11px] font-bold text-white',
                            busy ? 'bg-white/20' : 'bg-[rgba(220,40,40,0.85)]',
                          )}
                        >
                          {busy ? '...' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
