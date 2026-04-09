import { useState, useEffect, useRef } from 'react';
import { COLORS, EXERCISES, DAILY_CHALLENGES, getCelebrationLine } from '../constants';
import {
  fetchAllUsersStale,
  localToday,
  getWeekStart,
  getDailyChallenge,
  getWeeklyChallenge,
  getWeeklyLevelInfo,
  WEEKLY_LEVEL_NAMES,
} from '../utils';
import { Card, ProgressBar, SkeletonBar, ButtonLoader, Confetti, BuddyCelebration } from '../components/common';
import { useUser } from '../context/UserContext';
import { ArrowLeft } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────

function hoursAgo(isoStr) {
  if (!isoStr) return 0;
  return (Date.now() - new Date(isoStr).getTime()) / 3_600_000;
}

function formatCountdown(acceptedAt) {
  if (!acceptedAt) return '';
  const deadline = new Date(acceptedAt).getTime() + 48 * 3_600_000;
  const ms = deadline - Date.now();
  if (ms <= 0) return 'Utgått';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m kvar`;
}

const QUICK_CHALLENGE_AMOUNTS = {
  toetaps: [60, 80, 100, 120, 150],
  tvafotare: [50, 75, 100, 125, 150],
  jonglera: [50, 60, 75, 100],
  suldrag: [50, 75, 100, 125, 150],
  cruyff: [50, 60, 75, 100],
  passningar: [50, 60, 75, 100],
  skott: [15, 20, 25, 30],
  fritraning: [15, 20, 25, 30],
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getQuickChallengeMinimum(exercise) {
  if (exercise.isTime) return 15;
  if (exercise.unit === 'touch') return 50;
  return 15;
}

function buildQuickChallenge({ user, teammates, buddyChallenges, activeCountByAlias }) {
  const availableTeammates = teammates.filter((tm) => {
    const count = activeCountByAlias[tm.alias] || 0;
    const hasPair = buddyChallenges.some((c) =>
      ((c.fromAlias === user.alias && c.toAlias === tm.alias) ||
        (c.fromAlias === tm.alias && c.toAlias === user.alias)) &&
      ['pending', 'active'].includes(c.status)
    );
    return count < 3 && !hasPair;
  });

  if (availableTeammates.length === 0) return null;

  const exercise = pickRandom(EXERCISES);
  const minAmount = getQuickChallengeMinimum(exercise);
  const defaultAmount = Math.max(minAmount, Math.round(exercise.max * 0.15));
  const amounts = (QUICK_CHALLENGE_AMOUNTS[exercise.id] || [defaultAmount]).filter((amount) => amount >= minAmount);
  return {
    teammate: pickRandom(availableTeammates),
    exercise,
    amount: pickRandom(amounts.length ? amounts : [defaultAmount]),
  };
}

// ── BuddySection component ─────────────────────────────────────────────────

function BuddySection({ user, allUsers, buddyChallenges, handlers }) {
  const { handleCreateBuddyChallenge, handleRespondBuddyChallenge, handleCancelBuddyChallenge } = handlers;

  const [showForm, setShowForm] = useState(false);
  const [celebrateChallenge, setCelebrateChallenge] = useState(null);
  const [formTo, setFormTo] = useState('');
  const [formExercise, setFormExercise] = useState(EXERCISES[0].id);
  const [formAmount, setFormAmount] = useState('');
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [respondBusy, setRespondBusy] = useState('');
  const [quickSuggestion, setQuickSuggestion] = useState(null);
  const [quickBusy, setQuickBusy] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Split challenges by role + status
  const incoming = buddyChallenges.filter(c => c.toAlias === user.alias && c.status === 'pending');
  const outgoing = buddyChallenges.filter(c => c.fromAlias === user.alias && c.status === 'pending');
  const active   = buddyChallenges.filter(c =>
    (c.fromAlias === user.alias || c.toAlias === user.alias) && c.status === 'active');
  const finished = buddyChallenges.filter(c =>
    (c.fromAlias === user.alias || c.toAlias === user.alias) &&
    ['completed','failed','declined','cancelled'].includes(c.status)
  ).slice(0, 5);

  // Count active per potential recipient (for "full" indicator)
  const activeCountByAlias = {};
  buddyChallenges.forEach(c => {
    if (['pending','active'].includes(c.status)) {
      activeCountByAlias[c.fromAlias] = (activeCountByAlias[c.fromAlias] || 0) + 1;
      activeCountByAlias[c.toAlias]   = (activeCountByAlias[c.toAlias]   || 0) + 1;
    }
  });

  const teammates = allUsers.filter(u => u.alias !== user.alias);

  useEffect(() => {
    if (quickSuggestion) return;
    const next = buildQuickChallenge({ user, teammates, buddyChallenges, activeCountByAlias });
    if (next) setQuickSuggestion(next);
  }, [user.alias, teammates.length, buddyChallenges.length]);

  async function submitChallenge() {
    if (!formTo || !formAmount || Number(formAmount) <= 0) return;
    setFormBusy(true);
    setFormError('');
    const result = await handleCreateBuddyChallenge(formTo, formExercise, Number(formAmount));
    setFormBusy(false);
    if (result.ok) {
      setShowForm(false);
      setFormTo('');
      setFormAmount('');
    } else {
      setFormError(result.error || 'Något gick fel');
    }
  }

  async function respond(challengeId, response) {
    setRespondBusy(challengeId + response);
    await handleRespondBuddyChallenge(challengeId, response);
    setRespondBusy('');
  }

  function refreshQuickSuggestion() {
    setQuickSuggestion(buildQuickChallenge({ user, teammates, buddyChallenges, activeCountByAlias }));
  }

  async function submitQuickChallenge() {
    if (!quickSuggestion) return;
    setQuickBusy(true);
    const result = await handleCreateBuddyChallenge(
      quickSuggestion.teammate.alias,
      quickSuggestion.exercise.id,
      quickSuggestion.amount,
    );
    setQuickBusy(false);
    if (result.ok) {
      setQuickSuggestion(buildQuickChallenge({ user, teammates, buddyChallenges, activeCountByAlias }));
    } else {
      setFormError(result.error || 'Något gick fel');
      refreshQuickSuggestion();
    }
  }

  const selectedEx = EXERCISES.find(e => e.id === formExercise);

  const sectionLabel = {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  };

  return (
    <div>
      <Confetti active={showConfetti} />
      {celebrateChallenge && (
        <BuddyCelebration
          challenge={celebrateChallenge}
          user={user}
          onClose={() => setCelebrateChallenge(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            🤝 Kompisutmaningar
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
            Klara tillsammans — dubbla poäng!
          </div>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormError(''); }}
          style={{
            padding: '8px 14px', borderRadius: 10, border: 'none',
            background: showForm ? 'rgba(255,255,255,0.12)' : COLORS.lime,
            color: showForm ? 'rgba(255,255,255,0.7)' : COLORS.dark,
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Stäng' : '+ Ny utmaning'}
        </button>
      </div>

      <div
        style={{
          marginBottom: 14,
          padding: '14px 14px 12px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(240,220,0,0.16), rgba(255,255,255,0.04))',
          border: '1px solid rgba(240,220,0,0.22)',
        }}
      >
        <div style={{ color: COLORS.yellow, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6 }}>
          ⚡ Snabbutmaning
        </div>
        {quickSuggestion ? (
          <>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.35 }}>
              Utmana {quickSuggestion.teammate.alias} på {quickSuggestion.amount} {quickSuggestion.exercise.label.toLowerCase()}?
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 6 }}>
              Ett klick och klart. Vi väljer kompis, övning och rimlig mängd åt dig.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={submitQuickChallenge}
                disabled={quickBusy}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: COLORS.lime,
                  color: COLORS.dark,
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: 16,
                  cursor: quickBusy ? 'default' : 'pointer',
                }}
              >
                {quickBusy ? <><ButtonLoader color={COLORS.dark} /> Skickar...</> : 'Ja, kör!'}
              </button>
              <button
                onClick={refreshQuickSuggestion}
                disabled={quickBusy}
                style={{
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: quickBusy ? 'default' : 'pointer',
                }}
              >
                Nej, ny
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.45 }}>
            Alla möjliga kompisutmaningar är upptagna just nu. Testa igen lite senare eller skapa en egen.
          </div>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <Card style={{ marginBottom: 14, border: `1.5px solid ${COLORS.lime}44` }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Skicka utmaning</div>

          {/* Teammate picker */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Utmana vem?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {teammates.map(tm => {
                const count = activeCountByAlias[tm.alias] || 0;
                const full = count >= 3;
                const hasPair = buddyChallenges.some(c =>
                  ((c.fromAlias === user.alias && c.toAlias === tm.alias) ||
                   (c.fromAlias === tm.alias && c.toAlias === user.alias)) &&
                  ['pending','active'].includes(c.status)
                );
                const disabled = full || hasPair;
                return (
                  <button
                    key={tm.alias}
                    onClick={() => !disabled && setFormTo(tm.alias)}
                    style={{
                      padding: '6px 12px', borderRadius: 20, border: 'none', cursor: disabled ? 'default' : 'pointer',
                      background: formTo === tm.alias ? COLORS.lime : disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                      color: formTo === tm.alias ? COLORS.dark : disabled ? 'rgba(255,255,255,0.25)' : '#fff',
                      fontSize: 13, fontWeight: 600,
                      position: 'relative',
                    }}
                  >
                    {tm.alias}
                    {full && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>full</span>}
                    {hasPair && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>aktiv</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exercise picker */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>Övning</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXERCISES.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setFormExercise(ex.id)}
                  style={{
                    padding: '6px 11px', borderRadius: 10, border: `1.5px solid ${formExercise === ex.id ? ex.color : 'transparent'}`,
                    background: formExercise === ex.id ? `${ex.color}22` : 'rgba(255,255,255,0.07)',
                    color: formExercise === ex.id ? ex.color : 'rgba(255,255,255,0.6)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 6 }}>
              Antal {selectedEx?.unit} (max {selectedEx?.max})
            </div>
            <input
              type="number"
              min="1"
              max={selectedEx?.max}
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              placeholder={`0–${selectedEx?.max}`}
              style={{
                padding: '9px 12px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14,
                fontFamily: "'Nunito', sans-serif", width: 120, boxSizing: 'border-box',
              }}
            />
          </div>

          {formError && (
            <div style={{ color: COLORS.red, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              ⚠️ {formError}
            </div>
          )}

          <button
            onClick={submitChallenge}
            disabled={formBusy || !formTo || !formAmount}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
              background: (!formTo || !formAmount) ? 'rgba(255,255,255,0.1)' : COLORS.lime,
              color: (!formTo || !formAmount) ? 'rgba(255,255,255,0.3)' : COLORS.dark,
              fontFamily: "'Fredoka One', cursive", fontSize: 17,
              cursor: formBusy || !formTo || !formAmount ? 'not-allowed' : 'pointer',
            }}
          >
            {formBusy ? <><ButtonLoader color={COLORS.dark} /> Skickar...</> : '📤 Skicka utmaning'}
          </button>

          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: 5,
          }}>
            {[
              `🤝 Ni ska klara ${formAmount ? `${formAmount} ${selectedEx?.unit}` : 'övningen'} var`,
              '⏰ Ni har 48h på er efter att kompisen accepterat',
              '🌟 Dubbla poäng när ni båda är klara!',
              '📊 Max tre aktiva utmaningar per person',
            ].map((line, i) => (
              <div key={i} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600 }}>
                {line}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Incoming pending */}
      {incoming.length > 0 && (
        <>
          <div style={sectionLabel}>📥 Inkommande ({incoming.length})</div>
          {incoming.map(c => {
            const ex = EXERCISES.find(e => e.id === c.exerciseId);
            const waitH = Math.floor(hoursAgo(c.createdAt));
            return (
              <Card key={c.id} style={{ marginBottom: 10, border: `1.5px solid ${COLORS.yellow}55` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ color: COLORS.yellow, fontWeight: 700, fontSize: 14 }}>
                      {c.fromAlias} utmanar dig!
                    </div>
                    <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginTop: 3 }}>
                      {c.amount} {ex?.label} ({ex?.unit})
                    </div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                    {waitH < 1 ? 'Alldeles nyss' : `${waitH}h sedan`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => respond(c.id, 'accept')}
                    disabled={!!respondBusy}
                    style={{
                      flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                      background: COLORS.lime, color: COLORS.dark,
                      fontFamily: "'Fredoka One', cursive", fontSize: 15, cursor: 'pointer',
                    }}
                  >
                    {respondBusy === c.id + 'accept' ? <ButtonLoader color={COLORS.dark} /> : '✅ Acceptera'}
                  </button>
                  <button
                    onClick={() => respond(c.id, 'decline')}
                    disabled={!!respondBusy}
                    style={{
                      padding: '11px 14px', borderRadius: 10,
                      border: '1px solid rgba(220,40,40,0.4)', background: 'transparent',
                      color: COLORS.red, fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    {respondBusy === c.id + 'decline' ? <ButtonLoader /> : 'Neka'}
                  </button>
                </div>
              </Card>
            );
          })}
        </>
      )}

      {/* Outgoing pending */}
      {outgoing.length > 0 && (
        <>
          <div style={sectionLabel}>📤 Skickade</div>
          {outgoing.map(c => {
            const ex = EXERCISES.find(e => e.id === c.exerciseId);
            const waitH = Math.floor(hoursAgo(c.createdAt));
            return (
              <Card key={c.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Till {c.toAlias}</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginTop: 2 }}>
                      {c.amount} {ex?.label}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                      Väntar sedan {waitH < 1 ? '<1h' : `${waitH}h`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelBuddyChallenge(c.id)}
                  style={{
                    width: '100%', padding: '9px 0', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                    color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Avbryt
                </button>
              </Card>
            );
          })}
        </>
      )}

      {/* Active */}
      {active.length > 0 && (
        <>
          <div style={sectionLabel}>⚡ Pågående</div>
          {active.map(c => {
            const ex = EXERCISES.find(e => e.id === c.exerciseId);
            const isFrom = c.fromAlias === user.alias;
            const myProgress   = isFrom ? c.fromProgress : c.toProgress;
            const theirProgress = isFrom ? c.toProgress : c.fromProgress;
            const myDone    = isFrom ? !!c.fromCompletedAt : !!c.toCompletedAt;
            const theirDone = isFrom ? !!c.toCompletedAt   : !!c.fromCompletedAt;
            const partner   = isFrom ? c.toAlias : c.fromAlias;
            const pct = Math.min(100, Math.round((myProgress / c.amount) * 100));
            const theirPct = Math.min(100, Math.round((theirProgress / c.amount) * 100));
            const countdown = formatCountdown(c.acceptedAt);

            return (
              <Card key={c.id} style={{ marginBottom: 10, border: `1.5px solid ${COLORS.lime}44` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ color: COLORS.lime, fontWeight: 700, fontSize: 13 }}>
                      Du & {partner}
                    </div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginTop: 2 }}>
                      {c.amount} {ex?.label}
                    </div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, textAlign: 'right' }}>
                    ⏰ {countdown}
                  </div>
                </div>

                {/* My progress */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 700 }}>
                      {myDone ? '✅ Du — klar!' : `Du — ${myProgress}/${c.amount} ${ex?.unit}`}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} color={myDone ? COLORS.lime : COLORS.yellow} height={7} />
                </div>

                {/* Partner progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700 }}>
                      {theirDone ? `✅ ${partner} — klar!` : `${partner} — ${theirProgress}/${c.amount} ${ex?.unit}`}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{theirPct}%</span>
                  </div>
                  <ProgressBar value={theirPct} color={theirDone ? COLORS.lime : 'rgba(255,255,255,0.3)'} height={7} />
                </div>

                {theirDone && !myDone && (
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: `${COLORS.yellow}22`, color: COLORS.yellow, fontSize: 13, fontWeight: 700 }}>
                    🔥 {partner} är klar — nu är det din tur!
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}

      {/* Finished */}
      {finished.length > 0 && (
        <>
          <div style={sectionLabel}>📋 Avslutade</div>
          {finished.map(c => {
            const ex = EXERCISES.find(e => e.id === c.exerciseId);
            const partner = c.fromAlias === user.alias ? c.toAlias : c.fromAlias;
            const icon = c.status === 'completed' ? '🎉' : c.status === 'failed' ? '❌' : c.status === 'declined' ? '🚫' : '↩️';
            const label = c.status === 'completed' ? 'Klarad!' : c.status === 'failed' ? 'Missad' : c.status === 'declined' ? 'Nekad' : 'Avbruten';
            const isCompleted = c.status === 'completed';
            return (
              <div
                key={c.id}
                onClick={isCompleted ? () => setCelebrateChallenge(c) : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: isCompleted ? 'rgba(168,230,61,0.07)' : 'rgba(255,255,255,0.04)',
                  border: isCompleted ? `1px solid ${COLORS.lime}33` : '1px solid transparent',
                  borderRadius: 12,
                  padding: '10px 14px', marginBottom: 8,
                  opacity: isCompleted ? 1 : 0.55,
                  cursor: isCompleted ? 'pointer' : 'default',
                }}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                    {c.amount} {ex?.label}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}> med {partner}</span>
                </div>
                <span style={{ color: isCompleted ? COLORS.lime : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}>
                  {label}
                </span>
              </div>
            );
          })}
        </>
      )}

      {/* Empty state */}
      {incoming.length === 0 && outgoing.length === 0 && active.length === 0 && finished.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
          Inga utmaningar ännu — skicka en till en lagkompis!
        </div>
      )}
    </div>
  );
}

export function ChallengesScreen() {
  const { user, setScreen, handleCompleteDaily, loading, seasonStart,
          buddyChallenges, handleCreateBuddyChallenge, handleRespondBuddyChallenge, handleCancelBuddyChallenge,
          challengeScrollTarget, setChallengeScrollTarget } = useUser();

  const dailyRef  = useRef(null);
  const weeklyRef = useRef(null);
  const buddyRef  = useRef(null);

  useEffect(() => {
    if (!challengeScrollTarget) return;
    const refMap = { daily: dailyRef, weekly: weeklyRef, buddy: buddyRef };
    const ref = refMap[challengeScrollTarget];
    if (!ref) return;
    const timer = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setChallengeScrollTarget(null);
    }, 100);
    return () => clearTimeout(timer);
  }, [challengeScrollTarget, setChallengeScrollTarget]);

  const today = localToday();
  const weekStart = getWeekStart(today);
  const daily = getDailyChallenge(seasonStart);
  const weekly = getWeeklyChallenge(seasonStart);

  const completedDaily = user.completedDaily || {};
  const dailyDoneToday = completedDaily[today] === daily.id;
  const [dailyJustCompleted, setDailyJustCompleted] = useState(false);
  const [showDailyConfetti, setShowDailyConfetti] = useState(false);

  const [allUsers, setAllUsers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [showAllLevels, setShowAllLevels] = useState(false);
  useEffect(() => {
    const stale = fetchAllUsersStale(fresh => {
      setAllUsers(fresh);
      setLoadingTeam(false);
    });
    if (stale && stale.length > 0) {
      setAllUsers(stale);
      setLoadingTeam(false);
    }
  }, []);

  let weekTouch = 0,
    weekMinutes = 0;
  allUsers.forEach((u) => {
    (u.logs || []).forEach((l) => {
      if (!l.bingo && l.date >= weekStart && l.date <= today) {
        weekMinutes += l.minutes || 0;
        (l.exercises || []).forEach((e) => {
          const ex = EXERCISES.find((x) => x.id === e.id);
          if (ex && !ex.isTime && e.id !== 'skott') weekTouch += e.value || 0;
        });
      }
    });
  });
  const weekValue = weekly.type === 'touch' ? weekTouch : weekMinutes;
  const weekDone = weekValue >= weekly.goal;
  const levelInfo = getWeeklyLevelInfo(weekValue, weekly.goal);

  // History of completed daily challenges
  const dailyHistory = Object.entries(completedDaily)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)
    .map(([date, id]) => ({ date, challenge: DAILY_CHALLENGES.find((d) => d.id === id) }))
    .filter((e) => e.challenge);

  return (
    <div style={{ padding: '20px 16px 32px', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @keyframes dailyPop { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes dailySlide { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Confetti active={showDailyConfetti} />
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
        <ArrowLeft size={16} />
        Tillbaka
      </button>
      <div
        style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 26,
          color: '#fff',
          marginBottom: 2,
        }}
      >
        Utmaningar ⚡
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
        Dagens uppdrag · lagutmaning · kompisutmaningar
      </div>

      {/* Daily challenge */}
      <div
        ref={dailyRef}
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        📅 Dagens uppdrag
      </div>
      <Card
        style={{
          marginBottom: 20,
          border: dailyDoneToday ? `1.5px solid ${COLORS.lime}` : `1.5px solid rgba(240,220,0,0.3)`,
          background: dailyDoneToday ? 'rgba(240,220,0,0.08)' : 'rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 36, lineHeight: 1 }}>{daily.icon}</div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: dailyDoneToday ? 'rgba(255,255,255,0.5)' : '#fff',
                fontWeight: 700,
                fontSize: 16,
                lineHeight: 1.3,
                textDecoration: dailyDoneToday ? 'line-through' : 'none',
              }}
            >
              {daily.label}
            </div>
            <div style={{ color: COLORS.yellow, fontSize: 13, fontWeight: 700, marginTop: 3 }}>
              +{daily.points} poäng
            </div>
          </div>
        </div>
        {dailyDoneToday ? (
          <div
            style={{
              background: 'rgba(240,220,0,0.12)',
              borderRadius: 14,
              padding: '16px 14px',
              textAlign: 'center',
            }}
          >
            {dailyJustCompleted ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 6, animation: 'dailyPop 0.5s ease-out both' }}>
                  {daily.icon}
                </div>
                <div style={{
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: 28,
                  color: COLORS.yellow,
                  animation: 'dailyPop 0.5s ease-out 0.15s both',
                }}>
                  +{daily.points}p
                </div>
                <div style={{
                  color: COLORS.lime,
                  fontWeight: 700,
                  fontSize: 15,
                  marginTop: 4,
                  animation: 'dailySlide 0.4s ease-out 0.3s both',
                }}>
                  ✅ Bra jobbat!
                </div>
              </>
            ) : (
              <div style={{ color: COLORS.yellow, fontWeight: 700, fontSize: 15 }}>
                ✅ Klarat idag!
              </div>
            )}
            <div style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: 11,
              marginTop: 8,
              animation: dailyJustCompleted ? 'dailySlide 0.4s ease-out 0.5s both' : 'none',
            }}>
              Ny utmaning imorgon 🌅
            </div>
          </div>
        ) : (
          <button
            onClick={async () => {
              await handleCompleteDaily(daily.id, daily.points);
              setDailyJustCompleted(true);
              setShowDailyConfetti(true);
              setTimeout(() => setShowDailyConfetti(false), 3000);
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 12,
              border: 'none',
              background: loading ? 'rgba(240,220,0,0.5)' : COLORS.yellow,
              color: COLORS.dark,
              fontFamily: "'Fredoka One', cursive",
              fontSize: 18,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? <><ButtonLoader color={COLORS.dark} /> Sparar...</> : '✅ Jag har gjort det!'}
          </button>
        )}
      </Card>

      {/* Daily history */}
      {dailyHistory.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            ✨ Senaste klarade dagsuppdrag
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dailyHistory.map(({ date, challenge }) => (
              <div
                key={date}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  padding: '10px 14px',
                }}
              >
                <div style={{ fontSize: 22 }}>{challenge.icon}</div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'line-through',
                    }}
                  >
                    {challenge.label}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>
                    {date}
                  </div>
                </div>
                <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 700 }}>
                  +{challenge.points}p
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly team challenge */}
      <div ref={weeklyRef} style={{ scrollMarginTop: 8 }} />
      <style>{`
        @keyframes fireGlow {
          0%, 100% { box-shadow: 0 0 16px 4px #ff6a00, 0 0 32px 8px #ff4500; }
          50% { box-shadow: 0 0 28px 8px #ffae00, 0 0 48px 16px #ff6a00; }
        }
      `}</style>
      <div
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        🤝 Veckans lagutmaning
      </div>
      <Card
        style={{
          marginBottom: 20,
          border: !loadingTeam && levelInfo.isMaxLevel
            ? '2px solid #ff6a00'
            : !loadingTeam && weekDone
              ? `1.5px solid ${COLORS.lime}`
              : '1px solid rgba(255,255,255,0.15)',
          background: !loadingTeam && levelInfo.isMaxLevel
            ? 'rgba(255,100,0,0.1)'
            : !loadingTeam && weekDone
              ? 'rgba(168,230,61,0.08)'
              : 'rgba(255,255,255,0.06)',
          animation: !loadingTeam && levelInfo.isMaxLevel ? 'fireGlow 1.5s ease-in-out infinite' : 'none',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 32 }}>
            {!loadingTeam && levelInfo.isMaxLevel ? '🔥' : weekly.type === 'touch' ? '🦶' : '⏱'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
              {weekly.label}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>
              Vecka från {weekStart}
            </div>
          </div>
          {!loadingTeam && levelInfo.level > 0 && (
            <div
              style={{
                background: levelInfo.isMaxLevel
                  ? 'linear-gradient(135deg, #ff6a00, #ffae00)'
                  : weekDone
                    ? 'rgba(168,230,61,0.2)'
                    : 'rgba(255,255,255,0.1)',
                border: `1px solid ${levelInfo.isMaxLevel ? '#ff6a00' : weekDone ? COLORS.lime : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 10,
                padding: '4px 10px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  color: levelInfo.isMaxLevel
                    ? '#fff'
                    : weekDone
                      ? COLORS.lime
                      : 'rgba(255,255,255,0.7)',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Nivå {levelInfo.level}
              </div>
              <div
                style={{
                  color: levelInfo.isMaxLevel
                    ? '#fff'
                    : weekDone
                      ? COLORS.lime
                      : 'rgba(255,255,255,0.9)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {levelInfo.isMaxLevel ? '🔥 ' : ''}
                {levelInfo.levelName}
                {levelInfo.isMaxLevel ? ' 🔥' : ''}
              </div>
            </div>
          )}
        </div>

        {loadingTeam ? (
          <div>
            <SkeletonBar height={14} width="60%" borderRadius={6} />
            <div style={{ marginTop: 12 }}>
              <SkeletonBar height={14} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 }}>
              <SkeletonBar height={12} width="25%" borderRadius={4} />
              <SkeletonBar height={12} width="40%" borderRadius={4} />
            </div>
          </div>
        ) : (
          <>
            {/* Grattis-banner */}
            {weekDone && (
              <div
                style={{
                  background: levelInfo.isMaxLevel ? 'rgba(255,100,0,0.2)' : 'rgba(168,230,61,0.15)',
                  border: `1px solid ${levelInfo.isMaxLevel ? '#ff6a00' : COLORS.lime}`,
                  borderRadius: 12,
                  padding: '10px 14px',
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 2 }}>
                  {levelInfo.isMaxLevel ? '🔥' : '🎉'}
                </div>
                <div
                  style={{
                    color: levelInfo.isMaxLevel ? '#ff6a00' : COLORS.lime,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {levelInfo.isMaxLevel
                    ? 'Ni har nått Gudarnas nivå!'
                    : 'Grattis! Ni har klarat veckans utmaning!'}
                </div>
                <div style={{ color: COLORS.yellow, fontSize: 12, fontWeight: 800, marginTop: 4 }}>
                  {getCelebrationLine('brudar', weekly.id)}
                </div>
                {!levelInfo.isMaxLevel && (
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3 }}>
                    Fortsätt träna för att klättra till nästa nivå 💪
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            <ProgressBar
              value={levelInfo.progress}
              color={levelInfo.isMaxLevel ? '#ff6a00' : weekDone ? COLORS.lime : COLORS.yellow}
              height={14}
            />

            {/* Progress labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                marginBottom: 14,
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                {weekly.type === 'touch' ? `${weekValue} touch` : `${weekValue} min`}
              </span>
              <span
                style={{
                  color: levelInfo.isMaxLevel ? '#ff6a00' : weekDone ? COLORS.lime : COLORS.yellow,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {levelInfo.isMaxLevel
                  ? '🔥 Max uppnådd!'
                  : levelInfo.level === 0
                    ? `${weekly.goal - weekValue} kvar till Nivå 1`
                    : `${levelInfo.nextThreshold - weekValue} kvar till ${levelInfo.nextLevelName}`}
              </span>
            </div>
          </>
        )}

        {/* Level list */}
        {(() => {
          const visibleIndexes = showAllLevels
            ? WEEKLY_LEVEL_NAMES.map((_, i) => i)
            : WEEKLY_LEVEL_NAMES.map((_, i) => i).filter((i) => {
                const done = i + 1 <= levelInfo.level;
                const isCurrent = i + 1 === levelInfo.level + 1 && !levelInfo.isMaxLevel;
                // Show: last done level + current/next level only
                const isLastDone = i + 1 === levelInfo.level;
                return isLastDone || isCurrent || (levelInfo.isMaxLevel && i === 9);
              });
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {WEEKLY_LEVEL_NAMES.map((name, i) => {
                if (!visibleIndexes.includes(i)) return null;
                const threshold = levelInfo.thresholds[i];
                const done = i + 1 <= levelInfo.level;
                const isCurrent = i + 1 === levelInfo.level + 1 && !levelInfo.isMaxLevel;
                const isMax = i === 9;
                return (
                  <div
                    key={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 10px',
                      borderRadius: 10,
                      background: done
                        ? 'rgba(168,230,61,0.08)'
                        : isCurrent
                          ? 'rgba(255,255,255,0.06)'
                          : 'transparent',
                      border: done
                        ? `1px solid ${isMax ? '#ff6a00' : COLORS.lime}44`
                        : isCurrent
                          ? '1px solid rgba(255,255,255,0.12)'
                          : 'none',
                      opacity: done || isCurrent ? 1 : 0.4,
                    }}
                  >
                    <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>
                      {done ? (isMax ? '🔥' : '✅') : isCurrent ? '🎯' : '○'}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        color: done
                          ? isMax
                            ? '#ff6a00'
                            : COLORS.lime
                          : isCurrent
                            ? '#fff'
                            : 'rgba(255,255,255,0.5)',
                        fontSize: 13,
                        fontWeight: done || isCurrent ? 700 : 400,
                      }}
                    >
                      Nivå {i + 1} — {isMax ? '🔥 ' : ''}
                      {name}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                      {threshold} {weekly.type === 'touch' ? 'touch' : 'min'}
                    </span>
                  </div>
                );
              })}
              <button
                onClick={() => setShowAllLevels((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 12,
                  cursor: 'pointer',
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {showAllLevels ? '▲ Visa färre' : `▼ Visa alla 10 nivåer`}
              </button>
            </div>
          );
        })()}

        <div
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: 11,
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          Träna och logga — det räknas automatiskt!
        </div>
      </Card>

      {/* Buddy challenges */}
      <div ref={buddyRef} style={{ scrollMarginTop: 8 }} />
      <Card
        style={{
          marginBottom: 20,
          background: 'linear-gradient(180deg, rgba(0,20,64,0.88), rgba(0,20,64,0.72))',
          border: '1px solid rgba(240,220,0,0.18)',
        }}
      >
        <BuddySection
          user={user}
          allUsers={allUsers}
          buddyChallenges={buddyChallenges}
          handlers={{ handleCreateBuddyChallenge, handleRespondBuddyChallenge, handleCancelBuddyChallenge }}
        />
      </Card>
    </div>
  );
}
