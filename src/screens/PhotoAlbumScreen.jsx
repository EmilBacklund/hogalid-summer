import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftCircle,
  ArrowRight,
  ArrowRightCircle,
  Camera,
  ImagePlus,
  X,
} from 'lucide-react';
import { COLORS } from '../constants';
import { ButtonLoader, LoadingSpinner } from '../components/common';
import { useUser } from '../context/UserContext';
import {
  apiPost,
  apiPut,
  fetchTeamPhotos,
  fetchTeamPhotosStale,
  getWeekStart,
  invalidatePhotosCache,
  localToday,
} from '../utils';

const MAX_UPLOADS_PER_WEEK = 2;
const PAGE_PATTERNS = [
  { key: 'hero-side', count: 3 },
  { key: 'duo', count: 2 },
  { key: 'solo', count: 1 },
  { key: 'grid', count: 4 },
  { key: 'top-strip', count: 3 },
];

function getPhotoSrc(photo) {
  return photo.imageUrl || photo.imageData || '';
}

function getUploadsLeft(photos, alias) {
  const weekStart = getWeekStart(localToday());
  const used = photos.filter((photo) => photo.alias === alias && photo.weekStart === weekStart).length;
  return Math.max(0, MAX_UPLOADS_PER_WEEK - used);
}

function getTapeRotation(seed) {
  const values = [-8, 7, -5, 10, -6, 4];
  return values[seed % values.length];
}

function getPaperRotation(seed) {
  const values = [-3, 2, -1, 4, -4, 1];
  return values[seed % values.length];
}

function getLayoutSlots(layoutKey) {
  if (layoutKey === 'solo') {
    return [
      { gridColumn: '2 / 12', gridRow: '1 / 3', aspectRatio: '3 / 4', rotate: -2, tape: -6 },
    ];
  }
  if (layoutKey === 'duo') {
    return [
      { gridColumn: '1 / 7', gridRow: '1 / 3', aspectRatio: '3 / 4', rotate: -3, tape: -8 },
      { gridColumn: '7 / 13', gridRow: '1 / 3', aspectRatio: '3 / 4', rotate: 2, tape: 7 },
    ];
  }
  if (layoutKey === 'grid') {
    return [
      { gridColumn: '1 / 7', gridRow: '1 / 2', aspectRatio: '4 / 3', rotate: -2, tape: -6 },
      { gridColumn: '7 / 13', gridRow: '1 / 2', aspectRatio: '4 / 3', rotate: 3, tape: 8 },
      { gridColumn: '1 / 7', gridRow: '2 / 3', aspectRatio: '4 / 3', rotate: 1, tape: -4 },
      { gridColumn: '7 / 13', gridRow: '2 / 3', aspectRatio: '4 / 3', rotate: -3, tape: 6 },
    ];
  }
  if (layoutKey === 'top-strip') {
    return [
      { gridColumn: '1 / 13', gridRow: '1 / 2', aspectRatio: '16 / 9', rotate: -2, tape: -6 },
      { gridColumn: '1 / 6', gridRow: '2 / 3', aspectRatio: '3 / 4', rotate: 2, tape: 8 },
      { gridColumn: '8 / 13', gridRow: '2 / 3', aspectRatio: '3 / 4', rotate: -3, tape: -8 },
    ];
  }
  return [
    { gridColumn: '1 / 8', gridRow: '1 / 3', aspectRatio: '3 / 4', rotate: -3, tape: -6 },
    { gridColumn: '8 / 13', gridRow: '1 / 2', aspectRatio: '1 / 1', rotate: 3, tape: 7 },
    { gridColumn: '8 / 13', gridRow: '2 / 3', aspectRatio: '1 / 1', rotate: -2, tape: -5 },
  ];
}

function getFallbackLayout(count, pageIndex) {
  if (count <= 1) return 'solo';
  if (count === 2) return 'duo';
  if (count === 4) return 'grid';
  return pageIndex % 2 === 0 ? 'hero-side' : 'top-strip';
}

function buildAlbumPages(photos) {
  const pages = [];
  let cursor = 0;
  let pageIndex = 0;

  while (cursor < photos.length) {
    const remaining = photos.length - cursor;
    const pattern = PAGE_PATTERNS[pageIndex % PAGE_PATTERNS.length];
    const count = Math.min(pattern.count, remaining);
    const layout = count === pattern.count ? pattern.key : getFallbackLayout(count, pageIndex);
    pages.push({
      layout,
      photos: photos.slice(cursor, cursor + count),
    });
    cursor += count;
    pageIndex += 1;
  }

  return pages;
}

