'use client';

import Image from 'next/image';
import { ArrowRight, Camera } from 'lucide-react';
import { COLORS } from '@/constants';
import { Card } from '@/components/common';
import type { Photo } from '@/types';

interface PhotoAlbumCardProps {
  photos: Photo[];
  onOpen: () => void;
}

const ROTATIONS = [-3, 2, -2];

/** Team-album teaser: latest three photos as polaroids, links to /team/photos. */
export function PhotoAlbumCard({ photos, onOpen }: PhotoAlbumCardProps) {
  const latest = photos.slice(0, 3);
  return (
    <Card
      onClick={onOpen}
      className="mb-4"
      style={{
        padding: '16px 18px',
        background: 'linear-gradient(135deg, rgba(0,40,100,0.8) 0%, rgba(220,40,40,0.35) 100%)',
        border: '1px solid rgba(240,220,0,0.22)',
      }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white/[0.12]"
          style={{ color: COLORS.yellow }}
        >
          <Camera size={26} />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-extrabold tracking-[1.1px] text-white/[0.58] uppercase">
            Veckans foto
          </div>
          <div className="font-display mt-1 text-[22px] leading-[1.1] text-white">
            Lagets fotoalbum
          </div>
          <div className="mt-1.5 text-[13px] text-white/[0.62]">
            {photos.length > 0
              ? `${photos.length} bilder uppladdade hittills. Tryck för att öppna albumet och bläddra bland sidorna.`
              : 'Här samlar ni träningsbilder, lagbilder och små sommarminnen tillsammans.'}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, index) => {
              const photo = latest[index];
              const rotation = ROTATIONS[index]!;
              return (
                <div
                  key={photo?.id ?? `placeholder-${index}`}
                  className="relative min-h-[100px] rounded-[14px] bg-[#fffdf6] px-1.5 pt-1.5 pb-2 shadow-[0_10px_20px_rgba(0,0,0,0.18)]"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div
                    className="absolute top-[-6px] left-1/2 h-3.5 w-10 rounded-md bg-[rgba(246,228,139,0.7)]"
                    style={{ transform: `translateX(-50%) rotate(${rotation * -1.5}deg)` }}
                  />
                  {photo ? (
                    <>
                      <div className="relative aspect-square w-full overflow-hidden rounded-[10px] bg-[#dfe7f4]">
                        {/* Auth-gated /api/photos/:id — unoptimized. */}
                        <Image
                          src={photo.url}
                          alt={`Foto av ${photo.uploaderName}`}
                          fill
                          unoptimized
                          sizes="120px"
                          className="object-cover"
                        />
                      </div>
                      <div
                        className="mt-[5px] truncate text-[10px] font-extrabold"
                        style={{ color: COLORS.navy }}
                      >
                        {photo.uploaderName}
                      </div>
                    </>
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,rgba(223,231,244,0.95),rgba(255,255,255,0.72))] text-[22px] text-[rgba(0,40,100,0.42)]">
                      📷
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <ArrowRight size={18} className="shrink-0" style={{ color: COLORS.yellow }} />
      </div>
    </Card>
  );
}
