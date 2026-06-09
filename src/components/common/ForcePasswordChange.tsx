'use client';

import { useState } from 'react';
import { useUser } from '@/providers/UserProvider';
import { apiPost } from '@/utils/api';

/**
 * A blocking modal shown to a leader on first login, when their account still
 * carries the admin-issued temporary password (`mustChangePassword`). They pick
 * their own password before they can use the app.
 *
 * Never shows in demo (the demo user is a player and the backend is unreachable
 * there anyway) nor for the admin (env-managed password, no DB row).
 */
export function ForcePasswordChange() {
  const { user, isDemo, refresh } = useUser();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (isDemo || !user?.mustChangePassword) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 4) {
      setError('Lösenordet måste vara minst 4 tecken.');
      return;
    }
    if (password !== confirm) {
      setError('Lösenorden matchar inte.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiPost('/auth/password', { newPassword: password });
      await refresh();
    } catch {
      setError('Något gick fel. Försök igen.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-hogalid-dark text-lg font-extrabold">Välj ditt lösenord</h2>
        <p className="text-hogalid-dark/70 mt-1 text-sm">
          Välkommen! Innan du börjar behöver du välja ett eget lösenord.
        </p>

        <label className="text-hogalid-dark/80 mt-4 block text-xs font-bold" htmlFor="fpc-new">
          Nytt lösenord
        </label>
        <input
          id="fpc-new"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-hogalid-dark mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />

        <label className="text-hogalid-dark/80 mt-3 block text-xs font-bold" htmlFor="fpc-confirm">
          Bekräfta lösenord
        </label>
        <input
          id="fpc-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="text-hogalid-dark mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />

        {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-hogalid-dark mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? 'Sparar…' : 'Spara lösenord'}
        </button>
      </form>
    </div>
  );
}
