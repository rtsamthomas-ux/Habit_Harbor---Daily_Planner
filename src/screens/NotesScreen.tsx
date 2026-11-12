import { useEffect, useState } from 'react';
import { AppData, DiaryEntry, Note, Reflection } from '@/lib/types';
import { formatDayLabel, todayKey } from '@/lib/dates';
import { uid } from '@/lib/storage';
import { EmptyState, ConfirmDialog } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { BookOpen, ChevronLeft, ChevronRight, Lightbulb, StickyNote, Trash2, Lock, MoonStar } from 'lucide-react';

const PROMPTS = [
  { key: 'wentWell', label: 'What went well?' },
  { key: 'improve', label: 'What could I improve tomorrow?' },
  { key: 'feeling', label: 'How am I feeling?' },
] as const;

export function NotesScreen({
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
  const today = todayKey();
  const [noteText, setNoteText] = useState('');
  const [diaryDraft, setDiaryDraft] = useState<DiaryEntry>({ date, wentWell: '', improve: '', feeling: '', freeText: '' });
  const [reflectionDraft, setReflectionDraft] = useState<Reflection>({ date, well: '', tomorrow: '' });
  const [confirmNote, setConfirmNote] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const existing = data.diary.find((e) => e.date === date);
    setDiaryDraft(existing ?? { date, wentWell: '', improve: '', feeling: '', freeText: '' });
    const existingR = data.reflections.find((r) => r.date === date);
    setReflectionDraft(existingR ?? { date, well: '', tomorrow: '' });
  }, [date, data.diary, data.reflections]);

  // Debounced auto-save for the diary
  useEffect(() => {
    const isEmpty =
      !diaryDraft.wentWell.trim() &&
      !diaryDraft.improve.trim() &&
      !diaryDraft.feeling.trim() &&
      !diaryDraft.freeText.trim();
    const timer = setTimeout(() => {
      const existing = data.diary.find((e) => e.date === date);
      if (isEmpty && !existing) return;
      if (
        existing &&
        existing.wentWell === diaryDraft.wentWell &&
        existing.improve === diaryDraft.improve &&
        existing.feeling === diaryDraft.feeling &&
        existing.freeText === diaryDraft.freeText
      )
        return;
      setData((d) => ({
        ...d,
        diary: isEmpty
          ? d.diary.filter((e) => e.date !== date)
          : [...d.diary.filter((e) => e.date !== date), { ...diaryDraft, date }],
      }));
      if (!isEmpty) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [diaryDraft, date]);

  // Debounced auto-save for the reflection
  useEffect(() => {
    const isEmpty = !reflectionDraft.well.trim() && !reflectionDraft.tomorrow.trim();
    const timer = setTimeout(() => {
      const existing = data.reflections.find((r) => r.date === date);
      if (isEmpty && !existing) return;
      if (existing && existing.well === reflectionDraft.well && existing.tomorrow === reflectionDraft.tomorrow) return;
      setData((d) => ({
        ...d,
        reflections: isEmpty
          ? d.reflections.filter((r) => r.date !== date)
          : [...d.reflections.filter((r) => r.date !== date), { ...reflectionDraft, date }],
      }));
    }, 700);
    return () => clearTimeout(timer);
  }, [reflectionDraft, date]);

  const addNote = () => {
    if (!noteText.trim()) {
      toast('Write something first', 'error');
      return;
    }
    const note: Note = { id: uid(), text: noteText.trim(), createdAt: new Date().toISOString() };
    setData((d) => ({ ...d, notes: [note, ...d.notes] }));
    setNoteText('');
    toast('Note saved');
  };

  const sortedNotes = [...data.notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const pastEntries = [...data.diary].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notes & diary</h1>
        <p className="mt-0.5 text-sm text-slate-500">A quiet space for reminders and end-of-day reflections.</p>
      </div>

      {/* Quick notes */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <StickyNote className="h-4 w-4 text-amber-500" aria-hidden /> Quick notes
        </h2>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Remember to…"
            aria-label="New note"
            className="min-h-12 flex-1 rounded-xl border border-slate-200 px-3.5 text-base focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
          />
          <button
            onClick={addNote}
            className="min-h-12 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Save note
          </button>
        </div>
        {sortedNotes.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon={<Lightbulb className="h-6 w-6" />} title="No notes yet" hint="Jot down reminders or ideas — they stay on this device." />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {sortedNotes.map((n) => (
              <li key={n.id} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                <p className="flex-1 text-sm leading-relaxed text-slate-800">{n.text}</p>
                <button
                  onClick={() => setConfirmNote(n.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Diary */}
      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BookOpen className="h-4 w-4 text-sky-600" aria-hidden /> Diary — {formatDayLabel(date)}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const d = new Date(date + 'T00:00:00');
                d.setDate(d.getDate() - 1);
                setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                const d = new Date(date + 'T00:00:00');
                d.setDate(d.getDate() + 1);
                const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (k <= today) setDate(k);
              }}
              disabled={date >= today}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              aria-label="Next day"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Lock className="h-3 w-3" aria-hidden /> Stays on this device. Saved automatically.
            <span className={`ml-auto font-medium text-emerald-600 transition-opacity ${savedFlash ? 'opacity-100' : 'opacity-0'}`} role="status">
              Saved
            </span>
          </p>
          <div className="mt-3 space-y-4">
            {PROMPTS.map((p) => (
              <div key={p.key}>
                <label htmlFor={`diary-${p.key}`} className="block text-sm font-medium text-slate-700">{p.label}</label>
                <textarea
                  id={`diary-${p.key}`}
                  rows={2}
                  value={diaryDraft[p.key]}
                  onChange={(e) => setDiaryDraft((prev) => ({ ...prev, [p.key]: e.target.value }))}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm leading-relaxed focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            ))}
            <div>
              <label htmlFor="diary-free" className="block text-sm font-medium text-slate-700">Anything else</label>
              <textarea
                id="diary-free"
                rows={3}
                value={diaryDraft.freeText}
                onChange={(e) => setDiaryDraft((prev) => ({ ...prev, freeText: e.target.value }))}
                placeholder="Free writing space…"
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm leading-relaxed focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Past entries</h3>
        {pastEntries.length === 0 ? (
          <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No past entries yet" hint="Write today's entry and it will appear here afterwards." />
        ) : (
          <ul className="space-y-2">
            {pastEntries.map((e) => (
              <li key={e.date}>
                <button
                  onClick={() => setDate(e.date)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-emerald-200"
                >
                  <span className="text-sm font-medium text-slate-800">{formatDayLabel(e.date)}</span>
                  <span className="max-w-40 truncate text-xs text-slate-400">
                    {e.wentWell || e.freeText || e.feeling || 'Entry'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Evening reflection */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MoonStar className="h-4 w-4 text-indigo-500" aria-hidden /> Evening reflection — {formatDayLabel(date)}
        </h2>
        <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-400">Two small questions. Saved automatically.</p>
          <div className="mt-3 space-y-4">
            <div>
              <label htmlFor="refl-well" className="block text-sm font-medium text-slate-700">What went well today?</label>
              <textarea
                id="refl-well"
                rows={2}
                value={reflectionDraft.well}
                onChange={(e) => setReflectionDraft((prev) => ({ ...prev, well: e.target.value }))}
                placeholder="Even one small thing counts."
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm leading-relaxed focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label htmlFor="refl-tomorrow" className="block text-sm font-medium text-slate-700">What is one thing I want to do tomorrow?</label>
              <textarea
                id="refl-tomorrow"
                rows={2}
                value={reflectionDraft.tomorrow}
                onChange={(e) => setReflectionDraft((prev) => ({ ...prev, tomorrow: e.target.value }))}
                placeholder="Keep it small and kind."
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm leading-relaxed focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        {data.reflections.filter((r) => r.date !== date).length > 0 && (
          <>
            <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Past reflections</h3>
            <ul className="space-y-2">
              {[...data.reflections]
                .filter((r) => r.date !== date)
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r) => (
                  <li key={r.date} className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                    <button onClick={() => setDate(r.date)} className="text-sm font-medium text-indigo-900 hover:underline">
                      {formatDayLabel(r.date)}
                    </button>
                    {r.well && <p className="mt-1 text-sm text-slate-700"><span className="font-medium">Went well:</span> {r.well}</p>}
                    {r.tomorrow && <p className="mt-0.5 text-sm text-slate-700"><span className="font-medium">Tomorrow:</span> {r.tomorrow}</p>}
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>

      <ConfirmDialog
        open={!!confirmNote}
        title="Delete this note?"
        message="This note will be removed. This cannot be undone."
        onConfirm={() => {
          if (confirmNote) {
            setData((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== confirmNote) }));
            toast('Note deleted');
          }
          setConfirmNote(null);
        }}
        onCancel={() => setConfirmNote(null)}
      />
    </div>
  );
}
