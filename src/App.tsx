import { useEffect, useState } from 'react';
import { AppData } from '@/lib/types';
import { load, save } from '@/lib/storage';
import { todayKey } from '@/lib/dates';
import { TodayScreen } from '@/screens/TodayScreen';
import { HabitsScreen } from '@/screens/HabitsScreen';
import { GoalsScreen } from '@/screens/GoalsScreen';
import { NotesScreen } from '@/screens/NotesScreen';
import { WeekScreen } from '@/screens/WeekScreen';
import { BackupScreen } from '@/screens/BackupScreen';
import { ToastProvider } from '@/components/Toast';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Logo } from '@/components/Logo';
import {
  CalendarDays,
  Repeat,
  Timer,
  NotebookPen,
  BarChart3,
  Archive,
} from 'lucide-react';

type Tab = 'today' | 'habits' | 'goals' | 'notes' | 'week' | 'backup';

const NAV: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: 'today', label: 'Today', icon: CalendarDays },
  { id: 'habits', label: 'Habits', icon: Repeat },
  { id: 'goals', label: 'Goals', icon: Timer },
  { id: 'notes', label: 'Notes', icon: NotebookPen },
  { id: 'week', label: 'Week', icon: BarChart3 },
  { id: 'backup', label: 'Backup', icon: Archive },
];

function App() {
  const [data, setDataState] = useState<AppData>(() => load());
  const [tab, setTab] = useState<Tab>('today');
  const [date, setDate] = useState(() => todayKey());

  const setData = (fn: (d: AppData) => AppData) => {
    setDataState((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  };

  // Roll the "Today" view forward if the app stays open past midnight.
  useEffect(() => {
    const t = setInterval(() => setDate(todayKey()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#FBF7F0] text-slate-800 antialiased">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur md:hidden">
          <div className="flex items-center gap-2.5 px-4 py-3">
            <Logo className="h-7 w-7" />
            <span className="font-wordmark text-lg text-[#1A3B3C]">Habit Harbor</span>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl">
          {/* Desktop sidebar */}
          <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-slate-200/70 bg-white/60 px-4 py-6 md:flex">
            <div className="flex items-center gap-2.5 px-2">
              <Logo className="h-8 w-8" />
              <span className="font-wordmark text-xl text-[#1A3B3C]">Habit Harbor</span>
            </div>
            <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
              {NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  aria-current={tab === id ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    tab === id
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${tab === id ? 'text-emerald-600' : 'text-slate-400'}`} aria-hidden />
                  {label}
                </button>
              ))}
            </nav>
            <p className="mt-auto px-3 text-xs leading-relaxed text-slate-400">
              Saved on this device. Use Backup to move data between devices — changes don't sync automatically.
            </p>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 md:pb-10 md:pt-8">
            <OfflineBanner />
            <div className="h-2" />
            {tab === 'today' && <TodayScreen data={data} setData={setData} date={date} setDate={setDate} />}
            {tab === 'habits' && <HabitsScreen data={data} setData={setData} />}
            {tab === 'goals' && <GoalsScreen data={data} setData={setData} />}
            {tab === 'notes' && <NotesScreen data={data} setData={setData} date={date} setDate={setDate} />}
            {tab === 'week' && <WeekScreen data={data} setData={setData} />}
            {tab === 'backup' && <BackupScreen data={data} onImport={(d) => setDataState(d)} />}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
          aria-label="Main"
        >
          <div className="mx-auto flex max-w-lg">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  tab === id ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`h-5 w-5 ${tab === id ? 'scale-110' : ''} transition-transform`} aria-hidden />
                {label}
                {tab === id && <span className="h-1 w-1 rounded-full bg-emerald-600" aria-hidden />}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </ToastProvider>
  );
}

export default App;
