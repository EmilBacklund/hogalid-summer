'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EXERCISES } from '@/constants';
import { Card, ButtonLoader, TopBar, LoadingSpinner } from '@/components/common';
import { useUser } from '@/providers/UserProvider';
import { useLogMutations } from '@/hooks/useLogMutations';
import { cn } from '@/lib/cn';
import type { Log, User } from '@/types';

interface EditState {
  id: number;
  date: string;
  iceCream: number;
  swim: number;
  pages: number;
  exercises: { id: string; value: string }[];
}

export default function LogHistoryPage() {
  const { user, isLoading } = useUser();
  if (isLoading || !user) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <LoadingSpinner size="splash" text="Laddar..." />
      </main>
    );
  }
  return <LogHistoryContent user={user} />;
}

function LogHistoryContent({ user }: { user: User }) {
  const router = useRouter();
  const { editLog, deleteLog } = useLogMutations();
  const busy = editLog.isPending || deleteLog.isPending;

  const logs = (user.logs || [])
    .filter((l) => !l.bingo)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const [editing, setEditing] = useState<EditState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  function startEdit(log: Log) {
    setEditing({
      id: log.id,
      date: log.date,
      iceCream: log.iceCream || 0,
      swim: log.swim || 0,
      pages: log.pages || 0,
      exercises: EXERCISES.map((ex) => {
        const found = (log.exercises || []).find((e) => e.id === ex.id);
        return { id: ex.id, value: found ? String(found.value) : '' };
      }),
    });
  }

  function setVal(id: string, val: string) {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            exercises: prev.exercises.map((e) => (e.id === id ? { ...e, value: val } : e)),
          }
        : prev,
    );
  }

  async function saveEdit() {
    if (!editing || busy) return;
    const filled = editing.exercises.filter((e) => e.value !== '' && Number(e.value) > 0);
    await editLog.mutateAsync({
      logId: editing.id,
      log: {
        date: editing.date,
        exercises: filled.map((e) => ({ id: e.id, value: Number(e.value) })),
        // Preserve summer activities — the edit form doesn't expose them.
        iceCream: editing.iceCream,
        swim: editing.swim,
        pages: editing.pages,
      },
    });
    setEditing(null);
  }

  async function remove(logId: number) {
    if (busy) return;
    await deleteLog.mutateAsync(logId);
    setConfirmDelete(null);
  }

  if (editing) {
    return (
      <main className="mx-auto min-h-screen max-w-md">
        <TopBar />
        <div className="px-4 pt-5 pb-8">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="text-hogalid-yellow mb-4 flex items-center gap-1 text-[15px] font-bold"
          >
            <ArrowLeft size={16} /> Avbryt
          </button>
          <div className="font-display mb-1 text-2xl text-white">Redigera träning</div>
          <div className="mb-4 text-[13px] text-white/50">{editing.date}</div>

          <div className="mb-5 flex flex-col gap-2.5">
            {EXERCISES.map((ex) => {
              const val = editing.exercises.find((e) => e.id === ex.id);
              return (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3.5 py-2.5"
                  style={{ borderLeft: `3px solid ${ex.color}` }}
                >
                  <div className="flex-1 text-sm font-semibold text-white">{ex.label}</div>
                  <input
                    type="number"
                    min="0"
                    placeholder={`0 ${ex.unit}`}
                    value={val?.value || ''}
                    onChange={(e) => setVal(ex.id, e.target.value)}
                    className="w-20 rounded-lg border-[1.5px] border-white/20 bg-white/[0.08] px-2.5 py-[7px] text-right text-sm text-white outline-none"
                  />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void saveEdit()}
            disabled={busy}
            className={cn(
              'text-hogalid-dark font-display flex w-full items-center justify-center gap-1.5 rounded-[14px] py-3.5 text-[19px]',
              busy ? 'cursor-not-allowed bg-[rgba(240,220,0,0.5)] opacity-70' : 'bg-hogalid-yellow',
            )}
          >
            {busy ? (
              <>
                <ButtonLoader color="#001540" /> Sparar...
              </>
            ) : (
              '💾 Spara ändringar'
            )}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md">
      <TopBar />
      <div className="px-4 pt-5 pb-8">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-hogalid-yellow mb-4 flex items-center gap-1 text-[15px] font-bold"
        >
          <ArrowLeft size={16} /> Tillbaka
        </button>
        <div className="font-display mb-1 text-[26px] text-white">Mina träningar</div>
        <div className="mb-5 text-[13px] text-white/50">{logs.length} pass loggade</div>

        {logs.length === 0 && (
          <div className="p-10 text-center text-white/30">Inga träningar loggade än!</div>
        )}

        <div className="flex flex-col gap-2.5">
          {logs.map((log) => {
            const totalMins = (log.exercises || []).find((e) => e.id === 'fritraning')?.value || 0;
            const totalTouch = (log.exercises || []).reduce((s, e) => {
              const ex = EXERCISES.find((x) => x.id === e.id);
              return s + (ex && !ex.isTime && e.id !== 'skott' ? e.value || 0 : 0);
            }, 0);
            const skott = (log.exercises || []).find((e) => e.id === 'skott' && e.value > 0);
            const isConfirming = confirmDelete === log.id;
            return (
              <Card key={log.id} className="px-4 py-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[15px] font-bold text-white">📅 {log.date}</div>
                  <div className="text-hogalid-yellow text-[13px] font-bold">
                    +{log.points || 0} p
                  </div>
                </div>
                <div className="mb-2.5 text-[13px] text-white/50">
                  {totalMins > 0 && <span>⏱ {totalMins} min&nbsp;&nbsp;</span>}
                  {totalTouch > 0 && <span>🦶 {totalTouch} touch&nbsp;&nbsp;</span>}
                  {skott && <span>🥅 {skott.value} skott</span>}
                </div>
                {isConfirming ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void remove(log.id)}
                      disabled={busy}
                      className="bg-hogalid-red flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-sm font-bold text-white disabled:opacity-70"
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
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      disabled={busy}
                      className="flex-1 rounded-[10px] border border-white/20 py-2.5 text-sm text-white/60"
                    >
                      Avbryt
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(log)}
                      className="flex-1 rounded-[10px] bg-white/10 py-2.5 text-sm font-bold text-white"
                    >
                      ✏️ Redigera
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(log.id)}
                      aria-label="Ta bort"
                      className="text-hogalid-red rounded-[10px] border border-[rgba(220,40,40,0.4)] px-3.5 py-2.5 text-sm"
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
    </main>
  );
}
