import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { InstallPrompt } from './InstallPrompt';

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });
}

function fireBeforeInstallPrompt() {
  const evt = Object.assign(new Event('beforeinstallprompt'), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  });
  act(() => {
    window.dispatchEvent(evt);
  });
  return evt;
}

const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';

beforeEach(() => {
  localStorage.clear();
  setUserAgent(ANDROID_UA);
  // jsdom matchMedia is undefined by default; default to "not standalone".
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof matchMedia;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe('InstallPrompt', () => {
  it('stays hidden until the browser offers an install (Android)', () => {
    render(<InstallPrompt />);
    expect(screen.queryByText('Lägg till på hemskärmen')).not.toBeInTheDocument();
    fireBeforeInstallPrompt();
    expect(screen.getByText('Lägg till på hemskärmen')).toBeInTheDocument();
    expect(screen.getByText('Installera appen ⚽')).toBeInTheDocument();
  });

  it('shows iOS share-sheet instructions instead of an install button', () => {
    setUserAgent(IOS_UA);
    render(<InstallPrompt />);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText('Lägg till på hemskärmen')).toBeInTheDocument();
    expect(screen.queryByText('Installera appen ⚽')).not.toBeInTheDocument();
    expect(screen.getByText(/dela-knappen/)).toBeInTheDocument();
  });

  it('never shows when already running standalone', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof matchMedia;
    render(<InstallPrompt />);
    fireBeforeInstallPrompt();
    expect(screen.queryByText('Lägg till på hemskärmen')).not.toBeInTheDocument();
  });

  it('stays hidden once dismissed via "Visa inte igen"', () => {
    render(<InstallPrompt />);
    fireBeforeInstallPrompt();
    act(() => {
      fireEvent.click(screen.getByText('Visa inte igen'));
    });
    expect(screen.queryByText('Lägg till på hemskärmen')).not.toBeInTheDocument();
    expect(localStorage.getItem('install_prompt_dismissed')).toBe('1');
  });

  it('does not re-appear after a prior dismissal', () => {
    localStorage.setItem('install_prompt_dismissed', '1');
    render(<InstallPrompt />);
    fireBeforeInstallPrompt();
    expect(screen.queryByText('Lägg till på hemskärmen')).not.toBeInTheDocument();
  });
});
