import { useState } from 'react';
import { AppData, Task } from '@/lib/types';
import { currentWeekDays, formatShortDate, formatMinutes, todayKey, weekdayShort, addDays, toKey } from '@/lib/dates';
import { habitStatusFor, isHabitDue, weekStats } from '@/lib/storage';
import { TaskEditor } from '@/components/TaskEditor';
import { useToast } from '@/components/Toast';
import { CalendarCheck, CheckCircle2, Clock, Flame, Plus } from 'lucide-react';

export function WeekScreen({
  data,
  setData,
}: {
  data: AppData;
  setData: (fn: (d: AppData) => AppData) => void;
}) {
  const toast = useToast();
  const days = currentWeekDays();
  const today = todayKey();
  const [expanded, setExpanded] = useState<string>(today);
  const [editorDate, setEditorDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);

  const pastDays = days.filter((d) => d <= today);
  const stats = weekStats(data, pastDays);

  const taskPct = stats.tasksTotal > 0 ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0;
  const habitPct = stats.habitSlots > 0 ? Math.round((stats.habitDone / stats.habitSlots) * 100) : 0;
  const totalMin = [...stats.byCategory.values()].reduce((a, b) => a + b, 0);

  const perDay = days.map((d) => {
    const tasks = data.tasks.filter((t) => t.date === d);
    const done = tasks.filter((t) => t.completed).length;
    const mins = data.timeEntries.filter((e) => e.date === d).reduce((s, e) => s + e.minutes, 0);
    return { d, tasks, done, mins };
  });

  const maxMins = Math.max(60, ...perDay.map((p) => p.mins));

  const saveTask = (t: Omit<Task, 'completed'> & { id?: string }) => {
    const exists = t.id && data.tasks.some((x) => x.id === t.id);
    setData((d) => {
      if (exists) {
        return { ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, ...t, id: t.id!, completed: x.completed } : x)) };
      }
      return { ...d, tasks: [...d.tasks, { ...t, id: t.id ?? uid(), completed: false } as Task] };
    });
    setEditorDate(null);
    setEditing(null);
    toast(exists ? 'Task updated' : 'Task added');
  };

  const toggleTask = (id: string) => {
    setData((d) => ({
      ...d,
      tasks: d.tasks.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)),
    }));
  };

  const deleteTask = (id: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }));
    toast('Task deleted');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Your week</h1>
        <p className="mt-0.5 text-sm text-slate-500">Plan any day of the week and see everything at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Tasks done
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{stats.tasksCompleted}<span className="text-base font-medium text-slate-400"> / {stats.tasksTotal}</span></p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${taskPct}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Flame className="h-3.5 w-3.5" aria-hidden /> Habit consistency
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{stats.habitDone}<span className="text-base font-medium text-slate-400"> / {stats.habitSlots}</span></p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${habitPct}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Clock className="h-3.5 w-3.5" aria-hidden /> Time tracked
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{formatMinutes(totalMin)}</p>
        </div>
      </div>

      {/* Per-day planner */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarCheck className="h-4 w-4 text-emerald-600" aria-hidden /> Plan each day
        </h2>
        {perDay.map(({ d, tasks, done: doneCount, mins }) => {
          const isExpanded = expanded === d;
          const isToday = d === today;
          const dueHabits = data.habits.filter((h) => isHabitDue(h, d));
          const doneHabits = dueHabits.filter((h) => habitStatusFor(h, d, data.habitLog) === 'done').length;
          return (
            <div
              key={d}
              className={`overflow-hidden rounded-2xl border bg-white ${
                isToday ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'
              }`}
            >
              <button
                onClick={() => setExpanded(isExpanded ? '' : d)}
                aria-expanded={isExpanded}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <span className={`flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-bold ${
                  isToday ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-100'
                }`}>
                  {weekdayShort(new Date(d + 'T00:00:00').getDay()).slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isToday ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {formatShortDate(d)}{isToday ? ' · Today' : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {doneCount}/{tasks.length} tasks · {dueHabits.length > 0 ? `${doneHabits}/${dueHabits.length} habits · ` : ''}{formatMinutes(mins)}
                  </p>
                </div>
                <Plus
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(null);
                    setEditorDate(d);
                    setExpanded(d);
                  }}
                  className="h-5 w-5 shrink-0 rounded-full p-0.5 text-emerald-600 hover:bg-emerald-50"
                  aria-label={`Add task on ${formatShortDate(d)}`}
                />
              </button>
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3">
                  {tasks.length === 0 ? (
                    <p className="mb-2 text-sm text-slate-400">Nothing planned yet.</p>
                  ) : (
                    <ul className="mb-2 space-y-1.5">
                      {tasks.map((t) => (
                        <li key={t.id} className="flex items-center gap-2.5">
                          <button
                            onClick={() => toggleTask(t.id)}
                            aria-label={t.completed ? `Reopen "${t.title}"` : `Mark "${t.title}" as done`}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                              t.completed
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 text-transparent hover:border-emerald-500'
                            }`}
                          >
                            <CheckCircle2 className={`h-3.5 w-3.5 ${t.completed ? '' : 'opacity-0'}`} />
                          </button>
                          <span className={`min-w-0 flex-1 truncate text-sm ${t.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {t.title}
                            <span className="ml-1.5 text-xs text-slate-400">{t.category}{t.time ? ` · ${t.time}` : ''}</span>
                          </span>
                          <button
                            onClick={() => {
                              setEditing(t);
                              setEditorDate(d);
                            }}
                            className="min-h-9 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTask(t.id)}
                            className="min-h-9 rounded-lg px-2 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={() => {
                      setEditing(null);
                      setEditorDate(d);
                    }}
                    className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 text-xs font-semibold text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden /> Add task on {formatShortDate(d)}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Time by category */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Time by activity this week</h2>
        {stats.byCategory.size === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No time tracked yet this week.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {[...stats.byCategory.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([cat, mins]) => {
                const p = totalMin > 0 ? Math.round((mins / totalMin) * 100) : 0;
                return (
                  <li key={cat} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 truncate text-sm font-medium text-slate-700">{cat}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${p}%` }} />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-500">
                      {formatMinutes(mins)} · {p}%
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {editorDate !== null && (
        <TaskEditor
          open
          onClose={() => {
            setEditorDate(null);
            setEditing(null);
          }}
          onSave={saveTask}
          initial={editing}
          date={editorDate}
        />
      )}
    </div>
  );
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
