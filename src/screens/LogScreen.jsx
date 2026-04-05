import { useState, useEffect, useRef } from 'react';
import { COLORS, EXERCISES, SUMMER_ACTIVITIES } from '../constants';
import { localToday } from '../utils';
import { Card, ButtonLoader } from '../components/common';
import { useUser } from '../context/UserContext';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';

function clamp(val, min, max) {
  if (val === '') return '';
  const n = Number(val);
  if (isNaN(n)) return '';
  return String(Math.min(Math.max(Math.round(n), min), max));
}

function formatTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

const INPUT_STYLE = {
  padding: '9px 12px',
  borderRadius: 10,
  border: '1.5px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 14,
  fontFamily: "'Nunito', sans-serif",
};

const SECTION_LABEL = {
  color: 'rgba(255,255,255,0.5)',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 10,
};

const RANGE_STYLE = {
  color: 'rgba(255,255,255,0.35)',
  fontSize: 11,
  fontWeight: 600,
  marginLeft: 'auto',
};

export function LogScreen() {
  const { user, setScreen, handleSaveLog, handleUpdateLog } = useUser();

  const [tab, setTab] = useState(() =>
    window.location.pathname === '/history' ? 'history' : 'write',
  );

  // === Write tab state ===
  const [date, setDate] = useState(localToday());
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState(
    EXERCISES.map((e) => ({ id: e.id, value: '', highscore: '' })),
  );
  const [summer, setSummer] = useState({ iceCream: '', swim: '', pages: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tooLittle, setTooLittle] = useState(false);
  const [todayOpen, setTodayOpen] = useState(false);
  const [btnVisible, setBtnVisible] = useState(true);
  const lastScrollY = useRef(0);
  const sentinelRef = useRef(null);

  // === History tab state ===
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  // Today's logs for summary
  const today = localToday();
  const todayLogs = (user.logs || []).filter(
    (l) => l.date === today && !l.bingo && !l.dailyChallenge,
  );

  // All logs for history tab
  const allLogs = (user.logs || [])
    .map((l, i) => ({ ...l, _idx: i }))
    .filter((l) => !l.bingo)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Scroll-aware sticky button
  useEffect(() => {
    if (tab !== 'write') return;
    function onScroll() {
      const y = window.scrollY;
      const scrollingDown = y > lastScrollY.current;
      const sentinel = sentinelRef.current;
      if (sentinel) {
        const rect = sentinel.getBoundingClientRect();
        const naturalPosVisible = rect.top < window.innerHeight;
        if (naturalPosVisible) setBtnVisible(true);
        else if (scrollingDown) setBtnVisible(true);
        else setBtnVisible(false);
      }
      lastScrollY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [tab]);

  // === Write tab helpers ===
  function setVal(id, field, val) {
    const ex = EXERCISES.find((e) => e.id === id);
    const clamped = ex ? clamp(val, 0, ex.max) : val;
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: clamped } : e)));
  }

  function setSummerVal(id, val) {
    const act = SUMMER_ACTIVITIES.find((a) => a.id === id);
    const clamped = act ? clamp(val, 0, act.max) : val;
    setSummer((prev) => ({ ...prev, [id]: clamped }));
  }

  async function handleSave() {
    if (saving) return;
    const filled = exercises.filter((e) => e.value !== '' && Number(e.value) > 0);
    const summerFilled = Object.values(summer).some((v) => v !== '' && Number(v) > 0);

    if (filled.length === 0 && !summerFilled) return;

    const freeEx = exercises.find((e) => e.id === 'fritraning');
    const totalMins = freeEx && freeEx.value !== '' ? Number(freeEx.value) : 0;
    const totalTouch = filled.reduce((s, e) => {
      const ex = EXERCISES.find((x) => x.id === e.id);
      return s + (ex?.isTime || e.id === 'skott' ? 0 : Number(e.value));
    }, 0);

    if (filled.length > 0 && !summerFilled) {
      const meetsThreshold = totalMins >= 5 || totalTouch >= 30;
      if (!meetsThreshold) {
        setTooLittle(true);
        setTimeout(() => setTooLittle(false), 3000);
        return;
      }
    }

    const points = totalTouch + totalMins * 5;

    const newHighscores = { ...user.highscores };
    exercises.forEach((e) => {
      if (e.highscore && Number(e.highscore) > 0) {
        if (!newHighscores[e.id] || Number(e.highscore) > newHighscores[e.id]) {
          newHighscores[e.id] = Number(e.highscore);
        }
      }
    });

    const log = {
      date,
      title: title.trim(),
      exercises: filled.map((e) => ({ id: e.id, value: Number(e.value) })),
      points,
      minutes: totalMins,
      iceCream: Number(summer.iceCream) || 0,
      swim: Number(summer.swim) || 0,
      pages: Number(summer.pages) || 0,
    };

    setSaving(true);
    const success = await handleSaveLog(log, newHighscores);
    setSaving(false);

    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setTitle('');
      setExercises(EXERCISES.map((e) => ({ id: e.id, value: '', highscore: '' })));
      setSummer({ iceCream: '', swim: '', pages: '' });
    }
  }

  // === History tab helpers ===
  function startEdit(log) {
    const exState = EXERCISES.map((ex) => {
      const found = (log.exercises || []).find((e) => e.id === ex.id);
      return { id: ex.id, value: found ? String(found.value) : '', highscore: '' };
    });
    setEditing({
      id: log.id,
      date: log.date,
      title: log.title || '',
      exercises: exState,
      summer: {
        iceCream: log.iceCream ? String(log.iceCream) : '',
        swim: log.swim ? String(log.swim) : '',
        pages: log.pages ? String(log.pages) : '',
      },
    });
  }

  function setEditVal(id, val) {
    const ex = EXERCISES.find((e) => e.id === id);
    const clamped = ex ? clamp(val, 0, ex.max) : val;
    setEditing((prev) => ({
      ...prev,
      exercises: prev.exercises.map((e) => (e.id === id ? { ...e, value: clamped } : e)),
    }));
  }

  function setEditSummerVal(id, val) {
    const act = SUMMER_ACTIVITIES.find((a) => a.id === id);
    const clamped = act ? clamp(val, 0, act.max) : val;
    setEditing((prev) => ({
      ...prev,
      summer: { ...prev.summer, [id]: clamped },
    }));
  }

  async function saveEdit() {
    if (busy) return;
    setBusy(true);
    const filled = editing.exercises.filter((e) => e.value !== '' && Number(e.value) > 0);
    const freeEx = editing.exercises.find((e) => e.id === 'fritraning');
    const totalMins = freeEx?.value ? Number(freeEx.value) : 0;
    const totalTouch = filled.reduce((s, e) => {
      const ex = EXERCISES.find((x) => x.id === e.id);
      return s + (ex?.isTime || e.id === 'skott' ? 0 : Number(e.value));
    }, 0);
    const points = totalTouch + totalMins * 5;
    const updated = {
      date: editing.date,
      title: editing.title || '',
      exercises: filled.map((e) => ({ id: e.id, value: Number(e.value) })),
      points,
      minutes: totalMins,
      iceCream: Number(editing.summer.iceCream) || 0,
      swim: Number(editing.summer.swim) || 0,
      pages: Number(editing.summer.pages) || 0,
    };
    await handleUpdateLog('edit', editing.id, updated);
    setEditing(null);
    setBusy(false);
  }

  async function deleteLog(logId) {
    if (busy) return;
    setBusy(true);
    await handleUpdateLog('delete', logId, null);
    setConfirmDelete(null);
    setBusy(false);
  }

  // ========================
  // RENDER — Edit mode
  // ========================
  if (editing) {
    return (
      <div style={{ padding: '20px 16px 32px', fontFamily: "'Nunito', sans-serif" }}>
        <button
          onClick={() => setEditing(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: COLORS.lime,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 700,
            marginBottom: 16,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Avbryt
        </button>

        <div
          style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 24,
            color: '#fff',
            marginBottom: 4,
          }}
        >
          Redigera
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 14 }}>
          {editing.date}
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
            Namn på passet <span style={{ color: 'rgba(255,255,255,0.35)' }}>(valfritt)</span>
          </label>
          <input
            type="text"
            maxLength={40}
            placeholder="T.ex. Morgonträning"
            value={editing.title}
            onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))}
            style={{
              ...INPUT_STYLE,
              display: 'block',
              width: '100%',
              marginTop: 5,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Exercises */}
        <div style={SECTION_LABEL}>⚽ Träning</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {EXERCISES.map((ex) => {
            const val = editing.exercises.find((e) => e.id === ex.id);
            return (
              <div
                key={ex.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  borderLeft: `3px solid ${ex.color}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{ex.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                    0–{ex.max} {ex.unit}
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max={ex.max}
                  placeholder={`0 ${ex.unit}`}
                  value={val?.value || ''}
                  onChange={(e) => setEditVal(ex.id, e.target.value)}
                  style={{ ...INPUT_STYLE, width: 80, textAlign: 'right' }}
                />
              </div>
            );
          })}
        </div>

        {/* Summer */}
        <div style={SECTION_LABEL}>☀️ Sommargrejer</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {SUMMER_ACTIVITIES.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '10px 14px',
                borderLeft: `3px solid ${act.color}`,
              }}
            >
              <span style={{ fontSize: 18 }}>{act.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{act.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                  0–{act.max} {act.unit}
                </div>
              </div>
              <input
                type="number"
                min="0"
                max={act.max}
                placeholder={`0 ${act.unit}`}
                value={editing.summer[act.id] || ''}
                onChange={(e) => setEditSummerVal(act.id, e.target.value)}
                style={{ ...INPUT_STYLE, width: 80, textAlign: 'right' }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={saveEdit}
          disabled={busy}
          style={{
            width: '100%',
            padding: '15px 0',
            borderRadius: 14,
            border: 'none',
            background: busy ? 'rgba(240,220,0,0.5)' : COLORS.lime,
            color: COLORS.dark,
            fontFamily: "'Fredoka One', cursive",
            fontSize: 19,
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {busy ? (
            <>
              <ButtonLoader color={COLORS.dark} /> Sparar...
            </>
          ) : (
            '💾 Spara ändringar'
          )}
        </button>
      </div>
    );
  }

  // ========================
  // RENDER — Main (tabs)
  // ========================
  return (
    <div style={{ padding: '20px 16px 0px 16px', fontFamily: "'Nunito', sans-serif" }}>
      <button
        onClick={() => setScreen('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          color: COLORS.lime,
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 16,
          padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Tillbaka
      </button>

      <div
        style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 26,
          color: '#fff',
          marginBottom: 4,
        }}
      >
        Dagbok 📕
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
        {tab === 'write' ? 'Fyll i vad du gjort idag!' : `${allLogs.length} pass loggade`}
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          marginBottom: 20,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={() => setTab('write')}
          style={{
            flex: 1,
            padding: '12px 0',
            border: 'none',
            background: tab === 'write' ? COLORS.lime : 'transparent',
            color: tab === 'write' ? COLORS.dark : 'rgba(255,255,255,0.6)',
            fontFamily: "'Fredoka One', cursive",
            fontSize: 15,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ✏️ Skriv
        </button>
        <button
          onClick={() => setTab('history')}
          style={{
            flex: 1,
            padding: '12px 0',
            border: 'none',
            background: tab === 'history' ? COLORS.lime : 'transparent',
            color: tab === 'history' ? COLORS.dark : 'rgba(255,255,255,0.6)',
            fontFamily: "'Fredoka One', cursive",
            fontSize: 15,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📋 Historik
        </button>
      </div>

      {/* ====== WRITE TAB ====== */}
      {tab === 'write' && (
        <>
          {/* Today's already-logged entries (collapsible) */}
          {todayLogs.length > 0 && (
            <Card
              style={{
                marginBottom: 20,
                borderLeft: `4px solid ${COLORS.lime}`,
                padding: 0,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setTodayOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {todayOpen ? (
                  <ChevronDown size={16} color={COLORS.lime} />
                ) : (
                  <ChevronRight size={16} color={COLORS.lime} />
                )}
                <span style={{ color: COLORS.lime, fontWeight: 700, fontSize: 14 }}>
                  📋 Redan loggat idag
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}>
                  ({todayLogs.length} {todayLogs.length === 1 ? 'logg' : 'loggar'})
                </span>
              </button>
              {todayOpen && (
                <div style={{ padding: '0 16px 12px' }}>
                  {todayLogs.map((log, i) => {
                    const time = formatTime(log.createdAt);
                    return (
                      <div
                        key={log.id || i}
                        onClick={() => {
                          setTab('history');
                          startEdit(log);
                        }}
                        style={{
                          marginBottom: i < todayLogs.length - 1 ? 10 : 0,
                          paddingBottom: i < todayLogs.length - 1 ? 10 : 0,
                          borderBottom:
                            i < todayLogs.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                          cursor: 'pointer',
                          borderRadius: 8,
                          padding: '8px 10px',
                          margin: '0 -10px',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {log.title && (
                          <div
                            style={{
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 13,
                              marginBottom: 4,
                            }}
                          >
                            {log.title}
                          </div>
                        )}
                        {(log.exercises || []).map((e) => {
                          const ex = EXERCISES.find((x) => x.id === e.id);
                          if (!ex) return null;
                          return (
                            <div
                              key={e.id}
                              style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: 13,
                                lineHeight: 1.7,
                              }}
                            >
                              {e.value}
                              {ex.isTime ? ' min' : 'st'} {ex.label} redan registrerat
                            </div>
                          );
                        })}
                        {log.iceCream > 0 && (
                          <div
                            style={{
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: 13,
                              lineHeight: 1.7,
                            }}
                          >
                            🍦 {log.iceCream} glassar redan registrerat
                          </div>
                        )}
                        {log.swim > 0 && (
                          <div
                            style={{
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: 13,
                              lineHeight: 1.7,
                            }}
                          >
                            🏊 {log.swim} bad redan registrerat
                          </div>
                        )}
                        {log.pages > 0 && (
                          <div
                            style={{
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: 13,
                              lineHeight: 1.7,
                            }}
                          >
                            📖 {log.pages} sidor redan registrerat
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 4,
                          }}
                        >
                          {time && (
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                              Loggad kl {time}
                            </span>
                          )}
                          <span style={{ color: COLORS.lime, fontSize: 11, fontWeight: 600 }}>
                            Tryck för att redigera →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Date */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
              Datum
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                ...INPUT_STYLE,
                display: 'block',
                width: '100%',
                marginTop: 5,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Title (optional) */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
              Namn på passet <span style={{ color: 'rgba(255,255,255,0.35)' }}>(valfritt)</span>
            </label>
            <input
              type="text"
              maxLength={40}
              placeholder="T.ex. Morgonträning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                ...INPUT_STYLE,
                display: 'block',
                width: '100%',
                marginTop: 5,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Training section */}
          <div style={SECTION_LABEL}>⚽ Träning</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {EXERCISES.map((ex) => {
              const val = exercises.find((e) => e.id === ex.id);
              return (
                <Card key={ex.id} style={{ borderLeft: `4px solid ${ex.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div
                      style={{ width: 10, height: 10, borderRadius: '50%', background: ex.color }}
                    />
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{ex.label}</div>
                    <div style={RANGE_STYLE}>
                      0–{ex.max} {ex.unit}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max={ex.max}
                      placeholder={`Antal ${ex.unit}`}
                      value={val?.value || ''}
                      onChange={(e) => setVal(ex.id, 'value', e.target.value)}
                      style={{ ...INPUT_STYLE, flex: 1 }}
                    />
                    {ex.hasHighscore && (
                      <input
                        type="number"
                        min="0"
                        max={ex.max}
                        placeholder="🏆 Rekord"
                        value={val?.highscore || ''}
                        onChange={(e) => setVal(ex.id, 'highscore', e.target.value)}
                        style={{
                          ...INPUT_STYLE,
                          flex: 1,
                          border: `1.5px solid ${COLORS.accent}55`,
                          background: 'rgba(255,218,61,0.06)',
                        }}
                      />
                    )}
                  </div>
                  {ex.hasHighscore && (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 5 }}>
                      Rekord = flest i rad utan att tappa bollen
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Summer activities */}
          <div style={SECTION_LABEL}>☀️ Sommargrejer</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {SUMMER_ACTIVITIES.map((act) => (
              <Card key={act.id} style={{ borderLeft: `4px solid ${act.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{act.icon}</span>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{act.label}</div>
                  <div style={RANGE_STYLE}>
                    0–{act.max} {act.unit}
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  max={act.max}
                  placeholder={`Antal ${act.unit}`}
                  value={summer[act.id] || ''}
                  onChange={(e) => setSummerVal(act.id, e.target.value)}
                  style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }}
                />
              </Card>
            ))}
          </div>

          {/* Validation error */}
          {tooLittle && (
            <div
              style={{
                background: 'rgba(220,40,40,0.15)',
                border: `1px solid ${COLORS.red}`,
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                color: COLORS.red,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              ⚠️ Minst 5 minuter eller 30 touch krävs!
            </div>
          )}

          {/* Sticky save button */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 100,
              margin: '0 -16px',
              padding: '20px 16px',
              background: `linear-gradient(to bottom, transparent 0%, ${COLORS.dark}dd 30%)`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transform: btnVisible ? 'translateY(0)' : 'translateY(100%)',
              opacity: btnVisible ? 1 : 0,
              transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                padding: '16px 0',
                borderRadius: 16,
                border: 'none',
                background: saving ? 'rgba(240,220,0,0.5)' : COLORS.lime,
                color: COLORS.dark,
                fontFamily: "'Fredoka One', cursive",
                fontSize: 20,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: `0 4px 24px ${COLORS.lime}55`,
                transition: 'background 0.3s',
              }}
            >
              {saving ? (
                <>
                  <ButtonLoader color={COLORS.dark} /> Sparar...
                </>
              ) : saved ? (
                '✅ Sparat!'
              ) : (
                <>
                  Spara <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
          <div ref={sentinelRef} />
        </>
      )}

      {/* ====== HISTORY TAB ====== */}
      {tab === 'history' && (
        <div style={{ paddingBottom: 32 }}>
          {allLogs.length === 0 && (
            <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 40 }}>
              Inga pass loggade än!
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allLogs.map((log) => {
              const totalMins =
                (log.exercises || []).find((e) => e.id === 'fritraning')?.value || 0;
              const totalTouch = (log.exercises || []).reduce((s, e) => {
                const ex = EXERCISES.find((x) => x.id === e.id);
                return s + (ex && !ex.isTime && e.id !== 'skott' ? e.value || 0 : 0);
              }, 0);
              const isConfirming = confirmDelete === log.id;
              const time = formatTime(log.createdAt);

              return (
                <Card key={log.id || log._idx} style={{ padding: '14px 16px' }}>
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                        {log.title || `📅 ${log.date}`}
                      </div>
                      {log.title && (
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                          📅 {log.date}
                          {time ? ` · ${time}` : ''}
                        </div>
                      )}
                      {!log.title && time && (
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{time}</div>
                      )}
                    </div>
                    <div style={{ color: COLORS.yellow, fontWeight: 700, fontSize: 13 }}>
                      +{log.points || 0} p
                    </div>
                  </div>

                  {/* Exercise stats */}
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>
                    {totalMins > 0 && <span>⏱ {totalMins} min </span>}
                    {totalTouch > 0 && <span>🦶 {totalTouch} touch </span>}
                    {(log.exercises || [])
                      .filter((e) => e.id === 'skott' && e.value > 0)
                      .map((e) => (
                        <span key="skott">🥅 {e.value} skott </span>
                      ))}
                  </div>

                  {/* Summer stats */}
                  {(log.iceCream > 0 || log.swim > 0 || log.pages > 0) && (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>
                      {log.iceCream > 0 && <span>🍦 {log.iceCream} glassar </span>}
                      {log.swim > 0 && <span>🏊 {log.swim} bad </span>}
                      {log.pages > 0 && <span>📖 {log.pages} sidor </span>}
                    </div>
                  )}

                  {/* Daily challenge badge */}
                  {log.dailyChallenge && (
                    <div
                      style={{
                        color: COLORS.yellow,
                        fontSize: 12,
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                    >
                      ⚡ Daglig utmaning
                    </div>
                  )}

                  {/* Actions */}
                  {isConfirming ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => deleteLog(log.id)}
                        disabled={busy}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          borderRadius: 10,
                          border: 'none',
                          background: COLORS.red,
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          opacity: busy ? 0.7 : 1,
                        }}
                      >
                        {busy ? (
                          <>
                            <ButtonLoader /> Tar bort...
                          </>
                        ) : (
                          '🗑 Ja, ta bort'
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        disabled={busy}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.2)',
                          background: 'transparent',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => startEdit(log)}
                        style={{
                          flex: 1,
                          padding: '9px 0',
                          borderRadius: 10,
                          border: 'none',
                          background: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Redigera
                      </button>
                      <button
                        onClick={() => setConfirmDelete(log.id)}
                        style={{
                          padding: '9px 14px',
                          borderRadius: 10,
                          border: '1px solid rgba(220,40,40,0.4)',
                          background: 'transparent',
                          color: COLORS.red,
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
