import { useState, useEffect } from 'react';
import { COLORS, CLUB_LOGO } from '../constants';
import { apiGet, apiPut, localToday, computeStats, getLevel } from '../utils';
import { AvatarSVG } from '../components/avatar';
import { useUser } from '../context/UserContext';

export function AdminScreen() {
  const { handleLogout } = useUser();

  const [players, setPlayers] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    apiGet("/users").then(users => {
      const mapped = users.map(u => {
        const s = computeStats(u);
        const logs = u.logs || [];
        const allDates = logs.map(l => l.date).filter(Boolean).sort();
        const lastActivity = allDates.length > 0 ? allDates[allDates.length - 1] : null;
        return { ...u, ...s, lastActivity, bingoList: u.bingo || [] };
      }).sort((a, b) => (b.lastActivity || "").localeCompare(a.lastActivity || ""));
      setPlayers(mapped);
    }).catch(() => setPlayers([])).finally(() => setLoadingAdmin(false));
  }, []);

  const [showPw, setShowPw] = useState({});
  const [resetPw, setResetPw] = useState({});
  const [newPw, setNewPw] = useState({});
  const today = localToday();

  async function handleResetPassword(alias) {
    const pw = newPw[alias];
    if (!pw || !pw.trim()) return;
    try {
      await apiPut("/users?action=resetpassword", { alias, newPassword: pw.trim() });
      setPlayers(prev => prev.map(p => p.alias === alias ? { ...p, password: pw.trim() } : p));
      setResetPw(prev => ({ ...prev, [alias]: false }));
      setNewPw(prev => ({ ...prev, [alias]: "" }));
    } catch (e) {
      alert("Kunde inte byta lösenord: " + e.message);
    }
  }

  function daysSince(dateStr) {
    if (!dateStr) return null;
    return Math.floor((new Date(today) - new Date(dateStr)) / 86400000);
  }
  function activityColor(days) {
    if (days === null) return "rgba(255,255,255,0.3)";
    if (days === 0) return COLORS.lime;
    if (days <= 3) return COLORS.accent;
    if (days <= 7) return "#fb923c";
    return "#f87171";
  }

  if (loadingAdmin) return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)", fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚽</div>
      Laddar spelardata...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${COLORS.dark} 0%, #001e6e 60%, #002864 100%)`, fontFamily: "'Nunito', sans-serif", color: "#fff" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><img src={CLUB_LOGO} alt="" style={{ width: 32, height: 32 }} /><span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: COLORS.lime }}>Admin — Högalid F15</span></div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Sommarlovet 2026</div>
        </div>
        <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, borderRadius: 8, padding: "6px 12px" }}>Logga ut</button>
      </div>

      <div style={{ padding: "16px 16px 40px" }}>

        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Spelare", val: players.length, icon: "👥" },
            { label: "Träningar loggade", val: players.reduce((s, p) => s + p.totalLogs, 0), icon: "📅" },
            { label: "Bingo klarade", val: players.reduce((s, p) => s + p.bingoCount, 0), icon: "🌞" },
          ].map(({ label, val, icon }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.09)", borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: COLORS.lime }}>{val}</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Player cards */}
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Alla spelare ({players.length}) — sorterat senast aktiv
        </div>

        {players.length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textAlign: "center", padding: 40 }}>Inga spelare registrerade än.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {players.map(p => {
            const days = daysSince(p.lastActivity);
            const color = activityColor(days);
            const level = getLevel(p.totalPoints);
            return (
              <div key={p.alias} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "14px 16px" }}>

                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AvatarSVG avatarConfig={p.avatarConfig} size={32} />
                      <div>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{p.alias}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{level.icon} {level.name}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color, fontWeight: 700, fontSize: 13 }}>
                      {days === null ? "Aldrig loggat" : days === 0 ? "Aktiv idag ✅" : `${days} dag${days === 1 ? "" : "ar"} sedan`}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
                      {p.lastActivity || "—"}
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                  {[
                    { lbl: "Poäng",    val: p.totalPoints,   col: COLORS.accent },
                    { lbl: "Minuter",  val: p.totalMinutes,  col: COLORS.lime },
                    { lbl: "Touch",    val: p.totalTouch,    col: "#60a5fa" },
                    { lbl: "Bingo",    val: `${p.bingoCount}/50`, col: COLORS.yellow },
                  ].map(({ lbl, val, col }) => (
                    <div key={lbl} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "7px 6px", textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: col }}>{val}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 1 }}>{lbl}</div>
                    </div>
                  ))}
                </div>

                {/* Streak */}
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 8 }}>
                  🔥 Streak: <span style={{ color: "#fff", fontWeight: 700 }}>{p.streak}</span> dagar &nbsp;|&nbsp;
                  Bästa: <span style={{ color: "#fff", fontWeight: 700 }}>{p.maxStreak}</span> dagar &nbsp;|&nbsp;
                  Pass: <span style={{ color: "#fff", fontWeight: 700 }}>{p.totalLogs}</span>
                </div>

                {/* Password row */}
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>🔑 Lösenord:</span>
                    {p.password ? (
                      <span style={{ color: showPw[p.alias] ? COLORS.accent : "transparent", fontSize: 13, fontWeight: 700, background: showPw[p.alias] ? "none" : "rgba(255,255,255,0.15)", borderRadius: 6, padding: "1px 8px", userSelect: showPw[p.alias] ? "text" : "none", letterSpacing: showPw[p.alias] ? 0 : 2 }}>
                        {showPw[p.alias] ? p.password : "••••••••"}
                      </span>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: "italic" }}>Ej tillgängligt</span>
                    )}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      {p.password && (
                        <button onClick={() => setShowPw(prev => ({ ...prev, [p.alias]: !prev[p.alias] }))}
                          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.6)", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                          {showPw[p.alias] ? "Dölj" : "Visa"}
                        </button>
                      )}
                      <button onClick={() => setResetPw(prev => ({ ...prev, [p.alias]: !prev[p.alias] }))}
                        style={{ background: "rgba(255,255,255,0.1)", border: "none", color: COLORS.accent, borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                        Byt
                      </button>
                    </div>
                  </div>
                  {resetPw[p.alias] && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <input
                        value={newPw[p.alias] || ""}
                        onChange={(e) => setNewPw(prev => ({ ...prev, [p.alias]: e.target.value }))}
                        placeholder="Nytt lösenord"
                        style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}
                      />
                      <button onClick={() => handleResetPassword(p.alias)}
                        style={{ background: COLORS.lime, border: "none", color: COLORS.dark, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                        Spara
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
