import { useRef, useState } from 'react';
import { AppData } from '@/lib/types';
import { emptyData, parseImported, save } from '@/lib/storage';
import { ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { Download, Trash2, Upload, Database } from 'lucide-react';

export function BackupScreen({
  data,
  onImport,
}: {
  data: AppData;
  onImport: (d: AppData) => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const counts = [
    { label: 'Tasks', n: data.tasks.length },
    { label: 'Habits', n: data.habits.length },
    { label: 'Habit check-ins', n: data.habitLog.length },
    { label: 'Time entries', n: data.timeEntries.length },
    { label: 'Diary entries', n: data.diary.length },
    { label: 'Notes', n: data.notes.length },
  ];

  const exportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit-harbor-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Backup downloaded');
    } catch {
      toast('Could not create the backup file', 'error');
    }
  };

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseImported(String(reader.result));
        setPendingImport(parsed);
      } catch {
        toast('That file could not be read as a Habit Harbor backup', 'error');
      }
    };
    reader.onerror = () => toast('Could not read that file', 'error');
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Backup & data</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Everything lives in this browser on this device. Changes don't sync automatically — export a file to move your
          planner to another device.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Database className="h-4 w-4 text-emerald-600" aria-hidden /> What is stored right now
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {counts.map((c) => (
            <div key={c.label} className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
              <dt className="text-xs text-slate-500">{c.label}</dt>
              <dd className="text-lg font-bold tabular-nums text-slate-900">{c.n}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Export</h2>
        <p className="mt-1 text-sm text-slate-500">Download a JSON file with all your tasks, habits, notes, and history.</p>
        <button
          onClick={exportJson}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 sm:w-auto"
        >
          <Download className="h-4 w-4" aria-hidden /> Export backup file
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Import</h2>
        <p className="mt-1 text-sm text-slate-500">
          Restore from a backup file. You will be asked to confirm before anything is replaced.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
        >
          <Upload className="h-4 w-4" aria-hidden /> Choose backup file
        </button>
      </section>

      <section className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
        <h2 className="text-sm font-semibold text-red-900">Start fresh</h2>
        <p className="mt-1 text-sm text-red-700/90">
          Clears everything on this device. Export a backup first if you might want it later.
        </p>
        <button
          onClick={() => setConfirmReset(true)}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 sm:w-auto"
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Erase all data
        </button>
      </section>

      <ConfirmDialog
        open={!!pendingImport}
        title="Replace current data?"
        message="Importing will replace everything currently in the app with the contents of the backup file. This cannot be undone."
        confirmLabel="Replace data"
        onConfirm={() => {
          if (pendingImport) {
            if (save(pendingImport)) {
              onImport(pendingImport);
              toast('Backup imported');
            } else {
              toast('Could not save the imported data', 'error');
            }
          }
          setPendingImport(null);
        }}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Erase everything?"
        message="All tasks, habits, notes, diary entries, and history will be cleared from this device. This cannot be undone."
        confirmLabel="Erase all"
        onConfirm={() => {
          const fresh = emptyData();
          if (save(fresh)) {
            onImport(fresh);
            toast('All data erased');
          } else {
            toast('Could not erase data', 'error');
          }
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
