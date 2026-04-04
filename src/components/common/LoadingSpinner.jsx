import { COLORS } from '../../constants';

const KEYFRAMES = `
  @keyframes footballBounce {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-18px) rotate(180deg); }
  }
  @keyframes shimmer {
    0% { opacity: 0.15; }
    50% { opacity: 0.35; }
    100% { opacity: 0.15; }
  }
  @keyframes loadingSlide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
  @keyframes dotPulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
`;

/**
 * Bouncing football loading spinner.
 * size: 'splash' (full-screen), 'section' (within a card/page area)
 */
export function LoadingSpinner({ text = 'Laddar...', size = 'section' }) {
  const isSplash = size === 'splash';
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isSplash ? '0' : '32px 20px',
      minHeight: isSplash ? '100vh' : undefined,
      fontFamily: "'Nunito', sans-serif",
    }}>
      <style>{KEYFRAMES}</style>
      {isSplash && (
        <div style={{ marginBottom: 24 }}>
          <img src="/img/hogalid-logo.png" alt="" style={{ width: 56, height: 56, opacity: 0.8 }} />
        </div>
      )}
      <div style={{
        fontSize: isSplash ? 48 : 36,
        animation: 'footballBounce 0.8s ease-in-out infinite',
        marginBottom: 14,
        lineHeight: 1,
      }}>
        ⚽
      </div>
      {text && (
        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: isSplash ? 16 : 14,
          fontWeight: 600,
          animation: 'shimmer 1.5s ease-in-out infinite',
        }}>
          {text}
        </div>
      )}
      {isSplash && (
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 20,
          color: COLORS.lime,
          marginTop: 12,
          opacity: 0.7,
        }}>
          Högalid F15
        </div>
      )}
    </div>
  );
}

/** Pulsing skeleton bar for placeholder content. */
export function SkeletonBar({ height = 14, width = '100%', borderRadius = 99 }) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{
        height,
        width,
        borderRadius,
        background: 'rgba(255,255,255,0.08)',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }} />
    </>
  );
}

/** Animated top loading bar (replaces the static lime bar). */
export function TopLoadingBar() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      height: 3,
      background: 'rgba(255,255,255,0.1)',
      overflow: 'hidden',
    }}>
      <style>{KEYFRAMES}</style>
      <div style={{
        height: '100%',
        width: '25%',
        background: `linear-gradient(90deg, transparent, ${COLORS.lime}, transparent)`,
        animation: 'loadingSlide 1s ease-in-out infinite',
      }} />
    </div>
  );
}

/** Small inline loading dots for buttons. */
export function ButtonLoader({ color = '#fff' }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      <style>{KEYFRAMES}</style>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
            animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
