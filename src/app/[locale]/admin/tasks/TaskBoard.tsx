"use client";

import { ArrowRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Card } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { useRouter } from "@/i18n/navigation";
import type { InternalTask, TaskColumnStatus } from "@/types";

type Column = "todo" | "in_progress" | "review" | "done";

const COLUMNS: readonly Column[] = ["todo", "in_progress", "review", "done"];

const NEXT_COLUMN: Partial<Record<Column, Column>> = {
  todo: "in_progress",
  in_progress: "review",
  review: "done",
};

function asColumn(value: TaskColumnStatus | string): Column | null {
  return (COLUMNS as readonly string[]).includes(value) ? (value as Column) : null;
}

interface TaskBoardProps {
  tasks: InternalTask[];
}

export default function TaskBoard({ tasks }: TaskBoardProps) {
  const t = useTranslations("admin.tasks");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function send(url: string, init: RequestInit) {
    await fetch(url, init).catch((error: unknown) => {
      console.error("[tasks] request failed:", error);
      return null;
    });
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    await send("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    setCreating(false);
    setTitle("");
    router.refresh();
  }

  async function moveToNextColumn(task: InternalTask, nextColumn: Column) {
    setPendingId(task.id);
    await send(`/api/admin/tasks/${task.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnStatus: nextColumn }),
    });
    setPendingId(null);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap gap-3">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("newTitle")}
          aria-label={t("newTitle")}
          className="min-w-64 flex-1"
        />
        <Button type="submit" loading={creating}>
          {creating ? null : <Plus aria-hidden size={16} />}
          {t("add")}
        </Button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => asColumn(task.column_status) === column);
          return (
            <Card key={column}>
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t(`columns.${column}`)}</h2>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-slate-300">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-3 p-3">
                {columnTasks.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-slate-400">{t("noTasks")}</p>
                ) : null}
                {columnTasks.map((task) => {
                  const nextColumn = NEXT_COLUMN[column];
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 transition-colors hover:border-slate-700"
                    >
                      <p className="text-sm font-medium text-slate-100">{task.title}</p>
                      {task.description ? <p className="mt-1 text-xs text-slate-400">{task.description}</p> : null}
                      {nextColumn ? (
                        <button
                          type="button"
                          onClick={() => moveToNextColumn(task, nextColumn)}
                          disabled={pendingId === task.id}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-violet-300 transition-colors hover:text-violet-200 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50"
                        >
                          {t("moveTo", { column: t(`columns.${nextColumn}`) })}
                          <ArrowRight aria-hidden size={12} className="rtl:rotate-180" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
