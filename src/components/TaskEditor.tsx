import React, { useEffect, useState } from 'react';
import { Category, CATEGORIES, CATEGORY_STYLES, Task } from '@/lib/types';
import { Modal } from '@/components/ui';
import { X } from 'lucide-react';

export function TaskEditor({
  open,
  onClose,
  onSave,
  initial,
  date,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (t: Omit<Task, 'completed'> & { id?: string }) => void;
  initial?: Task | null;
  date: string;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Study');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setCategory(initial?.category ?? 'Study');
      setTime(initial?.time ?? '');
      setDuration(initial?.durationMin ? String(initial.durationMin) : '');
      setError('');
    }
  }, [open, initial]);

  const submit = () => {
    if (!title.trim()) {
      setError('Please give your task a name.');
      return;
    }
    const durNum = duration.trim() === '' ? undefined : Number(duration);
    if (durNum !== undefined && (!Number.isFinite(durNum) || durNum <= 0 || durNum > 1440)) {
      setError('Duration should be between 1 and 1440 minutes.');
      return;
    }
    onSave({
      id: initial?.id,
      title: title.trim(),
      category,
      date,
      time: time || undefined,
      durationMin: durNum,
    } as Omit<Task, 'completed'> & { id?: string });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit task' : 'New task'}>
      <div className="space-y-4">
        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-slate-700">
            Task name
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Review history notes"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-slate-700">Category</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((c) => {
              const active = c === category;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={active}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLES[c].dot}`} aria-hidden />
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-time" className="block text-sm font-medium text-slate-700">
              Time <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="task-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label htmlFor="task-duration" className="block text-sm font-medium text-slate-700">
              Minutes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="task-duration"
              type="number"
              inputMode="numeric"
              min={1}
              max={1440}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            <X className="h-4 w-4" aria-hidden /> {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {initial ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
