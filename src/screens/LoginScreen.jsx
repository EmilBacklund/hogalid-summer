import { useState, useEffect } from 'react';
import { COLORS, STARTER_OPTIONS, randomAvatarConfig } from '../constants';
import { apiGet, apiPost } from '../utils';
import { Card } from '../components/common';
import { AvatarSVG } from '../components/avatar';
import { AvatarBuilder } from '../components/avatar';
import { useUser } from '../context/UserContext';
import { ArrowRight } from 'lucide-react';

export function LoginScreen() {
  const { handleLogin } = useUser();
  const [mode, setMode] = useState('login');
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [avatarConfig, setAvatarConfig] = useState(() => randomAvatarConfig());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [validatedInvite, setValidatedInvite] = useState(null);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  function handleShuffle() {
    setAvatarConfig(randomAvatarConfig());
  }

  async function validateInvite({ token, code }) {
    if (!token && !code) return;
    setValidatingInvite(true);
    setError('');
    setInviteMessage('');
    try {
      const query = token
        ? `/users?action=invite&token=${encodeURIComponent(token)}`
        : `/users?action=invite&code=${encodeURIComponent((code || '').trim())}`;
      const invite = await apiGet(query);
      if (invite.status === 'used') {
        setValidatedInvite(null);
        setInviteMessage(invite.usedByAlias
          ? `Den här inbjudan är redan använd av ${invite.usedByAlias}.`
          : 'Den här inbjudan är redan använd.');
      } else if (invite.status === 'disabled') {
        setValidatedInvite(null);
        setInviteMessage('Den här inbjudan är inte aktiv längre. Be en ledare om en ny.');
      } else {
        setValidatedInvite(invite);
        setInviteCode(invite.code || '');
        setInviteMessage('Inbjudan är klar att använda.');
        setMode('register');
      }
    } catch (e) {
      setValidatedInvite(null);
      if (e.message.includes('invite_not_found')) {
        setInviteMessage('Den här länken eller koden funkar inte. Be en ledare om en ny.');
      } else {
        setInviteMessage('Kunde inte läsa in inbjudan just nu. Försök igen.');
      }
    }
    setValidatingInvite(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (!token) return;
    setMode('register');
    validateInvite({ token });
  }, []);

  async function handleSubmit() {
    if (!alias.trim() || !password.trim()) {
      setError('Fyll i alias och lösenord!');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const creds = { alias: alias.trim(), password };
      if (mode === 'register') {
        if (!validatedInvite) {
          setError('Du behöver en giltig länk eller kod för att skapa konto.');
          setBusy(false);
          return;
        }
        const user = await apiPost('/users?action=register', {
          ...creds,
          avatarConfig,
          inviteToken: validatedInvite.token,
        });
        handleLogin(user, creds);
      } else {
        const user = await apiPost('/users?action=login', creds);
        handleLogin(user, creds);
      }
    } catch (e) {
      if (e.message.includes('409') || e.message.includes('alias_taken')) {
        setError('Det aliset är taget, prova ett annat!');
      } else if (e.message.includes('invite_required')) {
        setError('Du behöver en giltig länk eller kod för att skapa konto.');
      } else if (e.message.includes('invite_used')) {
        setError('Den där inbjudan är redan använd.');
      } else if (e.message.includes('invite_disabled')) {
        setError('Den där inbjudan är inte aktiv längre.');
      } else if (e.message.includes('401') || e.message.includes('invalid_credentials')) {
        setError('Fel alias eller lösenord!');
      } else {
        setError('Något gick fel, försök igen!');
      }
    }
    setBusy(false);
  }

  const submitDisabled = busy || (mode === 'register' && !validatedInvite);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(160deg, ${COLORS.dark} 0%, #001e6e 60%, ${COLORS.red} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&family=Fredoka+One&display=swap');
        input { outline: none; }
        input:focus { box-shadow: 0 0 0 3px ${COLORS.lime}66 !important; }
      `}</style>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div
          className="flex flex-col items-center"
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <div className="w-12 h-12 shrink-0">
            <img src="/img/hogalid-logo.png" alt="Högalid IF" />
          </div>
          <div
            className="mt-4"
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 32,
              color: COLORS.lime,
              letterSpacing: 1,
            }}
          >
            Högalid F15
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            Sommarlovet 2026 — Träna. Väx. Ha kul!
          </div>
        </div>

        <Card>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError('');
                  if (m === 'login') setInviteMessage('');
                }}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  transition: 'all 0.2s',
                  background: mode === m ? COLORS.lime : 'rgba(255,255,255,0.1)',
                  color: mode === m ? COLORS.dark : 'rgba(255,255,255,0.7)',
                }}
              >
                {m === 'login' ? 'Logga in' : 'Ny spelare'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  marginBottom: 14,
                  borderRadius: 14,
                  background: validatedInvite ? 'rgba(168,230,61,0.12)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${validatedInvite ? COLORS.lime + '66' : 'rgba(255,255,255,0.12)'}`,
                  padding: '12px 14px',
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, marginBottom: 6, fontWeight: 700 }}>
                  Inbjudan krävs
                </div>
                {validatedInvite ? (
                  <>
                    <div style={{ color: COLORS.lime, fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                      ✅ Klar för {validatedInvite.label}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.52)', fontSize: 12 }}>
                      Kod: <span style={{ color: '#fff', fontWeight: 700 }}>{validatedInvite.code}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: inviteMessage ? 8 : 0 }}>
                      <input
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Skriv din kod, t.ex. F15-7KQ2"
                        style={{
                          flex: 1,
                          padding: '11px 12px',
                          borderRadius: 12,
                          border: '1.5px solid rgba(255,255,255,0.18)',
                          background: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          fontSize: 14,
                          fontFamily: "'Nunito', sans-serif",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && inviteCode.trim()) {
                            validateInvite({ code: inviteCode });
                          }
                        }}
                      />
                      <button
                        onClick={() => validateInvite({ code: inviteCode })}
                        disabled={!inviteCode.trim() || validatingInvite}
                        style={{
                          padding: '11px 14px',
                          borderRadius: 12,
                          border: 'none',
                          background: !inviteCode.trim() || validatingInvite ? 'rgba(255,255,255,0.1)' : COLORS.lime,
                          color: !inviteCode.trim() || validatingInvite ? 'rgba(255,255,255,0.35)' : COLORS.dark,
                          fontWeight: 800,
                          cursor: !inviteCode.trim() || validatingInvite ? 'not-allowed' : 'pointer',
                          fontFamily: "'Nunito', sans-serif",
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {validatingInvite ? 'Kollar...' : 'Lås upp'}
                      </button>
                    </div>
                    {inviteMessage && (
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.4 }}>
                        {inviteMessage}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
                Skapa din avatar
              </div>

              {/* Avatar preview + shuffle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 }}>
                <AvatarSVG avatarConfig={avatarConfig} size={72} />
                <button
                  onClick={handleShuffle}
                  style={{
                    padding: '8px 16px', borderRadius: 12, border: 'none',
                    background: 'rgba(255,255,255,0.1)', color: '#fff',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Nunito', sans-serif",
                  }}
                >
                  🎲 Slumpa
                </button>
              </div>

              {/* Avatar builder — starter options only */}
              <AvatarBuilder
                avatarConfig={avatarConfig}
                onChange={setAvatarConfig}
                starterOptions={STARTER_OPTIONS}
                compact
              />
            </div>
          )}

          {[
            {
              label: 'Alias (smeknamn)',
              val: alias,
              set: setAlias,
              type: 'text',
              ph: 't.ex. Fotbollstjej99',
            },
            {
              label: 'Lösenord',
              val: password,
              set: setPassword,
              type: 'password',
              ph: 'Välj ett lösenord',
            },
          ].map(({ label, val, set, type, ph }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  marginBottom: 5,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
              <input
                value={val}
                onChange={(e) => set(e.target.value)}
                type={type}
                placeholder={ph}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 15,
                  fontFamily: "'Nunito', sans-serif",
                }}
              />
            </div>
          ))}

          {error && (
            <div style={{ color: '#ff9f9f', fontSize: 13, marginBottom: 10, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: submitDisabled ? 'rgba(255,255,255,0.12)' : COLORS.lime,
              color: submitDisabled ? 'rgba(255,255,255,0.38)' : COLORS.dark,
              fontFamily: "'Fredoka One', cursive",
              fontSize: 18,
              cursor: submitDisabled ? 'not-allowed' : 'pointer',
              letterSpacing: 0.5,
              transition: 'all 0.2s',
              boxShadow: submitDisabled ? 'none' : `0 4px 20px ${COLORS.lime}55`,
            }}
          >
            {busy ? 'Laddar...' : mode === 'login' ? <>Spela! <ArrowRight size={18} /></> : <>Skapa konto <ArrowRight size={18} /></>}
          </button>

          {mode === 'register' && !validatedInvite && (
            <div style={{ textAlign: 'center', marginTop: 10, color: 'rgba(255,255,255,0.42)', fontSize: 12 }}>
              Lås upp registreringen med en länk eller kod från ledarna först.
            </div>
          )}

          {mode === 'login' && (
            <div
              style={{
                textAlign: 'center',
                marginTop: 12,
                color: 'rgba(255,255,255,0.4)',
                fontSize: 12,
              }}
            >
              Glömt lösenordet? Fråga tränaren!
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
