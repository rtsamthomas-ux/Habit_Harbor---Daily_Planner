import { useEffect, useRef, useState } from 'react';
import { AppData, CATEGORIES, CATEGORY_STYLES, Category } from '@/lib/types';
import { formatMinutes, todayKey } from '@/lib/dates';
import { minutesForDate, uid } from '@/lib/storage';
import { EmptyState } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { Pause, Play, Plus, Target, Timer, Trash2 } from 'lucide-react';

export function GoalsScreen({
  data,
  setData,
}: {
  data: AppData;
  setData: (fn: (d: AppData) => AppData) => void;
}) {
  const toast = useToast();
  const today = todayKey();
  const [timerCat, setTimerCat] = useState<Category | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [manualCat, setManualCat] = useState<Category>('Study');
  const [manualMin, setManualMin] = useState('');
  const [goalCat, setGoalCat] = useState<Category>('Study');
  const [goalMin, setGoalMin] = useState('');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerCat !== null) {
      intervalRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      };
    }
  }, [timerCat]);

  const startTimer = (c: Category) => {
    setTimerCat(c);
    setSeconds(0);
  };

  const stopAndSave = () => {
    if (timerCat === null) return;
    const mins = Math.max(1, Math.round(seconds / 60));
    setData((d) => ({
      ...d,
      timeEntries: [...d.timeEntries, { id: uid(), date: today, category: timerCat, minutes: mins }],
    }));
    setTimerCat(null);
    setSeconds(0);
    toast(`${mins} min added to ${timerCat}`);
  };

  const addManual = () => {
    const n = Number(manualMin);
    if (!Number.isFinite(n) || n <= 0 || n > 1440) {
      toast('Enter minutes between 1 and 1440', 'error');
      return;
    }
    setData((d) => ({
      ...d,
      timeEntries: [...d.timeEntries, { id: uid(), date: today, category: manualCat, minutes: Math.round(n) }],
    }));
    setManualMin('');
    toast(`${Math.round(n)} min added to ${manualCat}`);
  };

  const addGoal = () => {
    const n = Number(goalMin);
    if (!Number.isFinite(n) || n <= 0 || n > 1440) {
      toast('Enter minutes between 1 and 1440', 'error');
      return;
    }
    setData((d) => {
      const existing = d.goals.find((g) => g.category === goalCat);
      if (existing) {
        return { ...d, goals: d.goals.map((g) => (g.category === goalCat ? { ...g, minutes: Math.round(n) } : g)) };
      }
      return { ...d, goals: [...d.goals, { id: uid(), category: goalCat, minutes: Math.round(n) }] };
    });
    setGoalMin('');
    toast(`Goal saved: ${goalCat} ${Math.round(n)} min/day`);
  };

  const removeGoal = (cat: Category) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.category !== cat) }));
    toast('Goal removed');
  };

  const removeTodayEntries = (cat: Category) => {
    setData((d) => ({
      ...d,
      timeEntries: d.timeEntries.filter((e) => !(e.date === today && e.category === cat)),
    }));
    toast('Entries removed');
  };

  const goalRows = data.goals;
  const extraCats = [...new Set(data.timeEntries.filter((e) => e.date === today).map((e) => e.category))]
    .filter((c) => !goalRows.some((g) => g.category === c));

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Time goals</h1>
        <p className="mt-0.5 text-sm text-slate-500">Set a daily target, then track time with the timer or by hand.</p>
      </div>

      {/* Timer */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Timer className="h-4 w-4 text-emerald-600" aria-hidden /> Timer
        </h2>
        {timerCat === null ? (
          <>
            <p className="mt-1 text-sm text-slate-500">Pick an activity to start tracking.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => startTimer(c)}
                  className="flex min-h-10 items-center gap-1.5 rounded-full bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:ring-emerald-200"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden /> {c}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-2 flex flex-col items-center gap-3 py-2">
            <p className="text-sm font-medium text-slate-500">Tracking {timerCat}</p>
            <p className="font-mono text-4xl font-bold tabular-nums text-slate-900" aria-live="polite">
              {mm}:{ss}
            </p>
            <div className="flex gap-3">
              <button
                onClick={stopAndSave}
                className="flex min-h-12 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Pause className="h-4 w-4" aria-hidden /> Stop & save
              </button>
              <button
                onClick={() => {
                  setTimerCat(null);
                  setSeconds(0);
                }}
                className="min-h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Discard
              </button>
            </div>
            <p className="text-xs text-slate-400">Time under a minute is saved as 1 minute.</p>
          </div>
        )}
      </section>

      {/* Log time manually */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Log time for today</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            value={manualCat}
            onChange={(e) => setManualCat(e.target.value as Category)}
            aria-label="Activity"
            className="min-h-12 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            value={manualMin}
            onChange={(e) => setManualMin(e.target.value)}
            placeholder="Minutes, e.g. 30"
            aria-label="Minutes"
            className="min-h-12 flex-1 rounded-xl border border-slate-200 px-3.5 text-base focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            onKeyDown={(e) => e.key === 'Enter' && addManual()}
          />
          <button
            onClick={addManual}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add
          </button>
        </div>
      </section>

      {/* Goals vs actual */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Today: target vs actual</h2>
        {goalRows.length === 0 && extraCats.length === 0 ? (
          <EmptyState
            icon={<Target className="h-6 w-6" />}
            title="No time goals yet"
            hint="Set a target below, like “Study 2 hours a day”. Goals are gentle guides, not grades."
          />
        ) : (
          <ul className="space-y-2">
            {[...goalRows.map((g) => g.category), ...extraCats].map((cat) => {
              const goal = goalRows.find((g) => g.category === cat);
              const target = goal?.minutes ?? 0;
              const actual = minutesForDate(data.timeEntries, today, cat);
              const p = target > 0 ? Math.round((actual / target) * 100) : 0;
              const met = target > 0 && actual >= target;
              return (
                <li key={cat} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_STYLES[cat].dot}`} aria-hidden />
                    <span className="flex-1 text-sm font-semibold text-slate-800">{cat}</span>
                    {met && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        Target reached
                      </span>
                    )}
                    <span className="text-xs tabular-nums text-slate-500">
                      {formatMinutes(actual)}{target > 0 ? ` of ${formatMinutes(target)}` : ' logged'}
                    </span>
                    {goal && (
                      <button
                        onClick={() => removeGoal(cat)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500"
                        aria-label={`Remove ${cat} goal`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${p} percent of target`}>
                    <div
                      className={`h-full rounded-full transition-all ${met ? 'bg-emerald-500' : 'bg-teal-400'}`}
                      style={{ width: `${target > 0 ? Math.min(100, p) : Math.min(100, (actual / 120) * 100)}%` }}
                    />
                  </div>
                  {actual > 0 && (
                    <button
                      onClick={() => removeTodayEntries(cat)}
                      className="mt-2 text-xs font-medium text-slate-400 hover:text-red-600 hover:underline"
                    >
                      Clear today's {cat} entries
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Set a goal */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Set a daily goal</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            value={goalCat}
            onChange={(e) => setGoalCat(e.target.value as Category)}
            aria-label="Goal activity"
            className="min-h-12 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            value={goalMin}
            onChange={(e) => setGoalMin(e.target.value)}
            placeholder="Minutes per day, e.g. 90"
            aria-label="Minutes per day"
            className="min-h-12 flex-1 rounded-xl border border-slate-200 px-3.5 text-base focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
          />
          <button
            onClick={addGoal}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Target className="h-4 w-4" aria-hidden /> Save goal
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">Saving a goal for an activity that already has one updates it.</p>
      </section>
    </div>
  );
}
