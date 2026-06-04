'use client';

import Image from 'next/image';
import { ArrowLeftCircle, ArrowRightCircle, Camera, X } from 'lucide-react';
import { COLORS } from '@/constants';
import type { Photo } from '@/types';

interface AlbumLightboxProps {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/** Full-screen single-photo viewer with prev/next navigation. */
export function AlbumLightbox({ photos, index, onClose, onPrev, onNext }: AlbumLightboxProps) {
  const photo = photos[index];
  if (!photo) return null;

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
        if (e.key === 'ArrowLeft') onPrev();
        if (e.key === 'ArrowRight') onNext();
      }}
      className="fixed inset-0 z-[1400] flex items-center justify-center bg-[rgba(0,7,20,0.9)] px-4 py-7"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Foto"
        className="relative w-full max-w-[420px]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Stäng"
          className="absolute -top-2.5 -right-0.5 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.12] text-white"
        >
          <X size={18} />
        </button>

        <div className="rounded-3xl bg-[#fffdf4] px-3.5 pt-3.5 pb-[18px] shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
          <div className="relative max-h-[58vh] w-full overflow-hidden rounded-[18px]">
            <div className="relative aspect-[3/4] max-h-[58vh] w-full">
              {/* Auth-gated /api/photos/:id can't be optimized server-side, so unoptimized. */}
              <Image
                src={photo.url}
                alt={`Foto uppladdat av ${photo.uploaderName}`}
                fill
                unoptimized
                sizes="(max-width: 480px) 100vw, 420px"
                className="object-cover"
              />
            </div>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Föregående"
                  className="absolute top-1/2 left-2.5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white"
                >
                  <ArrowLeftCircle size={24} />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Nästa"
                  className="absolute top-1/2 right-2.5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white"
                >
                  <ArrowRightCircle size={24} />
                </button>
              </>
            )}
          </div>

          <div className="mt-3.5">
            <div
              className="inline-flex items-center gap-2 rounded-full bg-[rgba(0,40,100,0.08)] px-3 py-[7px] text-xs font-extrabold"
              style={{ color: COLORS.navy }}
            >
              <Camera size={14} />
              {photo.uploaderName}
            </div>
            <div className="mt-2.5 text-[13px] text-black/[0.58]">Uppladdad {photo.date}</div>
            <div className="font-display mt-2 text-xl leading-tight" style={{ color: COLORS.navy }}>
              Veckans foto
            </div>
            <div className="mt-1 text-[13px] text-black/[0.62]">
              Bild {index + 1} av {photos.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
