import { COLORS, AVATAR_CONFIGS, AVATAR_ITEMS_LOCKED } from '../constants';
import { Card } from '../components/common';
import { AvatarSVG } from '../components/avatar';
import { useUser } from '../context/UserContext';

export function AvatarScreen() {
  const { user, stats, setScreen, handleUnlock } = useUser();

  return (
    <div style={{ padding: "20px 16px", fontFamily: "'Nunito', sans-serif" }}>
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: COLORS.lime, cursor: "pointer", fontSize: 15, fontWeight: 700, marginBottom: 16, padding: 0 }}>← Tillbaka</button>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 26, color: "#fff", marginBottom: 4 }}>Min gubbe</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20 }}>Lås upp coola prylar med poäng!</div>

      <Card style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <AvatarSVG config={AVATAR_CONFIGS[user.avatarBase || 0]} size={90} items={user.unlockedItems || []} />
        </div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginTop: 8 }}>{user.alias}</div>
        <div style={{ color: COLORS.lime, fontSize: 14, marginTop: 2 }}>⭐ {stats.totalPoints} poäng</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {AVATAR_ITEMS_LOCKED.map((item) => {
          const owned = (user.unlockedItems || []).includes(item.id);
          const canBuy = !owned && stats.totalPoints >= item.cost;
          return (
            <Card key={item.id} style={{ textAlign: "center", opacity: owned || canBuy ? 1 : 0.5 }}>
              <div style={{ fontSize: 40 }}>{owned ? item.icon : "🔒"}</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 4 }}>{item.label}</div>
              {owned ? (
                <div style={{ color: COLORS.lime, fontSize: 12, marginTop: 4 }}>✅ Upplåst!</div>
              ) : (
                <>
                  <div style={{ color: COLORS.accent, fontSize: 12, marginTop: 4 }}>⭐ {item.cost} poäng</div>
                  {canBuy && (
                    <button onClick={() => handleUnlock(item.id, item.cost)}
                      style={{ marginTop: 8, padding: "6px 14px", borderRadius: 10, border: "none", background: COLORS.lime, color: COLORS.dark, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
                      Lås upp!
                    </button>
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
