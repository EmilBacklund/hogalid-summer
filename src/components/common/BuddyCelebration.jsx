import { createPortal } from 'react-dom';
import { COLORS, EXERCISES, CELEBRATION_LINES } from '../../constants';
import { Confetti } from './Confetti';

export function BuddyCelebration({ challenge, user, onClose }) {
  const partner = challenge.fromAlias === user.alias ? challenge.toAlias : challenge.fromAlias;
  const ex = EXERCISES.find(e => e.id === challenge.exerciseId);
  return createPortal(
    <>
      <Confetti active />
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(145deg, #0a1628, #001e6e)',
            border: `2px solid ${COLORS.lime}`,
            borderRadius: 24,
            padding: '36px 28px 28px',
            textAlign: 'center',
            maxWidth: 340,
            width: '100%',
            boxShadow: `0 0 60px ${COLORS.lime}44`,
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>🤝</div>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 28,
            color: COLORS.lime,
            marginBottom: 8,
            lineHeight: 1.2,
          }}>
            Grattis!
          </div>
          <div style={{
            color: '#fff',
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.4,
            marginBottom: 20,
          }}>
            Du och{' '}
            <span style={{ color: COLORS.yellow }}>{partner}</span>
            {' '}klarade utmaningen:
            <br />
            <span style={{ color: COLORS.lime }}>
              {challenge.amount} {ex?.label || challenge.exerciseId}!
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>
            Ni får dubbla poäng för träningen 🎉
          </div>
          <div style={{
            color: COLORS.yellow,
            fontSize: 13,
            fontWeight: 800,
            marginBottom: 20,
          }}>
            {CELEBRATION_LINES.hawaii}
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: COLORS.lime,
              color: COLORS.dark,
              fontFamily: "'Fredoka One', cursive",
              fontSize: 20,
              cursor: 'pointer',
              letterSpacing: 0.5,
            }}
          >
            🙌 Awesome!
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
