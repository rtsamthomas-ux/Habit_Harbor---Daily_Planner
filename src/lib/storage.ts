import { AppData, Category, Habit, HabitLogEntry, Reflection, Task, TimeEntry } from './types';
import { lastNDays, todayKey } from './dates';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const STORAGE_KEY = 'calm-planner-data-v1';

export function seedData(): AppData {
  const today = todayKey();
  const tasks: Task[] = [
    { id: uid(), title: 'Review math notes', category: 'Study', date: today, time: '09:00', durationMin: 45, completed: false },
    { id: uid(), title: 'Morning walk', category: 'Exercise', date: today, time: '07:30', durationMin: 30, completed: false },
    { id: uid(), title: 'Read a few chapters', category: 'Reading', date: today, durationMin: 25, completed: false },
    { id: uid(), title: 'Tidy up desk', category: 'Personal', date: today, durationMin: 15, completed: false },
  ];
  const habits: Habit[] = [
    { id: uid(), name: 'Stretch or light workout', emoji: '🏃', days: [1, 3, 5], createdAt: today },
    { id: uid(), name: 'Read 20 minutes', emoji: '📚', days: [0, 1, 2, 3, 4, 5, 6], createdAt: today },
    { id: uid(), name: 'Drink enough water', emoji: '💧', days: [0, 1, 2, 3, 4, 5, 6], createdAt: today },
  ];
  return {
    version: 1,
    tasks,
    habits,
    habitLog: [],
    goals: [
      { id: uid(), category: 'Study', minutes: 120 },
      { id: uid(), category: 'Reading', minutes: 30 },
      { id: uid(), category: 'Exercise', minutes: 45 },
      { id: uid(), category: 'Play', minutes: 60 },
    ],
    timeEntries: [],
    diary: [],
    reflections: [],
    notes: [
      { id: uid(), text: 'Welcome aboard! This is your notes space — jot reminders or ideas here.', createdAt: new Date().toISOString() },
    ],
  };
}

export function emptyData(): AppData {
  return {
    version: 1,
    tasks: [],
    habits: [],
    habitLog: [],
    goals: [],
    timeEntries: [],
    diary: [],
    reflections: [],
    notes: [],
  };
}

export function isHabitDue(habit: Habit, dateKey: string): boolean {
  return habit.days.includes(new Date(dateKey + 'T00:00:00').getDay());
}

export function habitStatusFor(habit: Habit, dateKey: string, log: HabitLogEntry[]): HabitLogEntry['status'] | null {
  return log.find((e) => e.habitId === habit.id && e.date === dateKey)?.status ?? null;
}

export function habitStreak(habit: Habit, log: HabitLogEntry[], today: string): number {
  let streak = 0;
  let cursor = today;
  // If today is a scheduled day and not yet done, start checking from yesterday
  // so the streak doesn't look broken before the day is over.
  if (isHabitDue(habit, cursor) && habitStatusFor(habit, cursor, log) !== 'done') {
    const [y, m, d] = cursor.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    cursor = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  for (let i = 0; i < 400; i++) {
    if (isHabitDue(habit, cursor)) {
      if (habitStatusFor(habit, cursor, log) === 'done') streak++;
      else break;
    }
    const [y, m, d] = cursor.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    cursor = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  return streak;
}

export function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    const parsed = JSON.parse(raw) as AppData;
    return sanitize(parsed);
  } catch {
    return seedData();
  }
}

export function save(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function parseImported(text: string): AppData {
  const parsed = JSON.parse(text) as Partial<AppData>;
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tasks)) {
    throw new Error('This file does not look like a Habit Harbor backup.');
  }
  return sanitize({
    ...emptyData(),
    ...parsed,
  });
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asCat(v: unknown): Category {
  return typeof v === 'string' && (['Study', 'Exercise', 'Reading', 'Play', 'Rest', 'Personal', 'Other'] as string[]).includes(v)
    ? (v as Category)
    : 'Other';
}

function sanitize(d: Partial<AppData>): AppData {
  return {
    version: 1,
    tasks: (d.tasks ?? []).map((t): Task => ({
      id: str(t.id) || uid(),
      title: str(t.title),
      category: asCat(t.category),
      date: str(t.date) || todayKey(),
      time: t.time ? str(t.time) : undefined,
      durationMin: typeof t.durationMin === 'number' ? t.durationMin : undefined,
      completed: !!t.completed,
    })),
    habits: (d.habits ?? []).map((h) => ({
      id: str(h.id) || uid(),
      name: str(h.name),
      emoji: str(h.emoji) || '⭐',
      days: Array.isArray(h.days) ? h.days.filter((x) => typeof x === 'number' && x >= 0 && x <= 6) : [],
      createdAt: str(h.createdAt) || todayKey(),
    })),
    habitLog: (d.habitLog ?? []).map((e): HabitLogEntry => ({
      id: str(e.id) || uid(),
      habitId: str(e.habitId),
      date: str(e.date),
      status: e.status === 'skipped' ? 'skipped' : 'done',
    })).filter((e) => e.habitId && e.date),
    goals: (d.goals ?? []).map((g) => ({
      id: str(g.id) || uid(),
      category: asCat(g.category),
      minutes: typeof g.minutes === 'number' && g.minutes > 0 ? g.minutes : 30,
    })),
    timeEntries: (d.timeEntries ?? []).map((t): TimeEntry => ({
      id: str(t.id) || uid(),
      date: str(t.date) || todayKey(),
      category: asCat(t.category),
      minutes: typeof t.minutes === 'number' && t.minutes > 0 ? t.minutes : 0,
    })).filter((t) => t.minutes > 0),
    diary: (d.diary ?? []).map((e) => ({
      date: str(e.date),
      wentWell: str(e.wentWell),
      improve: str(e.improve),
      feeling: str(e.feeling),
      freeText: str(e.freeText),
    })).filter((e) => e.date),
    reflections: (d.reflections ?? []).map((r): Reflection => ({
      date: str(r.date),
      well: str(r.well),
      tomorrow: str(r.tomorrow),
    })).filter((r) => r.date),
    notes: (d.notes ?? []).map((n) => ({
      id: str(n.id) || uid(),
      text: str(n.text),
      createdAt: str(n.createdAt) || new Date().toISOString(),
    })).filter((n) => n.text),
  };
}

export function minutesForDate(entries: TimeEntry[], dateKey: string, category?: string): number {
  return entries
    .filter((e) => e.date === dateKey && (!category || e.category === category))
    .reduce((sum, e) => sum + e.minutes, 0);
}

export function weekStats(data: AppData, days: string[]) {
  const first = days[0];
  const last = days[days.length - 1];
  const tasks = data.tasks.filter((t) => t.date >= first && t.date <= last);
  const completed = tasks.filter((t) => t.completed).length;

  const dueSlots = days.flatMap((day) =>
    data.habits.filter((h) => isHabitDue(h, day)).map((h) => ({ h, day })),
  );
  const doneSlots = dueSlots.filter(({ h, day }) => habitStatusFor(h, day, data.habitLog) === 'done');

  const byCategory = new Map<string, number>();
  data.timeEntries
    .filter((e) => e.date >= first && e.date <= last)
    .forEach((e) => byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.minutes));

  return {
    tasksTotal: tasks.length,
    tasksCompleted: completed,
    habitSlots: dueSlots.length,
    habitDone: doneSlots.length,
    byCategory,
  };
}

export { lastNDays };
