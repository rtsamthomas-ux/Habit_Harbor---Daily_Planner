export type Category =
  | 'Study'
  | 'Exercise'
  | 'Reading'
  | 'Play'
  | 'Rest'
  | 'Personal'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Study',
  'Exercise',
  'Reading',
  'Play',
  'Rest',
  'Personal',
  'Other',
];

export const CATEGORY_STYLES: Record<
  Category,
  { icon: string; dot: string; chip: string }
> = {
  Study: { icon: 'BookOpen', dot: 'bg-teal-500', chip: 'bg-teal-50 text-teal-800 ring-teal-200' },
  Exercise: { icon: 'Dumbbell', dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-800 ring-orange-200' },
  Reading: { icon: 'Library', dot: 'bg-sky-500', chip: 'bg-sky-50 text-sky-800 ring-sky-200' },
  Play: { icon: 'Gamepad2', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-900 ring-amber-200' },
  Rest: { icon: 'Coffee', dot: 'bg-rose-400', chip: 'bg-rose-50 text-rose-800 ring-rose-200' },
  Personal: { icon: 'UserRound', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  Other: { icon: 'CircleDot', dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

export interface Task {
  id: string;
  title: string;
  category: Category;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  durationMin?: number;
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  days: number[]; // 0=Sun .. 6=Sat
  createdAt: string;
}

export interface TimeGoal {
  id: string;
  category: Category;
  minutes: number;
}

export interface TimeEntry {
  id: string;
  date: string;
  category: Category;
  minutes: number;
}

export interface DiaryEntry {
  date: string; // one per day
  wentWell: string;
  improve: string;
  feeling: string;
  freeText: string;
}

export interface Reflection {
  date: string; // one per day
  well: string;
  tomorrow: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export interface AppData {
  version: number;
  tasks: Task[];
  habits: Habit[];
  habitLog: HabitLogEntry[];
  goals: TimeGoal[];
  timeEntries: TimeEntry[];
  diary: DiaryEntry[];
  reflections: Reflection[];
  notes: Note[];
}

export interface HabitLogEntry {
  id: string;
  habitId: string;
  date: string;
  status: 'done' | 'skipped';
}
