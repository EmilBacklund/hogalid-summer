import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowLeftCircle, ArrowRightCircle, Camera, ImagePlus, X } from 'lucide-react';
import { COLORS } from '../constants';
import { Card, ButtonLoader, LoadingSpinner } from '../components/common';
import { useUser } from '../context/UserContext';
import { apiPost, fetchTeamPhotos, fetchTeamPhotosStale, invalidatePhotosCache, getWeekStart, localToday } from '../utils';

const MAX_UPLOADS_PER_WEEK = 2;

function getUploadsLeft(photos, alias) {
  const weekStart = getWeekStart(localToday());
  const used = photos.filter((photo) => photo.alias === alias && photo.weekStart === weekStart).length;
  return Math.max(0, MAX_UPLOADS_PER_WEEK - used);
}

function getAlbumStyle(id) {
  const seed = Number(id) || 0;
  const rotations = [-4, 3, -2, 5, -5, 2];
  const spans = [3, 2, 3, 2, 2, 3];
  const offsets = [0, 14, -10, 8, -4, 12];
  const tapeRotations = [-8, 6, -4, 10, -6, 4];
  const idx = seed % rotations.length;
  return {
    rotate: rotations[idx],
    span: spans[idx],
    offset: offsets[idx],
    tapeRotate: tapeRotations[idx],
  };
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
        zIndex: 1200,
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
              src={photo.imageData}
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

export function PhotoAlbumScreen() {
  const { user, setScreen } = useUser();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stale = fetchTeamPhotosStale((fresh) => {
      setPhotos(fresh || []);
      setLoading(false);
    });
    if (stale) {
      setPhotos(stale);
      setLoading(false);
    }
    if (!stale) {
      setLoading(true);
      fetchTeamPhotos()
        .then((fresh) => {
          setPhotos(fresh || []);
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const uploadsLeft = useMemo(() => getUploadsLeft(photos, user.alias), [photos, user.alias]);
  const remainingPhotos = Math.max(0, photos.length);
  const lightboxPhotos = photos;

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
      const newPhoto = result.photo;
      invalidatePhotosCache();
      setPhotos((prev) => [newPhoto, ...prev]);
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

  if (loading) {
    return <LoadingSpinner text="Laddar fotoalbumet..." />;
  }

  return (
    <div style={{ padding: '20px 16px 28px', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @keyframes albumFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      `}</style>

      {lightboxIndex !== null && (
        <AlbumLightbox
          photos={lightboxPhotos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((current) => (current - 1 + lightboxPhotos.length) % lightboxPhotos.length)}
          onNext={() => setLightboxIndex((current) => (current + 1) % lightboxPhotos.length)}
        />
      )}

      <button
        onClick={() => setScreen('team')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          color: COLORS.lime,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 16,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} />
        Till laget
      </button>

      <div
        style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 28,
          lineHeight: 1.08,
          color: '#fff',
          marginBottom: 4,
        }}
      >
        Veckans foto 📸
      </div>
      <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 13, marginBottom: 16 }}>
        Lagets sommarminnen i ett fotoalbum med träningsbilder, lagbilder och små ögonblick.
      </div>

      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(145deg, rgba(0,40,100,0.72), rgba(220,40,40,0.35))',
          border: '1px solid rgba(240,220,0,0.22)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.1 }}>
              Din vecka
            </div>
            <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 28, lineHeight: 1.05, marginTop: 4 }}>
              {uploadsLeft} kvar
            </div>
            <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: 13, marginTop: 6, maxWidth: 220 }}>
              Du kan ladda upp max 2 bilder per vecka så att albumet håller sig lagom och roligt.
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || uploadsLeft <= 0}
            style={{
              border: 'none',
              borderRadius: 18,
              padding: '14px 16px',
              minWidth: 124,
              background: uploadsLeft > 0
                ? `linear-gradient(135deg, ${COLORS.yellow} 0%, #ffe760 100%)`
                : 'rgba(255,255,255,0.08)',
              color: uploadsLeft > 0 ? COLORS.navy : 'rgba(255,255,255,0.42)',
              fontWeight: 900,
              cursor: uploading || uploadsLeft <= 0 ? 'default' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              boxShadow: uploadsLeft > 0 ? '0 12px 24px rgba(240,220,0,0.18)' : 'none',
            }}
          >
            {uploading ? <ButtonLoader color={COLORS.navy} /> : <ImagePlus size={22} />}
            <span style={{ fontSize: 13 }}>
              {uploading ? 'Laddar upp...' : uploadsLeft > 0 ? 'Lägg till bild' : 'Veckan är full'}
            </span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: 'none' }}
        />

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
            {remainingPhotos} bilder i albumet just nu
          </div>
          <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: 12 }}>
            Bilder syns direkt. Admin-godkännande kan läggas till senare om ni vill.
          </div>
        </div>
      </Card>

      {photos.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '28px 20px' }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>📷</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: '#fff', marginBottom: 8 }}>
            Albumet väntar på första bilden
          </div>
          <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 14, lineHeight: 1.5 }}>
            Lägg till en träningsbild, en lagbild eller ett sommarminne så börjar albumet fyllas.
          </div>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 12,
            alignItems: 'start',
          }}
        >
          {photos.map((photo, index) => {
            const styleSeed = getAlbumStyle(photo.id);
            return (
              <button
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                style={{
                  gridColumn: `span ${styleSeed.span}`,
                  marginTop: styleSeed.offset,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transform: `rotate(${styleSeed.rotate}deg)`,
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    background: '#fffdf4',
                    borderRadius: 18,
                    padding: '12px 12px 14px',
                    boxShadow: '0 16px 30px rgba(0,0,0,0.25)',
                    animation: 'albumFloat 4.5s ease-in-out infinite',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -10,
                      left: '50%',
                      width: 72,
                      height: 26,
                      transform: `translateX(-50%) rotate(${styleSeed.tapeRotate}deg)`,
                      borderRadius: 8,
                      background: 'rgba(255, 244, 157, 0.7)',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
                    }}
                  />
                  <img
                    src={photo.imageData}
                    alt={`Foto av ${photo.uploaderName}`}
                    style={{
                      width: '100%',
                      display: 'block',
                      objectFit: 'cover',
                      borderRadius: 14,
                      aspectRatio: '3 / 4',
                      background: '#dfe7f4',
                    }}
                  />
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
      )}
    </div>
  );
}
