import { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { apiGet, apiPost, apiPut, apiDelete, localToday, computeStats, getLevel, fetchTeamPhotos } from '../utils';
import { AvatarSVG } from '../components/avatar';
import { useUser } from '../context/UserContext';

function LeaderSection({ players }) {
  const leaders = players.filter(p => p.role === 'leader');
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!alias.trim() || !password.trim()) return;
    setCreating(true);
    setError('');
    try {
      await apiPost('/users?action=createleader', { alias: alias.trim(), password: password.trim() });
      setCreated(alias.trim());
      setAlias('');
      setPassword('');
    } catch (e) {
      setError(e.message.includes('alias_taken') ? 'Det smeknamnet är redan taget.' : 'Kunde inte skapa konto: ' + e.message);
    }
    setCreating(false);
  }

  return (
    <div>
      {leaders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {leaders.map(l => (
            <div key={l.alias} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>👁️ {l.alias}</span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Ledare</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={alias}
          onChange={e => setAlias(e.target.value)}
          placeholder="Smeknamn"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: "'Nunito', sans-serif" }}
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Lösenord"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 13, fontFamily: "'Nunito', sans-serif" }}
        />
      </div>
      <button
        onClick={handleCreate}
        disabled={!alias.trim() || !password.trim() || creating}
        style={{ width: '100%', padding: '9px 0', borderRadius: 10, border: 'none', background: !alias.trim() || !password.trim() || creating ? 'rgba(255,255,255,0.1)' : COLORS.lime, color: !alias.trim() || !password.trim() || creating ? 'rgba(255,255,255,0.3)' : COLORS.dark, fontWeight: 700, fontSize: 13, cursor: !alias.trim() || !password.trim() || creating ? 'not-allowed' : 'pointer', fontFamily: "'Nunito', sans-serif" }}
      >
        {creating ? 'Skapar...' : '+ Skapa ledarkonto'}
      </button>
      {created && <div style={{ color: COLORS.lime, fontSize: 13, fontWeight: 700, marginTop: 8 }}>✅ {created} skapad!</div>}
      {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{error}</div>}
    </div>
  );
}

export function AdminScreen({ onViewTeam }) {
  const { handleLogout, setSeasonStart, setCountdownDate, countdownDate } = useUser();

  const [players, setPlayers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  // Season start editor
  const [seasonDateInput, setSeasonDateInput] = useState('');
  const [savingSeasonDate, setSavingSeasonDate] = useState(false);
  const [seasonDateSaved, setSeasonDateSaved] = useState(false);

  // Countdown date editor
  const [countdownInput, setCountdownInput] = useState('');
  const [savingCountdown, setSavingCountdown] = useState(false);
  const [countdownSaved, setCountdownSaved] = useState(false);

  // Delete player
  const [deleteConfirm, setDeleteConfirm] = useState({}); // { alias: true }
  const [deleting, setDeleting] = useState({});

  // First log date editor
  const [firstLogDate, setFirstLogDate] = useState({});  // { alias: 'YYYY-MM-DD' }
  const [savingFirstLog, setSavingFirstLog] = useState({});
  const [firstLogSaved, setFirstLogSaved] = useState({});

  // Photo moderation
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [deletingPhoto, setDeletingPhoto] = useState({});
  const [approvingPhoto, setApprovingPhoto] = useState({});
  const [showPhotos, setShowPhotos] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  // Log viewer per player
  const [expandedLogs, setExpandedLogs] = useState({});  // { alias: bool }
  const [deletingLog, setDeletingLog] = useState({});    // { logId: bool }

  // Invite manager
  const [inviteLabel, setInviteLabel] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteActionBusy, setInviteActionBusy] = useState({});
  const [copiedInviteId, setCopiedInviteId] = useState(null);

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

    apiGet('/users?action=invites')
      .then((data) => setInvites(data || []))
      .catch(() => setInvites([]));

    fetchTeamPhotos()
      .then(data => {
        const all = data || [];
        setPhotos(all);
        if (all.some(p => p.status === 'pending')) setShowPendingModal(true);
      })
      .catch(() => setPhotos([]))
      .finally(() => setLoadingPhotos(false));
  }, []);

  function formatDateTime(value) {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  }

  function inviteStatusLabel(invite) {
    if (invite.status === 'used') return 'Använd';
    if (invite.status === 'disabled') return 'Inaktiv';
    if (invite.status === 'clicked') return 'Öppnad';
    return 'Ej öppnad';
  }

  function inviteStatusColor(invite) {
    if (invite.status === 'used') return COLORS.lime;
    if (invite.status === 'disabled') return '#f87171';
    if (invite.status === 'clicked') return COLORS.accent;
    return 'rgba(255,255,255,0.45)';
  }

  async function refreshInvites() {
    try {
      const data = await apiGet('/users?action=invites');
      setInvites(data || []);
    } catch {
      // ignore
    }
  }

  async function handleResetSeason() {
    setResetLoading(true);
    try {
      const result = await apiPut("/users?action=resetseason", {});
      setSeasonStart(result.seasonStart);
      setPlayers([]);
      setResetDone(true);
      setShowResetConfirm(false);
    } catch (e) {
      alert("Kunde inte nollställa: " + e.message);
    }
    setResetLoading(false);
  }

  const [showPw, setShowPw] = useState({});
  const [resetPw, setResetPw] = useState({});
  const [newPw, setNewPw] = useState({});
  const [resettingPw, setResettingPw] = useState({});
  const today = localToday();

  async function handleResetPassword(alias) {
    const pw = newPw[alias];
    if (!pw || !pw.trim()) return;
    setResettingPw(prev => ({ ...prev, [alias]: true }));
    try {
      await apiPut("/users?action=resetpassword", { alias, newPassword: pw.trim() });
      setPlayers(prev => prev.map(p => p.alias === alias ? { ...p, password: pw.trim() } : p));
      setResetPw(prev => ({ ...prev, [alias]: false }));
      setNewPw(prev => ({ ...prev, [alias]: "" }));
    } catch (e) {
      alert("Kunde inte byta lösenord: " + e.message);
    }
    setResettingPw(prev => ({ ...prev, [alias]: false }));
  }

  async function handleUpdateCountdown() {
    if (!countdownInput) return;
    setSavingCountdown(true);
    try {
      await apiPut("/users?action=updatecountdowndate", { date: countdownInput });
      setCountdownDate(countdownInput);
      setCountdownSaved(true);
      setTimeout(() => setCountdownSaved(false), 3000);
    } catch (e) {
      alert("Kunde inte uppdatera nedräkningsdatum: " + e.message);
    }
    setSavingCountdown(false);
  }

  async function handleUpdateSeasonStart() {
    if (!seasonDateInput) return;
    setSavingSeasonDate(true);
    try {
      await apiPut("/users?action=updateseasonstart", { date: seasonDateInput });
      setSeasonStart(seasonDateInput);
      setSeasonDateSaved(true);
      setTimeout(() => setSeasonDateSaved(false), 3000);
    } catch (e) {
      alert("Kunde inte uppdatera säsongstart: " + e.message);
    }
    setSavingSeasonDate(false);
  }

  async function handleDeleteUser(alias) {
    setDeleting(prev => ({ ...prev, [alias]: true }));
    try {
      await apiDelete("/users?action=deleteuser", { alias });
      setPlayers(prev => prev.filter(p => p.alias !== alias));
      setDeleteConfirm(prev => ({ ...prev, [alias]: false }));
    } catch (e) {
      alert("Kunde inte ta bort spelare: " + e.message);
    }
    setDeleting(prev => ({ ...prev, [alias]: false }));
  }

  async function handleUpdateFirstLog(alias) {
    const date = firstLogDate[alias];
    if (!date) return;
    setSavingFirstLog(prev => ({ ...prev, [alias]: true }));
    try {
      await apiPut("/users?action=updatefirstlog", { alias, date });
      setFirstLogSaved(prev => ({ ...prev, [alias]: true }));
      setTimeout(() => setFirstLogSaved(prev => ({ ...prev, [alias]: false })), 3000);
    } catch (e) {
      alert("Kunde inte uppdatera datum: " + e.message);
    }
    setSavingFirstLog(prev => ({ ...prev, [alias]: false }));
  }

  async function handleDeletePhoto(id) {
    setDeletingPhoto(prev => ({ ...prev, [id]: true }));
    try {
      await apiDelete('/photos', { id });
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert('Kunde inte ta bort foto: ' + e.message);
    }
    setDeletingPhoto(prev => ({ ...prev, [id]: false }));
  }

  async function handleApprovePhoto(id, status) {
    setApprovingPhoto(prev => ({ ...prev, [id]: true }));
    try {
      await apiPut('/photos', { id, status });
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (e) {
      alert('Kunde inte uppdatera foto: ' + e.message);
    }
    setApprovingPhoto(prev => ({ ...prev, [id]: false }));
  }

  async function handleDeleteLog(alias, logId) {
    setDeletingLog(prev => ({ ...prev, [logId]: true }));
    try {
      await apiPut('/users?action=deletelog', { logId });
      setPlayers(prev => prev.map(p =>
        p.alias === alias
          ? { ...p, logs: (p.logs || []).filter(l => l.id !== logId) }
          : p
      ));
    } catch (e) {
      alert('Kunde inte ta bort logg: ' + e.message);
    }
    setDeletingLog(prev => ({ ...prev, [logId]: false }));
  }

  async function handleCreateInvite() {
    if (!inviteLabel.trim()) return;
    setCreatingInvite(true);
    try {
      await apiPost('/users?action=createinvite', { label: inviteLabel.trim() });
      setInviteLabel('');
      await refreshInvites();
    } catch (e) {
      alert('Kunde inte skapa inbjudan: ' + e.message);
    }
    setCreatingInvite(false);
  }

  async function handleInviteAction(inviteId, mode) {
    setInviteActionBusy((prev) => ({ ...prev, [inviteId]: mode }));
    try {
      await apiPut('/users?action=updateinvite', { inviteId, mode });
      await refreshInvites();
    } catch (e) {
      alert('Kunde inte uppdatera inbjudan: ' + e.message);
    }
    setInviteActionBusy((prev) => ({ ...prev, [inviteId]: '' }));
  }

  async function copyInviteLink(invite) {
    const url = `${window.location.origin}/?invite=${invite.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedInviteId(invite.id);
      setTimeout(() => setCopiedInviteId(null), 2000);
    } catch {
      alert(url);
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

      {/* Pending photos modal */}
      {showPendingModal && (() => {
        const pendingCount = photos.filter(p => p.status === 'pending').length;
        return pendingCount > 0 ? (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
            <div style={{ background: 'linear-gradient(160deg, #001540 0%, #002060 100%)', border: '1px solid rgba(255,220,0,0.4)', borderRadius: 24, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📸</div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 22, color: '#ffd700', marginBottom: 8 }}>
                {pendingCount} {pendingCount === 1 ? 'foto väntar' : 'foton väntar'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                {pendingCount === 1 ? 'Ett foto behöver' : `${pendingCount} foton behöver`} granskas innan {pendingCount === 1 ? 'det' : 'de'} syns för spelarna.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => { setShowPhotos(true); setShowPendingModal(false); }}
                  style={{ width: '100%', padding: '12px 0', borderRadius: 14, border: 'none', background: '#ffd700', color: '#001540', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}
                >
                  Granska foton nu →
                </button>
                <button
                  onClick={() => setShowPendingModal(false)}
                  style={{ width: '100%', padding: '10px 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}
                >
                  Senare
                </button>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><img src="/img/hogalid-logo.png" alt="" style={{ width: 32, height: 32 }} /><span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 20, color: COLORS.lime }}>Admin — Högalid F15</span></div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Sommarlovet 2026</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onViewTeam && (
            <button
              onClick={onViewTeam}
              style={{ background: 'rgba(168,230,61,0.15)', border: `1px solid ${COLORS.lime}55`, color: COLORS.lime, cursor: 'pointer', fontSize: 13, borderRadius: 8, padding: '6px 12px', fontWeight: 700, marginRight: 8 }}
            >
              👁️ Lagvy
            </button>
          )}
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, borderRadius: 8, padding: "6px 12px" }}>Logga ut</button>
        </div>
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

        {/* Reset season */}
        {resetDone ? (
          <div style={{ background: "rgba(168,230,61,0.1)", border: `1px solid ${COLORS.lime}`, borderRadius: 16, padding: "16px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
            <div style={{ color: COLORS.lime, fontWeight: 700, fontSize: 16 }}>Säsongen är nollställd!</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Alla spelare och träningar är borttagna. Utmaningarna börjar nu om från vecka 1.</div>
          </div>
        ) : showResetConfirm ? (
          <div style={{ background: "rgba(220,40,40,0.1)", border: "1px solid rgba(220,40,40,0.5)", borderRadius: 16, padding: "16px", marginBottom: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>⚠️</div>
            <div style={{ color: "#f87171", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Är du helt säker?</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Detta tar bort <strong style={{ color: "#fff" }}>alla spelare</strong>, <strong style={{ color: "#fff" }}>alla träningar</strong>, all bingo och alla dagliga utmaningar. Det går inte att ångra.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleResetSeason} disabled={resetLoading}
                style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: COLORS.red, color: "#fff", fontFamily: "'Fredoka One', cursive", fontSize: 16, cursor: resetLoading ? "not-allowed" : "pointer", opacity: resetLoading ? 0.6 : 1 }}>
                {resetLoading ? "Nollställer..." : "Ja, nollställ allt"}
              </button>
              <button onClick={() => setShowResetConfirm(false)}
                style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" }}>
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowResetConfirm(true)}
            style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: "1px solid rgba(220,40,40,0.4)", background: "rgba(220,40,40,0.08)", color: "#f87171", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 20 }}>
            🔄 Nollställ säsong inför sommarlovet
          </button>
        )}

        {/* Countdown date editor */}
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            ⏱️ Nedräkning — "Första träningen"
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 8 }}>
            Nuvarande: <span style={{ color: "#f0dc00", fontWeight: 700 }}>{countdownDate || "2026-08-17"}</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="date"
              value={countdownInput}
              onChange={e => setCountdownInput(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}
            />
            <button
              onClick={handleUpdateCountdown}
              disabled={!countdownInput || savingCountdown}
              style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: !countdownInput || savingCountdown ? "rgba(255,255,255,0.1)" : COLORS.lime, color: !countdownInput || savingCountdown ? "rgba(255,255,255,0.35)" : COLORS.dark, fontWeight: 700, fontSize: 13, cursor: !countdownInput || savingCountdown ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}
            >
              {savingCountdown ? "Sparar..." : countdownSaved ? "✅ Sparat!" : "Spara"}
            </button>
          </div>
        </div>

        {/* Season start editor */}
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            📅 Ändra säsongstart
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 10, lineHeight: 1.4 }}>
            Ändrar startdatumet för säsongen utan att radera träningsdata. Påverkar dagsutmaningar och veckoutmaningar.
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="date"
              value={seasonDateInput}
              onChange={e => setSeasonDateInput(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}
            />
            <button
              onClick={handleUpdateSeasonStart}
              disabled={!seasonDateInput || savingSeasonDate}
              style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: !seasonDateInput || savingSeasonDate ? "rgba(255,255,255,0.1)" : COLORS.lime, color: !seasonDateInput || savingSeasonDate ? "rgba(255,255,255,0.35)" : COLORS.dark, fontWeight: 700, fontSize: 13, cursor: !seasonDateInput || savingSeasonDate ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}
            >
              {savingSeasonDate ? "Sparar..." : seasonDateSaved ? "✅ Sparat!" : "Spara"}
            </button>
          </div>
        </div>

        {/* Leader accounts */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            👁️ Ledarkonton
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12, lineHeight: 1.45 }}>
            Ledare kan följa laget i appen men inte logga träning, ladda upp foton eller kommunicera.
          </div>
          <LeaderSection players={players} />
        </div>

        {/* Invite manager */}
        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            🔐 Inbjudningslänkar & koder
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 12, lineHeight: 1.45 }}>
            Skapa en namngiven inbjudan per spelare så du ser vem den skickats till, om den öppnats och vem som använt den.
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              value={inviteLabel}
              onChange={(e) => setInviteLabel(e.target.value)}
              placeholder="Namnge länken, t.ex. Maja eller Spelare 12"
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, fontFamily: "'Nunito', sans-serif" }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateInvite()}
            />
            <button
              onClick={handleCreateInvite}
              disabled={!inviteLabel.trim() || creatingInvite}
              style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: !inviteLabel.trim() || creatingInvite ? "rgba(255,255,255,0.1)" : COLORS.lime, color: !inviteLabel.trim() || creatingInvite ? "rgba(255,255,255,0.35)" : COLORS.dark, fontWeight: 700, fontSize: 13, cursor: !inviteLabel.trim() || creatingInvite ? "not-allowed" : "pointer", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}
            >
              {creatingInvite ? 'Skapar...' : 'Ny invite'}
            </button>
          </div>

          {invites.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, padding: '8px 0 2px' }}>
              Inga invites skapade än.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {invites.map((invite) => {
                const actionBusy = inviteActionBusy[invite.id];
                const inviteUrl = `${window.location.origin}/?invite=${invite.token}`;
                return (
                  <div
                    key={invite.id}
                    style={{ background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 12px 10px" }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{invite.label}</div>
                        <div style={{ color: inviteStatusColor(invite), fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                          {inviteStatusLabel(invite)}
                        </div>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'right' }}>
                        Skapad {formatDateTime(invite.createdAt)}
                      </div>
                    </div>

                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4 }}>Kod</div>
                    <div style={{ color: COLORS.yellow, fontWeight: 800, fontSize: 14, marginBottom: 8 }}>{invite.code}</div>

                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4 }}>Länk</div>
                    <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 11, lineHeight: 1.35, marginBottom: 10, wordBreak: 'break-all' }}>
                      {inviteUrl}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 3 }}>Öppnad</div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{formatDateTime(invite.clickedAt)}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 3 }}>Använd av</div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>
                          {invite.usedByAlias || '—'}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2 }}>
                          {formatDateTime(invite.usedAt)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => copyInviteLink(invite)}
                        style={{ background: copiedInviteId === invite.id ? COLORS.lime : "rgba(255,255,255,0.1)", border: "none", color: copiedInviteId === invite.id ? COLORS.dark : "rgba(255,255,255,0.7)", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                      >
                        {copiedInviteId === invite.id ? '✅ Kopierad' : 'Kopiera länk'}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(invite.code)}
                        style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                      >
                        Kopiera kod
                      </button>
                      <button
                        onClick={() => handleInviteAction(invite.id, invite.status === 'disabled' ? 'enable' : 'disable')}
                        disabled={!!actionBusy}
                        style={{ background: "rgba(255,255,255,0.1)", border: "none", color: invite.status === 'disabled' ? COLORS.lime : "#fca5a5", borderRadius: 8, padding: "7px 10px", cursor: actionBusy ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, opacity: actionBusy ? 0.6 : 1 }}
                      >
                        {actionBusy === 'disable' || actionBusy === 'enable'
                          ? 'Sparar...'
                          : invite.status === 'disabled'
                            ? 'Aktivera'
                            : 'Inaktivera'}
                      </button>
                      <button
                        onClick={() => handleInviteAction(invite.id, 'reset')}
                        disabled={!!actionBusy}
                        style={{ background: "rgba(255,255,255,0.1)", border: "none", color: COLORS.accent, borderRadius: 8, padding: "7px 10px", cursor: actionBusy ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, opacity: actionBusy ? 0.6 : 1 }}
                      >
                        {actionBusy === 'reset' ? 'Återställer...' : 'Återställ'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Photo moderation */}
        <div style={{ marginBottom: 18 }}>
          <button
            onClick={() => setShowPhotos(v => !v)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 16px', cursor: 'pointer', color: '#fff', fontFamily: "'Nunito', sans-serif" }}
          >
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' }}>📸 Lagets foton</span>
              <span style={{ marginLeft: 8, fontSize: 13, color: COLORS.accent, fontWeight: 700 }}>{photos.length} st</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{showPhotos ? '▲ Dölj' : '▼ Visa'}</span>
          </button>

          {showPhotos && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '12px 16px' }}>
              {loadingPhotos ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: '8px 0' }}>Laddar foton...</div>
              ) : photos.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, padding: '8px 0' }}>Inga foton uppladdade än.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {photos.map(photo => {
                    const isPending = photo.status === 'pending';
                    return (
                    <div key={photo.id} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'rgba(0,0,0,0.3)', opacity: isPending ? 0.85 : 1 }}>
                      {isPending && (
                        <div style={{ position: 'absolute', top: 6, left: 6, zIndex: 2, background: 'rgba(200,150,0,0.9)', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, color: '#fff' }}>🕐 Väntar</div>
                      )}
                      <img
                        src={photo.imageData}
                        alt=""
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.72)', padding: '6px 8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isPending ? 5 : 0 }}>
                          <div>
                            <div style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{photo.alias}</div>
                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{(photo.uploadedAt || '').slice(0, 10)}</div>
                          </div>
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            disabled={deletingPhoto[photo.id]}
                            style={{ background: 'rgba(220,40,40,0.85)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', cursor: deletingPhoto[photo.id] ? 'not-allowed' : 'pointer', opacity: deletingPhoto[photo.id] ? 0.6 : 1 }}
                          >
                            {deletingPhoto[photo.id] ? '...' : '🗑️'}
                          </button>
                        </div>
                        {isPending && (
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button
                              onClick={() => handleApprovePhoto(photo.id, 'approved')}
                              disabled={approvingPhoto[photo.id]}
                              style={{ flex: 1, background: 'rgba(30,180,80,0.9)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 6px', cursor: approvingPhoto[photo.id] ? 'not-allowed' : 'pointer', opacity: approvingPhoto[photo.id] ? 0.6 : 1 }}
                            >
                              ✓ Godkänn
                            </button>
                            <button
                              onClick={() => handleApprovePhoto(photo.id, 'rejected')}
                              disabled={approvingPhoto[photo.id]}
                              style={{ flex: 1, background: 'rgba(180,50,50,0.85)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 6px', cursor: approvingPhoto[photo.id] ? 'not-allowed' : 'pointer', opacity: approvingPhoto[photo.id] ? 0.6 : 1 }}
                            >
                              ✕ Neka
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
                        disabled={resettingPw[p.alias]}
                        style={{ background: resettingPw[p.alias] ? 'rgba(240,220,0,0.5)' : COLORS.lime, border: "none", color: COLORS.dark, borderRadius: 8, padding: "6px 14px", cursor: resettingPw[p.alias] ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, opacity: resettingPw[p.alias] ? 0.7 : 1, transition: 'all 0.2s', minWidth: 60 }}>
                        {resettingPw[p.alias] ? 'Sparar...' : 'Spara'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Log viewer */}
                <button
                  onClick={() => setExpandedLogs(prev => ({ ...prev, [p.alias]: !prev[p.alias] }))}
                  style={{ width: '100%', marginTop: 8, padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>📋 Träningsloggar ({(p.logs || []).length} st)</span>
                  <span>{expandedLogs[p.alias] ? '▲' : '▼'}</span>
                </button>

                {expandedLogs[p.alias] && (
                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(p.logs || []).length === 0 ? (
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '6px 10px' }}>Inga loggar.</div>
                    ) : [...(p.logs || [])].sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                      <div key={log.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{log.date}</div>
                          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.points}p &nbsp;·&nbsp; {log.minutes} min
                            {log.title ? ` · ${log.title}` : ''}
                            {log.bingo ? ' · Bingo' : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLog(p.alias, log.id)}
                          disabled={deletingLog[log.id]}
                          style={{ flexShrink: 0, background: 'rgba(220,40,40,0.7)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 8px', cursor: deletingLog[log.id] ? 'not-allowed' : 'pointer', opacity: deletingLog[log.id] ? 0.6 : 1 }}
                        >
                          {deletingLog[log.id] ? '...' : '🗑️'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Delete player */}
                {deleteConfirm[p.alias] ? (
                  <div style={{ background: "rgba(220,40,40,0.1)", border: "1px solid rgba(220,40,40,0.35)", borderRadius: 10, padding: "10px 12px", marginTop: 6 }}>
                    <div style={{ color: "#f87171", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                      ⚠️ Ta bort {p.alias}? All data raderas permanent.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => handleDeleteUser(p.alias)}
                        disabled={deleting[p.alias]}
                        style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: COLORS.red, color: "#fff", fontWeight: 700, fontSize: 13, cursor: deleting[p.alias] ? "not-allowed" : "pointer", opacity: deleting[p.alias] ? 0.6 : 1 }}
                      >
                        {deleting[p.alias] ? "Tar bort..." : "Ja, ta bort"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(prev => ({ ...prev, [p.alias]: false }))}
                        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(prev => ({ ...prev, [p.alias]: true }))}
                    style={{ width: "100%", marginTop: 6, padding: "7px 0", borderRadius: 10, border: "1px solid rgba(220,40,40,0.3)", background: "transparent", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    🗑️ Ta bort spelare
                  </button>
                )}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
