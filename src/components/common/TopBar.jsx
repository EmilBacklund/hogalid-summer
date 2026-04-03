import { COLORS } from '../../constants';

export function TopBar({ onLogout }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/img/hogalid-logo.png" alt="" style={{ height: 32, width: 'auto' }} />
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: COLORS.lime }}>
          Högalid
        </span>
      </div>
      <button
        onClick={onLogout}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        Logga ut
      </button>
    </div>
  );
}
