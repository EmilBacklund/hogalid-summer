import { useState, useEffect, useRef } from 'react';
import { COLORS, EXERCISES, SUMMER_ACTIVITIES } from '../constants';
import { localToday, getWeekStart } from '../utils';
import { Card, ButtonLoader, PenaltyGame } from '../components/common';
import { useUser } from '../context/UserContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const DAY_LABELS = ['Må', 'Ti', 'On', 'To', 'Fr', 'Lö', 'Sö'];

function addDaysStr(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function getISOWeekNumber(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function clamp(val, min, max) {
  if (val === '') return '';
  const n = Number(val);
  if (isNaN(n)) return '';
  return String(Math.min(Math.max(Math.round(n), min), max));
}

function digitsOnly(val) {
  return val.replace(/\D/g, '');
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

  // === Write state ===
  const [date, setDate] = useState(localToday());
  const [exercises, setExercises] = useState(
    EXERCISES.map((e) => ({ id: e.id, value: '', highscore: '' })),
  );
  const [summer, setSummer] = useState({ iceCream: '', swim: '', pages: '' });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tooLittle, setTooLittle] = useState(false);
  const [calWeekOffset, setCalWeekOffset] = useState(0);
  const [btnVisible, setBtnVisible] = useState(true);
  const [showPenalty, setShowPenalty] = useState(false);
  const lastScrollY = useRef(0);
  const sentinelRef = useRef(null);

  const today = localToday();
  const pairedBeforeFeatured = EXERCISES.filter((ex) =>
    ['toetaps', 'tvafotare', 'suldrag', 'cruyff'].includes(ex.id),
  );
  const freeTrainingExercise = EXERCISES.find((ex) => ex.id === 'fritraning');
  const jongleraExercise = EXERCISES.find((ex) => ex.id === 'jonglera');
  const pairedAfterFeatured = EXERCISES.filter((ex) => ['passningar', 'skott'].includes(ex.id));

  // Derive current log for selected date (most recent if multiple)
  const selectedDateLog =
    (user.logs || [])
      .filter((l) => l.date === date && !l.bingo && !l.dailyChallenge)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0] || null;

  // Fill form when date changes
  useEffect(() => {
    const logs = (user.logs || [])
      .filter((l) => l.date === date && !l.bingo && !l.dailyChallenge)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const log = logs[0];
    if (log) {
      setExercises(
        EXERCISES.map((ex) => {
          const found = (log.exercises || []).find((e) => e.id === ex.id);
          return { id: ex.id, value: found ? String(found.value) : '', highscore: '' };
        }),
      );
      setSummer({
        iceCream: log.iceCream ? String(log.iceCream) : '',
        swim: log.swim ? String(log.swim) : '',
        pages: log.pages ? String(log.pages) : '',
      });
    } else {
      setExercises(EXERCISES.map((e) => ({ id: e.id, value: '', highscore: '' })));
      setSummer({ iceCream: '', swim: '', pages: '' });
    }
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-aware sticky button
  useEffect(() => {
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
  }, []);

  // === Write tab helpers ===
  function setVal(id, field, val) {
    const ex = EXERCISES.find((e) => e.id === id);
    const clamped = ex ? clamp(digitsOnly(val), 0, ex.max) : digitsOnly(val);
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: clamped } : e)));
  }

  function setSummerVal(id, val) {
    const act = SUMMER_ACTIVITIES.find((a) => a.id === id);
    const clamped = act ? clamp(digitsOnly(val), 0, act.max) : digitsOnly(val);
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
        // Easter egg: only 37 skott → never show threshold error, show game if not played yet
        const skottOnly =
          filled.length === 1 &&
          filled[0].id === 'skott' &&
          Number(filled[0].value) === 37;
        if (skottOnly) {
          setShowPenalty(true);
          return; // always return — 37 skott alone is never a real log
        }
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

    // Never persist the magic 37 skott — they only unlock the Easter egg
    const filledToSave = filled.filter(
      e => !(e.id === 'skott' && Number(e.value) === 37),
    );

    const log = {
      date,
      exercises: filledToSave.map((e) => ({ id: e.id, value: Number(e.value) })),
      points,
      minutes: totalMins,
      iceCream: Number(summer.iceCream) || 0,
      swim: Number(summer.swim) || 0,
      pages: Number(summer.pages) || 0,
    };

    setSaving(true);
    try {
      if (selectedDateLog) {
        await handleUpdateLog('edit', selectedDateLog.id, log);
      } else {
        await handleSaveLog(log, newHighscores);
      }
    } finally {
      setSaving(false);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    // Easter egg: 37 skott → penalty shootout
    const skottVal = filled.find(e => e.id === 'skott');
    if (skottVal && Number(skottVal.value) === 37) {
      setShowPenalty(true);
    }
  }

  // ========================
  // RENDER — Main
  // ========================
  return (
    <div
      style={{
        padding: '20px 16px calc(116px + env(safe-area-inset-bottom, 0px)) 16px',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
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
        Fyll i vad du gjort!
      </div>

      <>
        {/* Week calendar */}
        {(() => {
          const calWeekStart = addDaysStr(getWeekStart(today), calWeekOffset * 7);
          const weekDays = Array.from({ length: 7 }, (_, i) => addDaysStr(calWeekStart, i));
          const weekNumber = getISOWeekNumber(calWeekStart);
          const logDates = new Set(
            (user.logs || []).filter((l) => !l.bingo && !l.dailyChallenge).map((l) => l.date),
          );
          return (
            <Card style={{ marginBottom: 20, padding: '14px 12px' }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <button
                  onClick={() => setCalWeekOffset((v) => v - 1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 20,
                    cursor: 'pointer',
                    padding: '0 6px',
                    lineHeight: 1,
                  }}
                >
                  ←
                </button>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700 }}>
                  Vecka {weekNumber}
                </span>
                <button
                  onClick={() => setCalWeekOffset((v) => v + 1)}
                  disabled={calWeekOffset >= 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: calWeekOffset >= 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
                    fontSize: 20,
                    cursor: calWeekOffset >= 0 ? 'default' : 'pointer',
                    padding: '0 6px',
                    lineHeight: 1,
                  }}
                >
                  →
                </button>
              </div>

              {/* Day cells */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                }}
              >
                {weekDays.map((dayDate, i) => {
                  const isFuture = dayDate > today;
                  const isSelected = dayDate === date;
                  const isToday = dayDate === today;
                  const hasLog = logDates.has(dayDate);
                  const dayNum = dayDate.slice(-2).replace(/^0/, '');
                  return (
                    <div
                      key={dayDate}
                      onClick={!isFuture ? () => setDate(dayDate) : undefined}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: '8px 0',
                        borderRadius: 10,
                        cursor: isFuture ? 'default' : 'pointer',
                        background: isSelected ? COLORS.lime : 'rgba(255,255,255,0.05)',
                        opacity: isFuture ? 0.3 : 1,
                        transition: 'background 0.15s',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isSelected ? COLORS.dark : 'rgba(255,255,255,0.45)',
                          letterSpacing: 0.5,
                        }}
                      >
                        {DAY_LABELS[i]}
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: isSelected ? COLORS.dark : isToday ? COLORS.lime : '#fff',
                          textDecoration: isToday && !isSelected ? 'underline' : 'none',
                          textUnderlineOffset: 3,
                        }}
                      >
                        {dayNum}
                      </span>
                      {/* Log indicator dot */}
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: hasLog
                            ? isSelected
                              ? COLORS.dark
                              : COLORS.yellow
                            : 'transparent',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}

        {/* Training section */}
        <div style={SECTION_LABEL}>⚽ Träning</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 12,
          }}
        >
          {pairedBeforeFeatured.map((ex) => {
            const val = exercises.find((e) => e.id === ex.id);
            return (
              <Card
                key={ex.id}
                style={{
                  borderLeft: `4px solid ${ex.color}`,
                  padding: '16px 14px',
                  minWidth: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: ex.color,
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{ex.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 3 }}>
                      0–{ex.max} {ex.unit}
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  placeholder={`Antal ${ex.unit}`}
                  value={val?.value || ''}
                  onChange={(e) => setVal(ex.id, 'value', e.target.value)}
                  style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }}
                />
              </Card>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
          {[freeTrainingExercise].filter(Boolean).map((ex) => {
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
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 10,
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      placeholder={`Antal ${ex.unit}`}
                      value={val?.value || ''}
                      onChange={(e) => setVal(ex.id, 'value', e.target.value)}
                      style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {[jongleraExercise].filter(Boolean).map((ex) => {
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
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: ex.hasHighscore ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                    gap: 10,
                    alignItems: 'start',
                  }}
                >
                  <div>
                    {ex.hasHighscore && (
                      <div
                        style={{
                          color: 'rgba(255,255,255,0.45)',
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                        }}
                      >
                        Touch
                      </div>
                    )}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      placeholder={`Antal ${ex.unit}`}
                      value={val?.value || ''}
                      onChange={(e) => setVal(ex.id, 'value', e.target.value)}
                      style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  {ex.hasHighscore && (
                    <div>
                      <div
                        style={{
                          color: 'rgba(255,255,255,0.45)',
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 6,
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                        }}
                      >
                        Rekord
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        placeholder="🏆 Rekord"
                        value={val?.highscore || ''}
                        onChange={(e) => setVal(ex.id, 'highscore', e.target.value)}
                        style={{
                          ...INPUT_STYLE,
                          width: '100%',
                          boxSizing: 'border-box',
                          border: `1.5px solid ${COLORS.accent}55`,
                          background: 'rgba(255,218,61,0.06)',
                        }}
                      />
                    </div>
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {pairedAfterFeatured.map((ex) => {
            const val = exercises.find((e) => e.id === ex.id);
            return (
              <Card
                key={ex.id}
                style={{
                  borderLeft: `4px solid ${ex.color}`,
                  padding: '16px 14px',
                  minWidth: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: ex.color,
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{ex.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 3 }}>
                      0–{ex.max} {ex.unit}
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  placeholder={`Antal ${ex.unit}`}
                  value={val?.value || ''}
                  onChange={(e) => setVal(ex.id, 'value', e.target.value)}
                  style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }}
                />
              </Card>
            );
          })}
        </div>

        {/* Summer activities */}
        <div style={SECTION_LABEL}>☀️ Sommargrejer</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {SUMMER_ACTIVITIES.map((act) => (
            <Card
              key={act.id}
              style={{
                borderTop: `4px solid ${act.color}`,
                padding: '14px 10px 12px',
                minWidth: 0,
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 6 }}>{act.icon}</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{act.label}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 4 }}>
                  0–{act.max} {act.unit}
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder={`Antal ${act.unit}`}
                value={summer[act.id] || ''}
                onChange={(e) => setSummerVal(act.id, e.target.value)}
                style={{
                  ...INPUT_STYLE,
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 8px',
                  textAlign: 'center',
                }}
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
            position: 'fixed',
            left: '50%',
            bottom: 0,
            zIndex: 100,
            width: '100%',
            maxWidth: 480,
            boxSizing: 'border-box',
            padding: '20px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
            background: `linear-gradient(to bottom, transparent 0%, ${COLORS.dark}dd 30%)`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transform: btnVisible
              ? 'translateX(-50%) translateY(0)'
              : 'translateX(-50%) translateY(100%)',
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
            ) : selectedDateLog ? (
              <>
                Uppdatera <ArrowRight size={20} />
              </>
            ) : (
              <>
                Spara <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
        <div ref={sentinelRef} />
      </>

      {showPenalty && (
        <PenaltyGame
          onClose={async (score) => {
            setShowPenalty(false);
            if (typeof score === 'number') {
              try {
                await handleSaveLog(
                  { date: today, exercises: [], penaltyGame: true, goals: score, total: 10, points: score },
                  user.highscores || {},
                );
              } catch (e) {
                // ignore save errors — navigate home regardless
              }
              setScreen('home');
            }
          }}
        />
      )}
    </div>
  );
}
