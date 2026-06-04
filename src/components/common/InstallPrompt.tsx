'use client';

import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'install_prompt_dismissed';

/** The non-standard event Chrome fires before offering an install. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

/**
 * "Add to home screen" banner. On Android/Chrome it captures the native
 * `beforeinstallprompt` event and triggers the install dialog; on iOS/Safari
 * (which has no such API) it shows manual share-sheet instructions. Hidden when
 * already installed (standalone) or once the user picks "Visa inte igen".
 */
export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    // Already installed, or dismissed before — never show.
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;

    if (isIOS()) {
      setIos(true);
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    }
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-1/2 z-[2000] w-full max-w-[480px] -translate-x-1/2 animate-[installSlideUp_0.35s_ease-out] px-3 pb-3">
      <style>{`@keyframes installSlideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div className="border-hogalid-yellow/30 flex flex-col gap-3 rounded-[20px] border-[1.5px] bg-[linear-gradient(135deg,#001e6e_0%,#001540_100%)] px-[18px] py-4 shadow-[0_-4px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-[10px]" />
            <div>
              <div className="font-display text-base leading-tight text-white">
                Lägg till på hemskärmen
              </div>
              <div className="mt-0.5 text-xs text-white/50">Öppna som en riktig app</div>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Stäng"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-base text-white/50"
          >
            ×
          </button>
        </div>

        {ios ? (
          <div className="rounded-xl bg-white/[0.07] px-3.5 py-3">
            <div className="mb-2 flex items-center gap-2.5">
              <span className="text-[22px]">1.</span>
              <span className="text-sm text-white/85">
                Tryck på <strong className="text-white">dela-knappen</strong>{' '}
                <span className="text-lg">⎋</span> längst ner i Safari
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[22px]">2.</span>
              <span className="text-sm text-white/85">
                Välj <strong className="text-white">&quot;Lägg till på hemskärmen&quot;</strong> i
                listan
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="bg-hogalid-yellow text-hogalid-dark font-display w-full rounded-[14px] py-[13px] text-[17px]"
          >
            Installera appen ⚽
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="self-start bg-none p-0 text-xs text-white/30"
        >
          Visa inte igen
        </button>
      </div>
    </div>
  );
}
