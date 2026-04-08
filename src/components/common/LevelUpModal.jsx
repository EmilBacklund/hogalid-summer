import { COLORS } from '../../constants';
import { Confetti } from './Confetti';

const KEYFRAMES = `
  @keyframes levelPop {
    0% { opacity: 0; transform: scale(0.3) rotate(-10deg); }
    50% { transform: scale(1.15) rotate(3deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes levelSlideUp {
    0% { opacity: 0; transform: translateY(24px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes levelShine {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
`;

export function LevelUpModal({ level, onClose }) {
  if (!level) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.8)',
        padding: 24,
      }}
    >
      <style>{KEYFRAMES}</style>
      <Confetti />
      <div
        onClick={e => e.stopPropagation()}
        style={{
          textAlign: 'center',
          maxWidth: 340,
          width: '100%',
          borderRadius: 28,
          border: `2px solid ${COLORS.lime}88`,
          background: `linear-gradient(160deg, rgba(0,20,64,0.98) 0%, rgba(0,40,100,0.96) 58%, rgba(220,40,40,0.88) 100%)`,
          boxShadow: `0 0 60px ${COLORS.lime}44, 0 20px 60px rgba(0,0,0,0.5)`,
          padding: '36px 28px 28px',
        }}
      >
        <div style={{
          fontSize: 72,
          lineHeight: 1,
          marginBottom: 12,
          animation: 'levelPop 0.6s ease-out both',
        }}>
          {level.icon}
        </div>

        <div style={{
          color: COLORS.lime,
          fontWeight: 800,
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 6,
          animation: 'levelSlideUp 0.5s ease-out 0.3s both',
        }}>
          Nivå upp!
        </div>

        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 28,
          color: '#fff',
          lineHeight: 1.2,
          marginBottom: 8,
          animation: 'levelSlideUp 0.5s ease-out 0.4s both',
        }}>
          {level.name}
        </div>

        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 14,
          fontWeight: 600,
          marginBottom: 24,
          animation: 'levelSlideUp 0.5s ease-out 0.5s both',
        }}>
          Du är nu {level.icon} {level.name}!
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '12px 36px',
            borderRadius: 14,
            border: 'none',
            background: COLORS.lime,
            color: COLORS.dark,
            fontFamily: "'Fredoka One', cursive",
            fontSize: 18,
            cursor: 'pointer',
            boxShadow: `0 4px 20px ${COLORS.lime}55`,
            animation: 'levelSlideUp 0.5s ease-out 0.6s both',
          }}
        >
          Toppen!
        </button>
      </div>
    </div>
  );
}
