import { useState, useEffect } from 'react';
import { COLORS, STARTER_OPTIONS, randomAvatarConfig } from '../constants';
import { apiPost } from '../utils';
import { Card } from '../components/common';
import { AvatarSVG } from '../components/avatar';
import { AvatarBuilder } from '../components/avatar';
import { useUser } from '../context/UserContext';

export function LoginScreen() {
  const { handleLogin } = useUser();
  const [mode, setMode] = useState('login');
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [avatarConfig, setAvatarConfig] = useState(() => randomAvatarConfig());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleShuffle() {
    setAvatarConfig(randomAvatarConfig());
  }

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
        const user = await apiPost('/users?action=register', {
          ...creds,
          avatarConfig,
        });
        handleLogin(user, creds);
      } else {
        const user = await apiPost('/users?action=login', creds);
        handleLogin(user, creds);
      }
    } catch (e) {
      if (e.message.includes('409') || e.message.includes('alias_taken')) {
        setError('Det aliset är taget, prova ett annat!');
      } else if (e.message.includes('401') || e.message.includes('invalid_credentials')) {
        setError('Fel alias eller lösenord!');
      } else {
        setError('Något gick fel, försök igen!');
      }
    }
    setBusy(false);
  }

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
            disabled={busy}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              border: 'none',
              background: busy ? 'rgba(240,220,0,0.5)' : COLORS.lime,
              color: COLORS.dark,
              fontFamily: "'Fredoka One', cursive",
              fontSize: 18,
              cursor: busy ? 'not-allowed' : 'pointer',
              letterSpacing: 0.5,
              transition: 'all 0.2s',
              boxShadow: `0 4px 20px ${COLORS.lime}55`,
            }}
          >
            {busy ? 'Laddar...' : mode === 'login' ? 'Spela! →' : 'Skapa konto →'}
          </button>

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
