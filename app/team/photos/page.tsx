'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Camera, ImagePlus } from 'lucide-react';
import { COLORS } from '@/constants';
import { getWeekStart, localToday } from '@/utils';
import { ButtonLoader, LoadingSpinner, TopBar } from '@/components/common';
import { AlbumPage, AlbumLightbox, buildAlbumPages } from '@/components/photos';
import { useUser } from '@/providers/UserProvider';
import { usePhotoAlbum } from '@/hooks/usePhotoAlbum';
import { cn } from '@/lib/cn';
import type { Photo, User } from '@/types';

const MAX_UPLOADS_PER_WEEK = 2;

function getUploadsLeft(photos: Photo[], alias: string): number {
  const weekStart = getWeekStart(localToday());
  const used = photos.filter((p) => p.alias === alias && p.weekStart === weekStart).length;
  return Math.max(0, MAX_UPLOADS_PER_WEEK - used);
}

export default function PhotoAlbumPage() {
  const { user, isLoading } = useUser();
  if (isLoading || !user) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar..." />
      </main>
    );
  }
  return <PhotoAlbumContent user={user} />;
}

function PhotoAlbumContent({ user }: { user: User }) {
  const router = useRouter();
  const { photos, isLoading, upload } = usePhotoAlbum();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageMotion, setPageMotion] = useState<'forward' | 'backward'>('forward');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  const uploadsLeft = useMemo(() => getUploadsLeft(photos, user.alias), [photos, user.alias]);
  // The album shows approved photos only; the uploader's own pending shots are
  // surfaced as a notice so they know the upload is queued for a leader.
  const albumPhotos = useMemo(() => photos.filter((p) => p.status === 'approved'), [photos]);
  const myPendingCount = useMemo(
    () => photos.filter((p) => p.alias === user.alias && p.status === 'pending').length,
    [photos, user.alias],
  );
  const pages = useMemo(() => buildAlbumPages(albumPhotos), [albumPhotos]);
  const safePageIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));

  function goToPrevPage() {
    if (safePageIndex === 0) return;
    setPageMotion('backward');
    setPageIndex(Math.max(0, safePageIndex - 1));
  }

  function goToNextPage() {
    if (safePageIndex >= pages.length - 1) return;
    setPageMotion('forward');
    setPageIndex(Math.min(pages.length - 1, safePageIndex + 1));
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartXRef.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < 50) return;
    if (deltaX > 0) goToPrevPage();
    else goToNextPage();
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Välj en bildfil.');
      return;
    }
    if (uploadsLeft <= 0) {
      alert('Du har redan laddat upp 2 bilder den här veckan.');
      return;
    }
    try {
      await upload.mutateAsync(file);
      setPageIndex(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('weekly_limit_reached')) {
        alert('Du har redan laddat upp 2 bilder den här veckan.');
      } else if (message.includes('image_too_large')) {
        alert('Bilden blev för stor. Testa en mindre bild.');
      } else {
        alert('Kunde inte ladda upp bilden: ' + message);
      }
    }
  }

  const uploading = upload.isPending;

  return (
    <main className="mx-auto min-h-screen max-w-md">
      <TopBar />
      {lightboxIndex !== null && (
        <AlbumLightbox
          photos={albumPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((c) => (c! - 1 + albumPhotos.length) % albumPhotos.length)}
          onNext={() => setLightboxIndex((c) => (c! + 1) % albumPhotos.length)}
        />
      )}

      <div className="px-4 pt-5 pb-8">
        <button
          type="button"
          onClick={() => router.push('/team')}
          className="text-hogalid-yellow mb-4 flex items-center gap-1 text-[15px] font-bold"
        >
          <ArrowLeft size={16} />
          Tillbaka
        </button>

        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08]"
            style={{ color: COLORS.yellow }}
          >
            <Camera size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-extrabold tracking-[1.1px] text-white/55 uppercase">
              Veckans foto
            </div>
            <div className="font-display mt-1 text-2xl leading-[1.06] text-white">Fotoalbumet</div>
            <div className="mt-1.5 text-[13px] text-white/65">
              {albumPhotos.length > 0
                ? `${albumPhotos.length} bilder, fördelade på ${pages.length} sida${pages.length !== 1 ? 'r' : ''}.`
                : 'Här samlas lagets sommarminnen i ett riktigt fotoalbum.'}
            </div>
          </div>
        </div>

        {/* Upload row */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-white/75">
            Du har <strong className="text-white">{uploadsLeft}</strong> uppladdning
            {uploadsLeft !== 1 ? 'ar' : ''} kvar den här veckan
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || uploadsLeft <= 0}
            className={cn(
              'inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-black',
              uploadsLeft > 0
                ? 'from-hogalid-yellow text-hogalid-navy cursor-pointer bg-gradient-to-br to-[#ffe760]'
                : 'cursor-default bg-white/[0.08] text-white/[0.42]',
            )}
          >
            {uploading ? <ButtonLoader color={COLORS.navy} /> : <ImagePlus size={18} />}
            {uploading ? 'Laddar upp...' : uploadsLeft > 0 ? 'Lägg till bild' : 'Veckan är full'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {myPendingCount > 0 && (
          <div className="border-hogalid-yellow/25 bg-hogalid-yellow/10 mb-4 rounded-2xl border px-4 py-3 text-[13px] text-white/80">
            ⏳ Du har {myPendingCount} bild{myPendingCount !== 1 ? 'er' : ''} som väntar på att en
            ledare godkänner den. Den syns i albumet så fort den är godkänd.
          </div>
        )}

        {/* Album */}
        {isLoading ? (
          <LoadingSpinner text="Laddar fotoalbumet..." />
        ) : albumPhotos.length === 0 ? (
          <div
            className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] px-6 py-9 text-center"
            style={{ background: 'linear-gradient(180deg, #fff9e8 0%, #fdf1d1 52%, #f8e7bf 100%)' }}
          >
            <div className="mb-2 text-[42px]">📷</div>
            <div className="font-display text-2xl" style={{ color: COLORS.navy }}>
              Albumet väntar på första bilden
            </div>
            <div className="mt-2.5 max-w-[260px] text-sm leading-relaxed text-[rgba(27,35,61,0.66)]">
              Lägg till en träningsbild, en lagbild eller ett sommarminne så börjar albumet fyllas.
            </div>
          </div>
        ) : (
          <>
            <div
              key={`${safePageIndex}-${pageMotion}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={cn(
                'touch-pan-y',
                pageMotion === 'backward'
                  ? 'animate-album-page-backward origin-left'
                  : 'animate-album-page-forward origin-right',
              )}
            >
              <AlbumPage
                page={pages[safePageIndex]!}
                pageIndex={safePageIndex}
                allPhotos={albumPhotos}
                onOpenPhoto={setLightboxIndex}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={safePageIndex === 0}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl bg-white/[0.08] px-3.5 py-3 font-extrabold',
                  safePageIndex === 0 ? 'text-white/[0.28]' : 'text-white',
                )}
              >
                <ArrowLeft size={16} />
                Förra sidan
              </button>

              <div className="text-center">
                <div className="font-display text-lg text-white">
                  {safePageIndex + 1}/{pages.length}
                </div>
                <div className="text-xs text-white/50">Svep eller bläddra</div>
              </div>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={safePageIndex >= pages.length - 1}
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl bg-white/[0.08] px-3.5 py-3 font-extrabold',
                  safePageIndex >= pages.length - 1 ? 'text-white/[0.28]' : 'text-white',
                )}
              >
                Nästa sidan
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
