"use client";

import { AlertCircle, CheckCircle2, FileText, RotateCw, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Progress } from "@/core/ui/primitives/progress";
import Spinner from "@/components/ui/Spinner";
import type { UploadItem } from "@/components/dashboard/knowledge-base/useUploadQueue";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

interface UploadQueueProps {
  items: UploadItem[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}

/** Per-file upload state: progress while sending, a spinner while the server embeds. */
export default function UploadQueue({ items, onRetry, onDismiss }: UploadQueueProps) {
  const t = useTranslations("dashboard.knowledgeBase");
  const locale = useLocale();

  if (items.length === 0) return null;

  return (
    <ul aria-label={t("queue.title")} className="mt-4 grid gap-2">
      {items.map((item) => {
        const failed = item.phase === "failed";
        // Type/size rejections can never succeed on retry.
        const retryable = failed && item.error !== "unsupported_type" && item.error !== "too_large" && item.error !== "empty";

        return (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-3 py-2.5",
              failed ? "border-red-400/30 bg-red-400/5" : "border-slate-800 bg-slate-950/40",
            )}
          >
            <span aria-hidden className="shrink-0 text-slate-400">
              {item.phase === "ready" ? (
                <CheckCircle2 className="size-4 text-emerald-400" />
              ) : failed ? (
                <AlertCircle className="size-4 text-red-400" />
              ) : item.phase === "processing" ? (
                <Spinner className="text-violet-400" />
              ) : (
                <FileText className="size-4" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-medium text-slate-100">{item.name}</p>
                <p dir="ltr" className="shrink-0 font-mono text-xs text-slate-400">
                  {formatBytes(locale, item.size)}
                </p>
              </div>
              <p className={cn("mt-0.5 text-xs", failed ? "text-red-300" : "text-slate-400")} role={failed ? "alert" : undefined}>
                {failed
                  ? t(`errors.${item.error ?? "server_error"}`)
                  : item.phase === "uploading"
                    ? t("queue.uploading", { percent: item.progress })
                    : t(`queue.${item.phase}`)}
              </p>
              {item.phase === "uploading" || item.phase === "processing" ? (
                <Progress
                  className="mt-2 h-1"
                  value={item.phase === "uploading" ? item.progress : null}
                  aria-label={t("queue.title")}
                />
              ) : null}
            </div>

            {retryable ? (
              <button
                type="button"
                onClick={() => onRetry(item.id)}
                aria-label={t("queue.retry")}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <RotateCw aria-hidden className="size-4" />
              </button>
            ) : null}
            {failed || item.phase === "ready" ? (
              <button
                type="button"
                onClick={() => onDismiss(item.id)}
                aria-label={t("queue.dismiss")}
                className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <X aria-hidden className="size-4" />
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
