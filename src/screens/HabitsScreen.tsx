import { useState } from 'react';
import { AppData, Habit } from '@/lib/types';
import { formatShortDate, todayKey, weekdayShort } from '@/lib/dates';
import { habitStatusFor, habitStreak, isHabitDue, uid } from '@/lib/storage';
import { Modal, ConfirmDialog, EmptyState } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { Check, Flame, Pencil, SkipForward, Trash2, Repeat } from 'lucide-react';

const EMOJIS = ['🏃', '📚', '💧', '🧘', '🎸', '🌱', '☀️', '✍️', '🧠', '🎯', '🍎', '😴'];

export function HabitsScreen({
  data,
  setData,
}: {
  data: AppData;
  setData: (fn: (d: AppData) => AppData) => void;
}) {
  const toast = useToast();
  const today = todayKey();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌱');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openEditor = (h?: Habit) => {
    setEditing(h ?? null);
    setName(h?.name ?? '');
    setEmoji(h?.emoji ?? '🌱');
    setDays(h?.days ?? [1, 2, 3, 4, 5]);
    setError('');
    setEditorOpen(true);
  };

  const submit = () => {
    if (!name.trim()) {
      setError('Please give your habit a name.');
      return;
    }
    if (days.length === 0) {
      setError('Pick at least one day of the week.');
      return;
    }
    const habit: Habit = {
      id: editing?.id ?? uid(),
      name: name.trim(),
      emoji,
      days: [...days].sort(),
      createdAt: editing?.createdAt ?? today,
    };
    setData((d) => ({
      ...d,
      habits: editing ? d.habits.map((h) => (h.id === habit.id ? habit : h)) : [...d.habits, habit],
    }));
    setEditorOpen(false);
    toast(editing ? 'Habit updated' : 'Habit created');
  };

  const setStatus = (habitId: string, date: string, status: 'done' | 'skipped' | null) => {
    setData((d) => {
      const rest = d.habitLog.filter((e) => !(e.habitId === habitId && e.date === date));
      if (status === null) return { ...d, habitLog: rest };
      return { ...d, habitLog: [...rest, { id: uid(), habitId, date, status }] };
    });
  };

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Habits</h1>
          <p className="mt-0.5 text-sm text-slate-500">Small steps, repeated often. Skipping never erases your history.</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="min-h-11 shrink-0 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          New habit
        </button>
      </div>

      {data.habits.length === 0 ? (
        <EmptyState
          icon={<Repeat className="h-6 w-6" />}
          title="No habits yet"
          hint="Create a habit like “Read 20 minutes” and choose the days it repeats."
        />
      ) : (
        <ul className="space-y-3">
          {data.habits.map((h) => {
            const status = habitStatusFor(h, today, data.habitLog);
            const streak = habitStreak(h, data.habitLog, today);
            const dueToday = isHabitDue(h, today);
            return (
              <li key={h.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl ring-1 ring-slate-100" aria-hidden>
                    {h.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{h.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {h.days.length === 7
                        ? 'Every day'
                        : h.days.map((d) => weekdayShort(d).slice(0, 2)).join(' · ')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => openEditor(h)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label={`Edit "${h.name}"`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(h.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete "${h.name}"`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
                    <Flame className="h-3.5 w-3.5" aria-hidden /> {streak} day streak
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(h.id, today, status === 'done' ? null : 'done')}
                      disabled={!dueToday && status !== 'done'}
                      aria-pressed={status === 'done'}
                      className={`flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                        status === 'done'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      {status === 'done' ? 'Done today' : dueToday ? 'Mark done' : 'Not scheduled'}
                    </button>
                    <button
                      onClick={() => setStatus(h.id, today, status === 'skipped' ? null : 'skipped')}
                      disabled={!dueToday && status !== 'skipped'}
                      aria-pressed={status === 'skipped'}
                      title="Skipping keeps your history intact"
                      className={`flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                        status === 'skipped'
                          ? 'bg-slate-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <SkipForward className="h-3.5 w-3.5" aria-hidden /> Skip
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex gap-1" aria-hidden>
                  {last14.map((d) => {
                    const s = habitStatusFor(h, d, data.habitLog);
                    return (
                      <div
                        key={d}
                        title={formatShortDate(d) + (s === 'done' ? ' — done' : s === 'skipped' ? ' — skipped' : '')}
                        className={`h-6 flex-1 rounded ${
                          s === 'done'
                            ? 'bg-emerald-500'
                            : s === 'skipped'
                              ? 'bg-slate-200'
                              : isHabitDue(h, d)
                                ? 'bg-slate-100'
                                : 'bg-slate-50'
                        }`}
                      />
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editing ? 'Edit habit' : 'New habit'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="habit-name" className="block text-sm font-medium text-slate-700">Habit name</label>
            <input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 20 minutes"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700">Icon</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  aria-pressed={e === emoji}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${
                    e === emoji ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-slate-700">Repeats on</span>
            <div className="mt-1.5 flex gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
                  aria-pressed={days.includes(d)}
                  className={`min-h-11 flex-1 rounded-xl text-xs font-semibold ${
                    days.includes(d)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {weekdayShort(d).slice(0, 2)}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setEditorOpen(false)} className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={submit} className="min-h-12 flex-1 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">
              {editing ? 'Save changes' : 'Create habit'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this habit?"
        message="Its history and streak will be removed too. This cannot be undone."
        onConfirm={() => {
          if (confirmDelete) {
            setData((d) => ({
              ...d,
              habits: d.habits.filter((h) => h.id !== confirmDelete),
              habitLog: d.habitLog.filter((e) => e.habitId !== confirmDelete),
            }));
            toast('Habit deleted');
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
