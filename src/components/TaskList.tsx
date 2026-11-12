import { useState } from 'react';
import { Task } from '@/lib/types';
import { ConfirmDialog, EmptyState } from '@/components/ui';
import {
  Check,
  Clock,
  ListTodo,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';

export function TaskList({
  tasks,
  title,
  emptyTitle,
  emptyHint,
  onToggle,
  onEdit,
  onDelete,
  onAdd,
  addLabel = 'Add task',
}: {
  tasks: Task[];
  title?: string;
  emptyTitle: string;
  emptyHint?: string;
  onToggle: (id: string) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onAdd?: () => void;
  addLabel?: string;
}) {
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ListTodo className="h-6 w-6" />}
        title={emptyTitle}
        hint={emptyHint}
      />
    );
  }

  return (
    <div>
      {title && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>}
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li
            key={t.id}
            className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors sm:px-4 ${
              t.completed
                ? 'border-emerald-100 bg-emerald-50/60'
                : 'border-slate-200 bg-white hover:border-emerald-200'
            }`}
          >
            <button
              onClick={() => onToggle(t.id)}
              aria-label={t.completed ? `Mark "${t.title}" as not done` : `Mark "${t.title}" as done`}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                t.completed
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-300 bg-white text-transparent hover:border-emerald-500'
              }`}
            >
              {t.completed ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                <Check className="h-4 w-4 opacity-0" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium sm:text-base ${
                  t.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                }`}
              >
                {t.title}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${
                    t.completed
                      ? 'bg-white text-slate-500 ring-slate-200'
                      : 'bg-slate-50 ring-slate-100'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
                  {t.category}
                </span>
                {t.time && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden /> {t.time}
                  </span>
                )}
                {t.durationMin ? <span>· {t.durationMin} min</span> : null}
                {t.completed && (
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> Done
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                onClick={() => onEdit(t)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={`Edit "${t.title}"`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmTask(t)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete "${t.title}"`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {onAdd && (
        <button
          onClick={onAdd}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700"
        >
          <Plus className="h-4 w-4" /> {addLabel}
        </button>
      )}

      <ConfirmDialog
        open={!!confirmTask}
        title="Delete this task?"
        message={`"${confirmTask?.title ?? ''}" will be removed. This cannot be undone.`}
        onConfirm={() => {
          if (confirmTask) onDelete(confirmTask);
          setConfirmTask(null);
        }}
        onCancel={() => setConfirmTask(null)}
      />
    </div>
  );
}
