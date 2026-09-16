"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InternalTask, TaskColumnStatus } from "@/types";

const COLUMNS: { key: TaskColumnStatus; label: string }[] = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

const NEXT_COLUMN: Partial<Record<TaskColumnStatus, TaskColumnStatus>> = {
  todo: "in_progress",
  in_progress: "review",
  review: "done",
};

interface TaskBoardProps {
  tasks: InternalTask[];
}

export default function TaskBoard({ tasks }: TaskBoardProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    }).catch(() => null);
    setCreating(false);
    setTitle("");
    router.refresh();
  }

  async function moveToNextColumn(task: InternalTask) {
    const nextColumn = NEXT_COLUMN[task.column_status as TaskColumnStatus];
    if (!nextColumn) return;

    setPendingId(task.id);
    await fetch(`/api/admin/tasks/${task.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnStatus: nextColumn }),
    }).catch(() => null);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="New task title…"
          className="min-w-64 flex-1 rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
        />
        <Button type="submit" disabled={creating}>
          <Plus size={16} />
          Add task
        </Button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.column_status === column.key);

          return (
            <div key={column.key} className="rounded-interactive border border-subtle bg-surface">
              <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
                <h2 className="text-sm font-semibold text-ink-primary">{column.label}</h2>
                <span className="rounded-control bg-surface-raised px-2 py-0.5 text-xs font-semibold text-ink-muted">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 p-3">
                {columnTasks.length === 0 && (
                  <p className="px-1 py-4 text-center text-xs text-ink-muted">No tasks</p>
                )}

                {columnTasks.map((task) => {
                  const nextColumn = NEXT_COLUMN[task.column_status as TaskColumnStatus];
                  return (
                    <div
                      key={task.id}
                      className="rounded-control border border-subtle bg-canvas p-3"
                    >
                      <p className="text-sm font-medium text-ink-primary">{task.title}</p>
                      {task.description && (
                        <p className="mt-1 text-xs text-ink-muted">{task.description}</p>
                      )}

                      {nextColumn && (
                        <button
                          type="button"
                          onClick={() => moveToNextColumn(task)}
                          disabled={pendingId === task.id}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-dim transition-colors hover:text-violet disabled:opacity-50"
                        >
                          Move to {COLUMNS.find((c) => c.key === nextColumn)?.label}
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
