import { useState, useEffect } from 'react';
import { COLORS } from '../../constants';

const DISMISSED_KEY = 'install_prompt_dismissed';

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — never show
    if (isStandalone()) { setInstalled(true); return; }
    // Already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const onIos = isIOS();
    setIos(onIos);

    if (onIos) {
      // iOS: show manual instructions after a short delay
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    } else {
      // Android/Chrome: wait for browser's install event
      function handler(e) {
        e.preventDefault();
        setDeferredPrompt(e);
        setShow(true);
      }
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    dismiss();
  }

  if (!show || installed) return null;

  return (
    <>
      <style>{`
        @keyframes installSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 2000,
        padding: '0 12px 12px',
        boxSizing: 'border-box',
        animation: 'installSlideUp 0.35s ease-out',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #001e6e 0%, #001540 100%)',
          border: `1.5px solid ${COLORS.lime}55`,
          borderRadius: 20,
          padding: '16px 18px',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/icon-192.png" alt="" style={{ width: 44, height: 44, borderRadius: 10 }} />
              <div>
                <div style={{ color: '#fff', fontFamily: "'Fredoka One', cursive", fontSize: 16, lineHeight: 1.2 }}>
                  Lägg till på hemskärmen
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                  Öppna som en riktig app
                </div>
              </div>
            </div>
            <button
              onClick={dismiss}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.5)', width: 28, height: 28, borderRadius: 99, fontSize: 16, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </div>

          {ios ? (
            /* iOS: manual instructions */
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>1.</span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                  Tryck på <strong style={{ color: '#fff' }}>dela-knappen</strong>{' '}
                  <span style={{ fontSize: 18 }}>⎋</span> längst ner i Safari
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>2.</span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                  Välj <strong style={{ color: '#fff' }}>"Lägg till på hemskärmen"</strong> i listan
                </span>
              </div>
            </div>
          ) : (
            /* Android: real install button */
            <button
              onClick={handleInstall}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 14,
                border: 'none',
                background: COLORS.lime,
                color: COLORS.dark,
                fontFamily: "'Fredoka One', cursive",
                fontSize: 17,
                cursor: 'pointer',
              }}
            >
              Installera appen ⚽
            </button>
          )}

          <button
            onClick={dismiss}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            Visa inte igen
          </button>
        </div>
      </div>
    </>
  );
}
