import { useUser } from '../../context/UserContext';

export function DemoBanner() {
  const { handleLogout } = useUser();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        background: 'linear-gradient(90deg, #b45309 0%, #d97706 100%)',
        borderTop: '2px solid #fbbf24',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🎮</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>
            Demoläge
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, lineHeight: 1.3 }}>
            Inget sparas – inget delas med laget
          </div>
        </div>
      </div>
      <button
        onClick={handleLogout}
        style={{
          flexShrink: 0,
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 8,
          color: '#fff',
          fontWeight: 700,
          fontSize: 12,
          padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: "'Nunito', sans-serif",
          whiteSpace: 'nowrap',
        }}
      >
        Avsluta demo
      </button>
    </div>
  );
}
