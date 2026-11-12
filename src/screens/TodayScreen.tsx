import { useMemo, useState } from 'react';
import { AppData, Category, CATEGORY_STYLES, Task } from '@/lib/types';
import { formatDayLabel, formatMinutes, toKey, todayKey } from '@/lib/dates';
import { habitStatusFor, habitStreak, isHabitDue, minutesForDate, uid } from '@/lib/storage';
import { getQuoteForDate } from '@/lib/quotes';
import { TaskEditor } from '@/components/TaskEditor';
import { ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/Toast';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Quote as QuoteIcon,
  SkipForward,
  Sparkles,
} from 'lucide-react';

type SortKey = 'time' | 'category' | 'status';

export function TodayScreen({
  data,
  setData,
  date,
  setDate,
}: {
  data: AppData;
  setData: (fn: (d: AppData) => AppData) => void;
  date: string;
  setDate: (d: string) => void;
}) {
  const toast = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [filterCat, setFilterCat] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortKey>('time');
  const [hideDone, setHideDone] = useState(false);
  const [moveTask, setMoveTask] = useState<Task | null>(null);
  const [lastAction, setLastAction] = useState<
    | { kind: 'complete'; task: Task }
    | { kind: 'uncomplete'; task: Task }
    | { kind: 'delete'; task: Task; index: number }
    | null
  >(null);

  const quote = getQuoteForDate(date);
  const allTasks = data.tasks.filter((t) => t.date === date);
  const tasks = useMemo(() => {
    let list = allTasks;
    if (filterCat !== 'All') list = list.filter((t) => t.category === filterCat);
    if (hideDone) list = list.filter((t) => !t.completed);
    const sorted = [...list];
    if (sortBy === 'time') {
      sorted.sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
    } else if (sortBy === 'category') {
      sorted.sort((a, b) => a.category.localeCompare(b.category));
    } else {
      sorted.sort((a, b) => Number(a.completed) - Number(b.completed));
    }
    return sorted;
  }, [allTasks, filterCat, sortBy, hideDone]);

  const openTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);
  const isToday = date === todayKey();
  const isPast = date < todayKey();
  // Overdue: not done and dated before today.
  const overdueTasks = isToday ? data.tasks.filter((t) => !t.completed && t.date < todayKey()) : [];
  const overdueAll = overdueTasks;

  const dueHabits = data.habits.filter((h) => isHabitDue(h, date));
  const doneHabits = dueHabits.filter((h) => habitStatusFor(h, date, data.habitLog) === 'done');

  const total = allTasks.length;
  const done = allTasks.filter((t) => t.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const encouragement = useMemo(() => {
    if (total === 0) return isToday ? 'A fresh day — add a task when you are ready.' : 'Nothing planned for this day yet.';
    if (pct === 100) return 'Everything done. Nicely planned and finished!';
    if (done === 0) return 'A gentle start is still a start. Pick one small task.';
    return 'Good progress — keep it at your own pace.';
  }, [total, done, pct, isToday]);

  const restoreAutoTime = (t: Task) => {
    if (t.durationMin && t.durationMin > 0) {
      setData((d) => ({
        ...d,
        timeEntries: [...d.timeEntries, { id: uid(), date: t.date, category: t.category, minutes: t.durationMin! }],
      }));
    }
  };

  const removeAutoTime = (t: Task) => {
    if (t.durationMin && t.durationMin > 0) {
      setData((d) => {
        const idx = d.timeEntries.findIndex(
          (e) => e.date === t.date && e.category === t.category && e.minutes === t.durationMin,
        );
        if (idx === -1) return d;
        const entries = [...d.timeEntries];
        entries.splice(idx, 1);
        return { ...d, timeEntries: entries };
      });
    }
  };

  const saveTask = (t: Omit<Task, 'completed'> & { id?: string }) => {
    const exists = t.id && data.tasks.some((x) => x.id === t.id);
    setData((d) => {
      if (exists) {
        return {
          ...d,
          tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, ...t, id: t.id!, completed: x.completed } : x)),
        };
      }
      return { ...d, tasks: [...d.tasks, { ...t, id: t.id ?? uid(), completed: false } as Task] };
    });
    setEditorOpen(false);
    setEditing(null);
    toast(exists ? 'Task updated' : 'Task added');
  };

  const toggleTask = (id: string) => {
    const t = data.tasks.find((x) => x.id === id);
    if (!t) return;
    if (!t.completed) {
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((x) => (x.id === id ? { ...x, completed: true } : x)),
      }));
      restoreAutoTime(t);
      setLastAction({ kind: 'complete', task: t });
    } else {
      setData((d) => ({
        ...d,
        tasks: d.tasks.map((x) => (x.id === id ? { ...x, completed: false } : x)),
      }));
      removeAutoTime(t);
      setLastAction({ kind: 'uncomplete', task: t });
    }
  };

  const deleteTask = (t: Task) => {
    const index = data.tasks.findIndex((x) => x.id === t.id);
    setData((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== t.id) }));
    setLastAction({ kind: 'delete', task: t, index });
  };

  const undoLast = () => {
    if (!lastAction) return;
    const a = lastAction;
    setData((d) => {
      if (a.kind === 'complete') {
        const tasks = d.tasks.map((x) => (x.id === a.task.id ? { ...x, completed: false } : x));
        const timeEntries = [...d.timeEntries];
        if (a.task.durationMin) {
          const idx = timeEntries.findIndex(
            (e) => e.date === a.task.date && e.category === a.task.category && e.minutes === a.task.durationMin,
          );
          if (idx !== -1) timeEntries.splice(idx, 1);
        }
        return { ...d, tasks, timeEntries };
      }
      if (a.kind === 'uncomplete') {
        const tasks = d.tasks.map((x) => (x.id === a.task.id ? { ...x, completed: true } : x));
        const timeEntries = [...d.timeEntries];
        if (a.task.durationMin) {
          timeEntries.push({ id: uid(), date: a.task.date, category: a.task.category, minutes: a.task.durationMin });
        }
        return { ...d, tasks, timeEntries };
      }
      // delete
      const tasks = [...d.tasks];
      tasks.splice(Math.min(a.index, tasks.length), 0, a.task);
      return { ...d, tasks };
    });
    setLastAction(null);
    toast('Restored');
  };

  const setHabitStatus = (habitId: string, status: 'done' | 'skipped' | null) => {
    setData((d) => {
      const rest = d.habitLog.filter((e) => !(e.habitId === habitId && e.date === date));
      if (status === null) return { ...d, habitLog: rest };
      return { ...d, habitLog: [...rest, { id: uid(), habitId, date, status }] };
    });
  };

  const shiftDay = (n: number) => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + n);
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const categoriesToday = useMemo(() => {
    const map = new Map<Category, number>();
    allTasks.forEach((t) => {
      if (t.durationMin) map.set(t.category, (map.get(t.category) ?? 0) + t.durationMin);
    });
    data.goals.forEach((g) => {
      if (!map.has(g.category)) map.set(g.category, 0);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [allTasks, data.goals]);

  const renderList = (list: Task[], title?: string) => {
    if (list.length === 0 && title === undefined) {
      return (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {filterCat !== 'All' || hideDone ? 'Nothing matches these filters.' : 'No tasks for this part of the day.'}
        </p>
      );
    }
    return (
      <div>
        {title && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>}
        <ul className="space-y-2">
          {list.map((t) => (
            <li
              key={t.id}
              className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors sm:px-4 ${
                t.completed
                  ? 'border-emerald-100 bg-emerald-50/60'
                  : isPast
                    ? 'border-amber-200 bg-amber-50/70'
                    : 'border-slate-200 bg-white hover:border-emerald-200'
              }`}
            >
              <button
                onClick={() => toggleTask(t.id)}
                aria-label={t.completed ? `Mark "${t.title}" as not done` : `Mark "${t.title}" as done`}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  t.completed
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300 bg-white text-transparent hover:border-emerald-500'
                }`}
              >
                <CheckCircle2 className={`h-4 w-4 ${t.completed ? '' : 'opacity-0'}`} />
              </button>

              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium sm:text-base ${t.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {t.title}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-100">
                    <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_STYLES[t.category].dot}`} aria-hidden />
                    {t.category}
                  </span>
                  {t.time && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" aria-hidden /> {t.time}
                    </span>
                  )}
                  {t.durationMin ? <span>· {t.durationMin} min</span> : null}
                  {!isToday && (
                    <span className={`font-medium ${isPast ? 'text-amber-700' : 'text-sky-700'}`}>
                      {isPast ? 'Past day' : 'Upcoming'}
                    </span>
                  )}
                  {t.completed && (
                    <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" strokeWidth={3} aria-hidden /> Done
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => setMoveTask(t)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-sky-50 hover:text-sky-600"
                  aria-label={`Move "${t.title}" to another date`}
                  title="Move to another date"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setEditing(t);
                    setEditorOpen(true);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label={`Edit "${t.title}"`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteTask(t)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete "${t.title}"`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M3 6h18M8 6V4h8v2m1 0v14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V6" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const undoBar = lastAction ? (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-6">
      <div className="flex items-center gap-3 rounded-full bg-slate-900 py-2.5 pl-4 pr-2.5 text-sm text-white shadow-lg">
        <span>
          {lastAction.kind === 'complete' && 'Task marked done'}
          {lastAction.kind === 'uncomplete' && 'Task reopened'}
          {lastAction.kind === 'delete' && 'Task deleted'}
        </span>
        <button
          onClick={undoLast}
          className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25"
        >
          Undo
        </button>
        <button
          onClick={() => setLastAction(null)}
          className="rounded-full p-1.5 text-white/60 hover:text-white"
          aria-label="Dismiss"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      {/* Header + date nav */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftDay(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-24 text-center">
            <p className="text-sm font-semibold text-slate-900">{formatDayLabel(date)}</p>
            {date !== todayKey() && (
              <button onClick={() => setDate(todayKey())} className="text-xs font-medium text-emerald-600 hover:underline">
                Back to today
              </button>
            )}
          </div>
          <button
            onClick={() => shiftDay(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          Add task
        </button>
      </div>

      {/* Quote card */}
      <section className="flex items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3.5">
        <QuoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
        <div>
          <p className="text-sm font-medium leading-relaxed text-teal-900">“{quote.text}”</p>
          <p className="mt-1 text-xs text-teal-700">{quote.author ?? 'Daily quotes'}</p>
        </div>
      </section>

      {/* Progress card */}
      <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24" role="img" aria-label={`${pct} percent of tasks done`}>
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{pct}%</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold sm:text-xl">
              {total === 0 ? 'Your day, planned calmly' : `${done} of ${total} tasks done`}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-50">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden /> {encouragement}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {doneHabits.length}/{dueHabits.length} habits
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
            {formatMinutes(minutesForDate(data.timeEntries, date))} tracked
          </span>
          {openTasks.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              {openTasks.length} to go
            </span>
          )}
        </div>
      </section>

      {/* Overdue banner */}
      {overdueAll.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <CalendarClock className="h-4 w-4" aria-hidden />
            {overdueAll.length} earlier task{overdueAll.length > 1 ? 's' : ''} still open
          </p>
          <p className="mt-1 text-xs text-amber-800">
            No rush — move them to today or another day whenever it suits you. They are listed below.
          </p>
        </section>
      )}

      {/* Habits strip */}
      {dueHabits.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Habits today</h2>
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
            {dueHabits.map((h) => {
              const status = habitStatusFor(h, date, data.habitLog);
              const streak = habitStreak(h, data.habitLog, todayKey());
              return (
                <div
                  key={h.id}
                  className={`w-36 shrink-0 snap-start rounded-2xl border p-3.5 text-center transition-colors ${
                    status === 'done'
                      ? 'border-emerald-300 bg-emerald-50'
                      : status === 'skipped'
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-2xl" aria-hidden>{h.emoji}</div>
                  <p className={`mt-1 truncate text-sm font-medium ${status === 'done' ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {h.name}
                  </p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-500">
                    <Flame className="h-3 w-3 text-orange-400" aria-hidden /> {streak} day streak
                  </p>
                  <div className="mt-2.5 flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setHabitStatus(h.id, status === 'done' ? null : 'done')}
                      aria-pressed={status === 'done'}
                      aria-label={status === 'done' ? `Undo "${h.name}"` : `Mark "${h.name}" as done`}
                      className={`flex min-h-9 flex-1 items-center justify-center gap-1 rounded-lg text-xs font-semibold ${
                        status === 'done'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Done
                    </button>
                    <button
                      onClick={() => setHabitStatus(h.id, status === 'skipped' ? null : 'skipped')}
                      aria-pressed={status === 'skipped'}
                      aria-label={status === 'skipped' ? `Undo skip for "${h.name}"` : `Skip "${h.name}" today`}
                      title="Skip keeps your history, without counting it against you"
                      className={`flex min-h-9 min-w-9 items-center justify-center rounded-lg ${
                        status === 'skipped'
                          ? 'bg-slate-500 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <SkipForward className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tasks with filter / sort */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Tasks</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-cat" className="sr-only">Filter by category</label>
            <select
              id="filter-cat"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value as Category | 'All')}
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none"
            >
              <option value="All">All categories</option>
              {(Object.keys(CATEGORY_STYLES) as Category[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label htmlFor="sort-key" className="sr-only">Sort tasks</label>
            <select
              id="sort-key"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none"
            >
              <option value="time">By time</option>
              <option value="category">By category</option>
              <option value="status">By status</option>
            </select>
          </div>
        </div>

        {(openTasks.length > 0 || doneTasks.length > 0 || allTasks.length > 0) && (
          <label className="mb-2 flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={hideDone}
              onChange={(e) => setHideDone(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
            />
            Hide completed
          </label>
        )}

        {allTasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
            {isToday ? 'No tasks planned yet — add one above.' : 'Nothing planned for this day yet.'}
          </p>
        ) : (
          <div className="space-y-4">
            {renderList(openTasks, doneTasks.length > 0 ? 'To do' : undefined)}
            {openTasks.length === 0 && allTasks.length > 0 && (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
                <Heart className="h-4 w-4 text-emerald-600" aria-hidden /> All tasks done for this day. Enjoy the calm.
              </p>
            )}
            {doneTasks.length > 0 && renderList(doneTasks, 'Completed')}
            <button
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700"
            >
              Add another task
            </button>
          </div>
        )}
      </section>

      {/* Overdue list */}
      {overdueAll.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-amber-900">From earlier days</h2>
          <ul className="space-y-2">
            {overdueAll.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white px-3.5 py-3">
                <button
                  onClick={() => toggleTask(t.id)}
                  aria-label={`Mark "${t.title}" as done`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent hover:border-emerald-500"
                >
                  <CheckCircle2 className="h-4 w-4 opacity-0" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-amber-700">
                    Planned {formatDayLabel(t.date).toLowerCase()}
                  </p>
                </div>
                <button
                  onClick={() => setMoveTask(t)}
                  className="min-h-10 shrink-0 rounded-lg bg-sky-50 px-3 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100"
                >
                  Reschedule
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Time goals mini */}
      {categoriesToday.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Time goals today</h2>
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
            {categoriesToday.map(([cat, plannedMin]) => {
              const goal = data.goals.find((g) => g.category === cat);
              const actual = minutesForDate(data.timeEntries, date, cat);
              const target = goal?.minutes ?? 0;
              const p = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_STYLES[cat].dot}`} aria-hidden />
                  <span className="w-20 shrink-0 truncate text-sm font-medium text-slate-700">{cat}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${p >= 100 ? 'bg-emerald-500' : 'bg-teal-400'}`}
                      style={{ width: `${target > 0 ? p : Math.min(100, (actual / 120) * 100)}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums text-slate-500">
                    {formatMinutes(actual)}{target > 0 ? ` / ${formatMinutes(target)}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <TaskEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onSave={saveTask}
        initial={editing}
        date={date}
      />

      {/* Move-to-date dialog */}
      <ConfirmMoveDialog task={moveTask} onClose={() => setMoveTask(null)} onMove={(newDate) => {
        if (!moveTask) return;
        setData((d) => ({
          ...d,
          tasks: d.tasks.map((x) => (x.id === moveTask.id ? { ...x, date: newDate } : x)),
        }));
        toast(`Moved to ${formatDayLabel(newDate).toLowerCase()}`);
        setMoveTask(null);
      }} />

      {undoBar}
    </div>
  );
}

function ConfirmMoveDialog({
  task,
  onClose,
  onMove,
}: {
  task: Task | null;
  onClose: () => void;
  onMove: (date: string) => void;
}) {
  const [target, setTarget] = useState(todayKey());
  if (!task) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Move task" className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl">
        <h2 className="text-base font-semibold text-slate-900">Move “{task.title}”</h2>
        <p className="mt-1.5 text-sm text-slate-600">Pick a new date. The task and its details stay exactly the same.</p>
        <label htmlFor="move-date" className="mt-4 block text-sm font-medium text-slate-700">New date</label>
        <input
          id="move-date"
          type="date"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => target && onMove(target)}
            disabled={!target}
            className="min-h-11 flex-1 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            Move task
          </button>
        </div>
      </div>
    </div>
  );
}