async function fileToCompressedDataUrl(file) {
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imageUrl;
    });

    const maxWidth = 1400;
    const scale = Math.min(1, maxWidth / img.width);
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.84;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > 1_800_000 && quality > 0.5) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function AlbumLightbox({ photos, index, onClose, onPrev, onNext }) {
  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'rgba(0, 7, 20, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: -10,
            right: -2,
            zIndex: 2,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            width: 36,
            height: 36,
            borderRadius: 999,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <X size={18} style={{ marginTop: 2 }} />
        </button>

        <div
          style={{
            background: '#fffdf4',
            borderRadius: 24,
            padding: '14px 14px 18px',
            boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={getPhotoSrc(photo)}
              alt={`Foto uppladdat av ${photo.uploaderName}`}
              style={{
                width: '100%',
                maxHeight: '58vh',
                objectFit: 'cover',
                borderRadius: 18,
                display: 'block',
              }}
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={onPrev}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.35)',
                    border: 'none',
                    borderRadius: 999,
                    color: '#fff',
                    cursor: 'pointer',
                    width: 40,
                    height: 40,
                  }}
                >
                  <ArrowLeftCircle size={24} />
                </button>
                <button
                  onClick={onNext}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.35)',
                    border: 'none',
                    borderRadius: 999,
                    color: '#fff',
                    cursor: 'pointer',
                    width: 40,
                    height: 40,
                  }}
                >
                  <ArrowRightCircle size={24} />
                </button>
              </>
            )}
          </div>

          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                borderRadius: 999,
                background: 'rgba(0,40,100,0.08)',
                color: COLORS.navy,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <Camera size={14} />
              {photo.uploaderName}
            </div>
            <div style={{ color: 'rgba(0,0,0,0.58)', fontSize: 13, marginTop: 10 }}>
              Uppladdad {photo.date}
            </div>
            <div
              style={{
                color: COLORS.navy,
                fontFamily: "'Fredoka One', cursive",
                fontSize: 20,
                lineHeight: 1.2,
                marginTop: 8,
              }}
            >
              Veckans foto
            </div>
            <div style={{ color: 'rgba(0,0,0,0.62)', fontSize: 13, marginTop: 4 }}>
              Bild {index + 1} av {photos.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlbumPage({ page, pageIndex, allPhotos, onOpenPhoto }) {
  const slots = getLayoutSlots(page.layout);

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 430,
        borderRadius: 28,
        padding: '24px 18px 20px 28px',
        background:
          'linear-gradient(180deg, #fff9e8 0%, #fdf1d1 52%, #f8e7bf 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 18px 40px rgba(0,0,0,0.22)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 34px)',
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 16,
          background: 'linear-gradient(90deg, rgba(171,133,68,0.22), rgba(171,133,68,0.02))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 22,
          bottom: 22,
          width: 2,
          background: 'rgba(163,123,62,0.15)',
          borderRadius: 999,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ color: 'rgba(58,42,18,0.72)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.1 }}>
          Sida {pageIndex + 1}
        </div>
        <div style={{ color: 'rgba(58,42,18,0.5)', fontSize: 12 }}>
          Sommarminnen
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
          gridAutoRows: 'minmax(96px, auto)',
          gap: 12,
          zIndex: 1,
        }}
      >
        {page.photos.map((photo, index) => {
          const slot = slots[index] || slots[slots.length - 1];
          const globalIndex = allPhotos.findIndex((candidate) => candidate.id === photo.id);
          const frameSeed = Number(photo.id || index) + pageIndex;
          const useCornerTape = page.photos.length === 1;
          return (
            <button
              key={photo.id}
              onClick={() => onOpenPhoto(globalIndex)}
              style={{
                ...slot,
                position: 'relative',
                border: 'none',
                padding: 0,
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transform: `rotate(${slot.rotate ?? getPaperRotation(frameSeed)}deg)`,
              }}
              >
                <div
                  style={{
                    position: 'relative',
                    background: '#fffdf7',
                  borderRadius: 18,
                  padding: '12px 12px 14px',
                    boxShadow: '0 14px 28px rgba(63,42,10,0.18)',
                  }}
                >
                {useCornerTape ? (
                  <>
                    {[
                      { top: -10, left: 10, rotate: -18 },
                      { top: -10, right: 10, rotate: 18 },
                      { bottom: -10, left: 10, rotate: 16 },
                      { bottom: -10, right: 10, rotate: -16 },
                    ].map((tape, tapeIndex) => (
                      <div
                        key={tapeIndex}
                        style={{
                          position: 'absolute',
                          width: 54,
                          height: 20,
                          borderRadius: 8,
                          background: 'rgba(246, 228, 139, 0.72)',
                          boxShadow: '0 6px 10px rgba(0,0,0,0.08)',
                          ...tape,
                          transform: `rotate(${tape.rotate}deg)`,
                        }}
                      />
                    ))}
                  </>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      width: slot.aspectRatio === '16 / 9' ? 82 : 68,
                      height: 24,
                      transform: `translateX(-50%) rotate(${slot.tape ?? getTapeRotation(frameSeed)}deg)`,
                      borderRadius: 8,
                      background: 'rgba(246, 228, 139, 0.72)',
                      boxShadow: '0 6px 10px rgba(0,0,0,0.08)',
                    }}
                  />
                )}
                <div style={{ position: 'relative' }}>
                  <img
                    src={getPhotoSrc(photo)}
                    alt={`Foto av ${photo.uploaderName}`}
                    style={{
                      width: '100%',
                      display: 'block',
                      objectFit: 'cover',
                      borderRadius: 14,
                      aspectRatio: slot.aspectRatio,
                      background: '#dfe7f4',
                      opacity: photo.status === 'pending' ? 0.6 : 1,
                    }}
                  />
                  {photo.status === 'pending' && (
                    <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '3px 7px', color: '#fbbf24', fontSize: 10, fontWeight: 800 }}>
                      🕐 Väntar
                    </div>
                  )}
                </div>
                <div style={{ paddingTop: 10 }}>
                  <div style={{ color: COLORS.navy, fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>
                    {photo.uploaderName}
                  </div>
                  <div style={{ color: 'rgba(0,0,0,0.52)', fontSize: 11, marginTop: 4 }}>
                    {photo.date}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PhotoAlbumModal({
  initialPhotos = null,
  onPhotosChange,
  onClose,
}) {
  const { user, isLeader } = useUser();
  const [photos, setPhotos] = useState(initialPhotos || []);
  const [loading, setLoading] = useState(!initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageMotion, setPageMotion] = useState('forward');
  const [approvingPhoto, setApprovingPhoto] = useState({});
  const fileInputRef = useRef(null);
  const touchStartXRef = useRef(null);

  useEffect(() => {
    if (initialPhotos) {
      setPhotos(initialPhotos);
      setLoading(false);
    }
  }, [initialPhotos]);

  useEffect(() => {
    const stale = fetchTeamPhotosStale((fresh) => {
      const nextPhotos = fresh || [];
      setPhotos(nextPhotos);
      onPhotosChange?.(nextPhotos);
      setLoading(false);
    });
    if (stale) {
      setPhotos(stale);
      onPhotosChange?.(stale);
      setLoading(false);
    }

    fetchTeamPhotos()
      .then((fresh) => {
        const nextPhotos = fresh || [];
        setPhotos(nextPhotos);
        onPhotosChange?.(nextPhotos);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [onPhotosChange]);

  const uploadsLeft = useMemo(() => getUploadsLeft(photos, user.alias), [photos, user.alias]);

  // Players only see approved photos (plus their own pending ones)
  const visiblePhotos = useMemo(() => {
    if (isLeader) return photos;
    return photos.filter(p => p.status === 'approved' || p.status == null || p.alias === user.alias);
  }, [photos, isLeader, user.alias]);

  const pendingPhotos = useMemo(() => photos.filter(p => p.status === 'pending'), [photos]);

  const pages = useMemo(() => buildAlbumPages(visiblePhotos), [visiblePhotos]);

  async function approvePhoto(id, status) {
    setApprovingPhoto(prev => ({ ...prev, [id]: true }));
    try {
      await apiPut('/photos', { id, status });
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      invalidatePhotosCache();
    } catch (e) {
      alert('Kunde inte uppdatera foto: ' + e.message);
    }
    setApprovingPhoto(prev => ({ ...prev, [id]: false }));
  }

  useEffect(() => {
    if (pageIndex > pages.length - 1) {
      setPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pageIndex, pages.length]);

  function goToPrevPage() {
    if (pageIndex === 0) return;
    setPageMotion('backward');
    setPageIndex((current) => Math.max(0, current - 1));
  }

  function goToNextPage() {
    if (pageIndex >= pages.length - 1) return;
    setPageMotion('forward');
    setPageIndex((current) => Math.min(pages.length - 1, current + 1));
  }

  function handleTouchStart(event) {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event) {
    if (touchStartXRef.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) < 50) return;
    if (deltaX > 0) {
      goToPrevPage();
    } else {
      goToNextPage();
    }
  }

  async function onFileChange(event) {
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

    setUploading(true);
    try {
      const imageData = await fileToCompressedDataUrl(file);
      const result = await apiPost('/photos', {
        alias: user.alias,
        imageData,
        mimeType: 'image/jpeg',
      });
      const nextPhotos = [result.photo, ...photos];
      invalidatePhotosCache();
      setPhotos(nextPhotos);
      onPhotosChange?.(nextPhotos);
      setPageIndex(0);
    } catch (error) {
      if ((error.message || '').includes('weekly_limit_reached')) {
        alert('Du har redan laddat upp 2 bilder den här veckan.');
      } else if ((error.message || '').includes('image_too_large')) {
        alert('Bilden blev för stor. Testa en mindre bild.');
      } else {
        alert('Kunde inte ladda upp bilden: ' + error.message);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(0, 10, 30, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px 12px',
      }}
    >
      {lightboxIndex !== null && (
        <AlbumLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((current) => (current - 1 + photos.length) % photos.length)}
          onNext={() => setLightboxIndex((current) => (current + 1) % photos.length)}
        />
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          maxHeight: '92vh',
          borderRadius: 30,
          overflow: 'hidden',
          background:
            'linear-gradient(180deg, rgba(0,27,76,0.98) 0%, rgba(0,40,100,0.97) 54%, rgba(6,18,52,0.99) 100%)',
          border: '1px solid rgba(240,220,0,0.24)',
          boxShadow: '0 28px 80px rgba(0,0,0,0.42)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <style>{`
          @keyframes albumPageInForward {
            0% {
              opacity: 0;
              transform: translateX(48px) rotateY(-10deg) scale(0.98);
            }
            100% {
              opacity: 1;
              transform: translateX(0) rotateY(0deg) scale(1);
            }
          }
          @keyframes albumPageInBackward {
            0% {
              opacity: 0;
              transform: translateX(-48px) rotateY(10deg) scale(0.98);
            }
            100% {
              opacity: 1;
              transform: translateX(0) rotateY(0deg) scale(1);
            }
          }
        `}</style>
        <div
          style={{
            padding: '18px 18px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: COLORS.yellow,
                flexShrink: 0,
              }}
            >
              <Camera size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'rgba(255,255,255,0.56)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.1 }}>
                Veckans foto
              </div>
              <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 24, lineHeight: 1.06, marginTop: 4 }}>
                Fotoalbumet
              </div>
              <div style={{ color: 'rgba(255,255,255,0.64)', fontSize: 13, marginTop: 6 }}>
                {photos.length > 0
                  ? `${photos.length} bilder, fördelade på ${pages.length} sida${pages.length !== 1 ? 'r' : ''}.`
                  : 'Här samlas lagets sommarminnen i ett riktigt fotoalbum.'}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                width: 36,
                height: 36,
                borderRadius: 999,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <X size={18} style={{ marginTop: 2 }} />
            </button>
          </div>

          {!isLeader && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 14,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.74)', fontSize: 12 }}>
                Du har <strong style={{ color: '#fff' }}>{uploadsLeft}</strong> uppladdning{uploadsLeft !== 1 ? 'ar' : ''} kvar den här veckan
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || uploadsLeft <= 0}
                style={{
                  border: 'none',
                  borderRadius: 16,
                  padding: '12px 16px',
                  background: uploadsLeft > 0
                    ? `linear-gradient(135deg, ${COLORS.yellow} 0%, #ffe760 100%)`
                    : 'rgba(255,255,255,0.08)',
                  color: uploadsLeft > 0 ? COLORS.navy : 'rgba(255,255,255,0.42)',
                  fontWeight: 900,
                  cursor: uploading || uploadsLeft <= 0 ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {uploading ? <ButtonLoader color={COLORS.navy} /> : <ImagePlus size={18} />}
                {uploading ? 'Laddar upp...' : uploadsLeft > 0 ? 'Lägg till bild' : 'Veckan är full'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Leader approval section */}
        {isLeader && pendingPhotos.length > 0 && (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>
                🕐 {pendingPhotos.length} foto{pendingPhotos.length !== 1 ? 'n' : ''} väntar på godkännande
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingPhotos.map(photo => (
                  <div key={photo.id} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 10px' }}>
                    <img src={getPhotoSrc(photo)} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{photo.alias}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{photo.date}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => approvePhoto(photo.id, 'approved')}
                        disabled={approvingPhoto[photo.id]}
                        style={{ background: 'rgba(168,230,61,0.85)', border: 'none', borderRadius: 8, color: '#001540', fontSize: 12, fontWeight: 800, padding: '6px 10px', cursor: approvingPhoto[photo.id] ? 'not-allowed' : 'pointer', opacity: approvingPhoto[photo.id] ? 0.6 : 1 }}
                      >
                        ✓ Godkänn
                      </button>
                      <button
                        onClick={() => approvePhoto(photo.id, 'rejected')}
                        disabled={approvingPhoto[photo.id]}
                        style={{ background: 'rgba(220,40,40,0.7)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 800, padding: '6px 10px', cursor: approvingPhoto[photo.id] ? 'not-allowed' : 'pointer', opacity: approvingPhoto[photo.id] ? 0.6 : 1 }}
                      >
                        ✕ Neka
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {loading ? (
            <LoadingSpinner text="Laddar fotoalbumet..." />
          ) : visiblePhotos.length === 0 ? (
            <div
              style={{
                minHeight: 360,
                borderRadius: 28,
                background:
                  'linear-gradient(180deg, #fff9e8 0%, #fdf1d1 52%, #f8e7bf 100%)',
                padding: '34px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 8 }}>📷</div>
              <div style={{ color: COLORS.navy, fontFamily: "'Fredoka One', cursive", fontSize: 24 }}>
                Albumet väntar på första bilden
              </div>
              <div style={{ color: 'rgba(27,35,61,0.66)', fontSize: 14, lineHeight: 1.5, marginTop: 10, maxWidth: 260 }}>
                Lägg till en träningsbild, en lagbild eller ett sommarminne så börjar albumet fyllas.
              </div>
            </div>
          ) : (
            <>
              <div
                key={`${pageIndex}-${pageMotion}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{
                  touchAction: 'pan-y',
                  animation: pageMotion === 'backward'
                    ? 'albumPageInBackward 0.32s ease-out'
                    : 'albumPageInForward 0.32s ease-out',
                  transformOrigin: pageMotion === 'backward' ? 'left center' : 'right center',
                }}
              >
                <AlbumPage
                  page={pages[pageIndex]}
                  pageIndex={pageIndex}
                  allPhotos={photos}
                  onOpenPhoto={setLightboxIndex}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginTop: 16,
                }}
              >
                <button
                  onClick={goToPrevPage}
                  disabled={pageIndex === 0}
                  style={{
                    border: 'none',
                    background: 'rgba(255,255,255,0.08)',
                    color: pageIndex === 0 ? 'rgba(255,255,255,0.28)' : '#fff',
                    borderRadius: 16,
                    padding: '12px 14px',
                    cursor: pageIndex === 0 ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 800,
                  }}
                >
                  <ArrowLeft size={16} />
                  Förra sidan
                </button>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 18 }}>
                    {pageIndex + 1}/{pages.length}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    Svep eller bläddra
                  </div>
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={pageIndex >= pages.length - 1}
                  style={{
                    border: 'none',
                    background: 'rgba(255,255,255,0.08)',
                    color: pageIndex >= pages.length - 1 ? 'rgba(255,255,255,0.28)' : '#fff',
                    borderRadius: 16,
                    padding: '12px 14px',
                    cursor: pageIndex >= pages.length - 1 ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 800,
                  }}
                >
                  Nästa sidan
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PhotoAlbumScreen() {
  const { setScreen } = useUser();

  return (
    <PhotoAlbumModal
      onClose={() => setScreen('team')}
    />
  );
}
