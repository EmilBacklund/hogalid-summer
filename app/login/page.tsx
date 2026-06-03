'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { STARTER_OPTIONS, randomAvatarConfig } from '@/constants';
import { apiGet, apiPost } from '@/utils/api';
import { enterDemo, exitDemo } from '@/demo/demoMode';
import { Card } from '@/components/common';
import { AvatarSVG, AvatarBuilder } from '@/components/avatar';
import { cn } from '@/lib/cn';
import type { AvatarConfig } from '@/types';

interface Invite {
  status: string;
  label: string;
  code: string;
  token: string;
  usedByAlias: string;
}

const formSchema = z.object({
  alias: z.string().trim().min(1, 'Fyll i alias'),
  password: z.string().min(1, 'Fyll i lösenord'),
});
type FormValues = z.infer<typeof formSchema>;

const INPUT =
  'w-full rounded-xl border-[1.5px] border-white/20 bg-white/[0.08] px-3.5 py-3 text-[15px] text-white outline-none focus:ring-2 focus:ring-hogalid-yellow/40';

function errorMessage(raw: string): string {
  if (raw.includes('alias_taken') || raw.includes('409'))
    return 'Det aliaset är taget, prova ett annat!';
  if (raw.includes('invite_required'))
    return 'Du behöver en giltig länk eller kod för att skapa konto.';
  if (raw.includes('invite_used')) return 'Den där inbjudan är redan använd.';
  if (raw.includes('invite_disabled')) return 'Den där inbjudan är inte aktiv längre.';
  if (raw.includes('invalid_credentials') || raw.includes('401'))
    return 'Fel alias eller lösenord!';
  if (raw.includes('rate_limited') || raw.includes('429'))
    return 'För många försök — vänta en stund.';
  return 'Något gick fel, försök igen!';
}

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => randomAvatarConfig());
  const [inviteCode, setInviteCode] = useState('');
  const [validatedInvite, setValidatedInvite] = useState<Invite | null>(null);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  async function validateInvite({ token, code }: { token?: string; code?: string }) {
    if (!token && !code) return;
    setValidatingInvite(true);
    setError('');
    setInviteMessage('');
    try {
      const query = token
        ? `/invites/validate?token=${encodeURIComponent(token)}`
        : `/invites/validate?code=${encodeURIComponent((code ?? '').trim())}`;
      const invite = await apiGet<Invite>(query);
      if (invite.status === 'used') {
        setValidatedInvite(null);
        setInviteMessage(
          invite.usedByAlias
            ? `Den här inbjudan är redan använd av ${invite.usedByAlias}.`
            : 'Den här inbjudan är redan använd.',
        );
      } else if (invite.status === 'disabled') {
        setValidatedInvite(null);
        setInviteMessage('Den här inbjudan är inte aktiv längre. Be en ledare om en ny.');
      } else {
        setValidatedInvite(invite);
        setInviteCode(invite.code ?? '');
        setInviteMessage('Inbjudan är klar att använda.');
        setMode('register');
      }
    } catch (e) {
      setValidatedInvite(null);
      const msg = e instanceof Error ? e.message : '';
      setInviteMessage(
        msg.includes('invite_not_found')
          ? 'Den här länken eller koden funkar inte. Be en ledare om en ny.'
          : 'Kunde inte läsa in inbjudan just nu. Försök igen.',
      );
    }
    setValidatingInvite(false);
  }

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('invite');
    if (!token) return;
    setMode('register');
    void validateInvite({ token });
  }, []);

  async function startDemo() {
    setError('');
    // Drop any prior real-session cache before entering the demo fixture.
    queryClient.clear();
    enterDemo();
    await queryClient.invalidateQueries({ queryKey: ['me'] });
    router.push('/');
    router.refresh();
  }

  async function onSubmit(values: FormValues) {
    setError('');
    // Leaving demo before any real auth guarantees the demo flag + in-memory
    // user can never coexist with a real session on this tab. Clearing the
    // query cache drops any demo data still held by React Query.
    exitDemo();
    queryClient.clear();
    try {
      if (mode === 'register') {
        if (!validatedInvite) {
          setError('Du behöver en giltig länk eller kod för att skapa konto.');
          return;
        }
        await apiPost('/auth/register', {
          alias: values.alias,
          password: values.password,
          avatarConfig,
          inviteToken: validatedInvite.token,
        });
      } else {
        await apiPost('/auth/login', { alias: values.alias, password: values.password });
      }
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/');
      router.refresh();
    } catch (e) {
      setError(errorMessage(e instanceof Error ? e.message : ''));
    }
  }

  const submitDisabled = isSubmitting || (mode === 'register' && !validatedInvite);

  return (
    <div className="from-hogalid-dark to-hogalid-red flex min-h-screen items-center justify-center bg-gradient-to-b via-[#001e6e] p-5">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/hogalid-logo.png" alt="Högalid IF" className="h-12 w-12 shrink-0" />
          <div className="text-hogalid-yellow font-display mt-4 text-[32px] tracking-wide">
            Högalid F15
          </div>
          <div className="mt-1 text-sm text-white/60">Sommarlovet 2026 — Träna. Väx. Ha kul!</div>
        </div>

        <Card>
          <div className="mb-5 flex gap-2">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError('');
                  if (m === 'login') setInviteMessage('');
                }}
                className={cn(
                  'flex-1 rounded-xl py-2.5 text-[15px] font-bold transition-all',
                  mode === m ? 'bg-hogalid-yellow text-hogalid-dark' : 'bg-white/10 text-white/70',
                )}
              >
                {m === 'login' ? 'Logga in' : 'Ny spelare'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <div className="mb-4">
              <div
                className={cn(
                  'mb-3.5 rounded-[14px] border p-3.5',
                  validatedInvite
                    ? 'border-hogalid-yellow/40 bg-[rgba(168,230,61,0.12)]'
                    : 'border-white/12 bg-white/[0.06]',
                )}
              >
                <div className="mb-1.5 text-[13px] font-bold text-white/70">Inbjudan krävs</div>
                {validatedInvite ? (
                  <>
                    <div className="text-hogalid-yellow mb-1 text-sm font-extrabold">
                      ✅ Klar för {validatedInvite.label}
                    </div>
                    <div className="text-xs text-white/50">
                      Kod: <span className="font-bold text-white">{validatedInvite.code}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Skriv din kod, t.ex. F15-7KQ2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && inviteCode.trim())
                            void validateInvite({ code: inviteCode });
                        }}
                        className={cn(INPUT, 'flex-1')}
                      />
                      <button
                        type="button"
                        onClick={() => void validateInvite({ code: inviteCode })}
                        disabled={!inviteCode.trim() || validatingInvite}
                        className="bg-hogalid-yellow text-hogalid-dark rounded-xl px-3.5 py-3 font-extrabold whitespace-nowrap disabled:bg-white/10 disabled:text-white/35"
                      >
                        {validatingInvite ? 'Kollar...' : 'Lås upp'}
                      </button>
                    </div>
                    {inviteMessage && (
                      <div className="mt-2 text-xs leading-snug text-white/65">{inviteMessage}</div>
                    )}
                  </>
                )}
              </div>

              <div className="mb-2.5 text-[13px] font-semibold text-white/70">Skapa din avatar</div>
              <div className="mb-3.5 flex items-center justify-center gap-4">
                <AvatarSVG avatarConfig={avatarConfig} size={72} />
                <button
                  type="button"
                  onClick={() => setAvatarConfig(randomAvatarConfig())}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white"
                >
                  🎲 Slumpa
                </button>
              </div>
              <AvatarBuilder
                avatarConfig={avatarConfig}
                onChange={setAvatarConfig}
                starterOptions={STARTER_OPTIONS}
                compact
              />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="mb-3.5 block">
              <span className="mb-1.5 block text-[13px] font-semibold text-white/70">
                Alias (smeknamn)
              </span>
              <input {...register('alias')} placeholder="t.ex. Fotbollstjej99" className={INPUT} />
            </label>
            <label className="mb-3.5 block">
              <span className="mb-1.5 block text-[13px] font-semibold text-white/70">Lösenord</span>
              <input
                {...register('password')}
                type="password"
                placeholder="Välj ett lösenord"
                className={INPUT}
              />
            </label>

            {error && (
              <div className="mb-2.5 text-[13px] font-semibold text-[#ff9f9f]">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className={cn(
                'font-display flex w-full items-center justify-center gap-1 rounded-[14px] py-3.5 text-lg tracking-[0.5px] transition-all',
                submitDisabled
                  ? 'cursor-not-allowed bg-white/[0.12] text-white/40'
                  : 'bg-hogalid-yellow text-hogalid-dark shadow-[0_4px_20px_#f0dc0055]',
              )}
            >
              {isSubmitting ? (
                'Laddar...'
              ) : mode === 'login' ? (
                <>
                  Spela! <ArrowRight size={18} />
                </>
              ) : (
                <>
                  Skapa konto <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {mode === 'register' && !validatedInvite && (
            <div className="mt-2.5 text-center text-xs text-white/40">
              Lås upp registreringen med en länk eller kod från ledarna först.
            </div>
          )}
          {mode === 'login' && (
            <div className="mt-3 text-center text-xs text-white/40">
              Glömt lösenordet? Fråga tränaren!
            </div>
          )}

          <div className="mt-5 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => void startDemo()}
              className="w-full rounded-[14px] bg-white/10 py-3 text-sm font-bold text-white/90 transition-all hover:bg-white/15"
            >
              🎮 Prova appen som förälder
            </button>
            <div className="mt-2 text-center text-xs text-white/40">
              Utforska appen utan konto — inget sparas.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
