'use client';

import Image from 'next/image';
import { COLORS } from '@/constants';
import type { Photo } from '@/types';
import {
  getLayoutSlots,
  getPaperRotation,
  getTapeRotation,
  type AlbumPageData,
} from './albumLayout';

interface AlbumPageProps {
  page: AlbumPageData;
  pageIndex: number;
  allPhotos: Photo[];
  onOpenPhoto: (index: number) => void;
}

const CORNER_TAPES = [
  { top: -10, left: 10, rotate: -18 },
  { top: -10, right: 10, rotate: 18 },
  { bottom: -10, left: 10, rotate: 16 },
  { bottom: -10, right: 10, rotate: -16 },
];

/**
 * One scrapbook page: photos placed on a 12-column grid as tilted polaroids.
 * The decorative paper/tape/rotation styling is genuinely dynamic per slot, so
 * it stays inline.
 */
export function AlbumPage({ page, pageIndex, allPhotos, onOpenPhoto }: AlbumPageProps) {
  const slots = getLayoutSlots(page.layout);

  return (
    <div
      className="relative min-h-[430px] overflow-hidden rounded-[28px] pt-6 pr-[18px] pb-5 pl-7"
      style={{
        background: 'linear-gradient(180deg, #fff9e8 0%, #fdf1d1 52%, #f8e7bf 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 18px 40px rgba(0,0,0,0.22)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          background:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 34px)',
        }}
      />
      <div
        className="absolute top-0 bottom-0 left-0 w-4"
        style={{
          background: 'linear-gradient(90deg, rgba(171,133,68,0.22), rgba(171,133,68,0.02))',
        }}
      />
      <div className="absolute top-[22px] bottom-[22px] left-3 w-0.5 rounded-full bg-[rgba(163,123,62,0.15)]" />

      <div className="relative z-[1] mb-3.5 flex items-center justify-between gap-3">
        <div className="text-[11px] font-black tracking-wider text-[rgba(58,42,18,0.72)] uppercase">
          Sida {pageIndex + 1}
        </div>
        <div className="text-xs text-[rgba(58,42,18,0.5)]">Sommarminnen</div>
      </div>

      <div
        className="relative z-[1] grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gridAutoRows: 'minmax(96px, auto)',
        }}
      >
        {page.photos.map((photo, index) => {
          const slot = slots[index] || slots[slots.length - 1]!;
          const globalIndex = allPhotos.findIndex((candidate) => candidate.id === photo.id);
          const frameSeed = Number(photo.id || index) + pageIndex;
          const useCornerTape = page.photos.length === 1;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onOpenPhoto(globalIndex)}
              className="relative border-none bg-none p-0 text-left"
              style={{
                gridColumn: slot.gridColumn,
                gridRow: slot.gridRow,
                aspectRatio: slot.aspectRatio,
                transform: `rotate(${slot.rotate ?? getPaperRotation(frameSeed)}deg)`,
              }}
            >
              <div
                className="relative rounded-[18px] bg-[#fffdf7] px-3 pt-3 pb-3.5"
                style={{ boxShadow: '0 14px 28px rgba(63,42,10,0.18)' }}
              >
                {useCornerTape ? (
                  CORNER_TAPES.map(({ rotate, ...pos }, tapeIndex) => (
                    <div
                      key={tapeIndex}
                      className="absolute h-5 w-[54px] rounded-lg bg-[rgba(246,228,139,0.72)] shadow-[0_6px_10px_rgba(0,0,0,0.08)]"
                      style={{ ...pos, transform: `rotate(${rotate}deg)` }}
                    />
                  ))
                ) : (
                  <div
                    className="absolute top-[-10px] left-1/2 h-6 rounded-lg bg-[rgba(246,228,139,0.72)] shadow-[0_6px_10px_rgba(0,0,0,0.08)]"
                    style={{
                      width: slot.aspectRatio === '16 / 9' ? 82 : 68,
                      transform: `translateX(-50%) rotate(${slot.tape ?? getTapeRotation(frameSeed)}deg)`,
                    }}
                  />
                )}
                <div
                  className="relative w-full overflow-hidden rounded-[14px] bg-[#dfe7f4]"
                  style={{ aspectRatio: slot.aspectRatio }}
                >
                  {/* Auth-gated /api/photos/:id can't be optimized server-side, so unoptimized. */}
                  <Image
                    src={photo.url}
                    alt={`Foto av ${photo.uploaderName}`}
                    fill
                    unoptimized
                    sizes="(max-width: 480px) 50vw, 220px"
                    className="object-cover"
                  />
                </div>
                <div className="pt-2.5">
                  <div
                    className="text-[13px] leading-tight font-black"
                    style={{ color: COLORS.navy }}
                  >
                    {photo.uploaderName}
                  </div>
                  <div className="mt-1 text-[11px] text-black/[0.52]">{photo.date}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
