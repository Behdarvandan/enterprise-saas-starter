"use client";

import { AlertCircle, FileText, Layers, Trash2, TypeIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/ui/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes, formatMetricNumber } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { DocumentListItem } from "@/types";

interface DocumentListProps {
  /** `null` while the first load is in flight. */
  documents: DocumentListItem[] | null;
  loadFailed: boolean;
  onReload: () => void;
  onDelete: (ids: string[]) => Promise<void>;
  onPreview: (document: DocumentListItem) => void;
  /** Advertised plan cap, shown as "n of limit"; null when unlimited. */
  limit: number | null;
}

/**
 * Documents table with per-row and bulk actions. Deletion always goes through
 * a confirmation dialog (it also removes every chunk), then is optimistic with
 * rollback + toast on failure.
 */
export default function DocumentList({
  documents,
  loadFailed,
  onReload,
  onDelete,
  onPreview,
  limit,
}: DocumentListProps) {
  const t = useTranslations("dashboard.knowledgeBase");
  const format = useFormatter();
  const locale = useLocale();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rows = documents ?? [];
  // Selection can outlive a row (deleted elsewhere, or by polling refresh).
  const selectedIds = rows.filter((doc) => selected.has(doc.id)).map((doc) => doc.id);
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  function toggle(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function confirmDelete() {
    if (!confirming) return;
    const ids = confirming;
    setDeleting(true);
    try {
      await onDelete(ids);
      setSelected((current) => new Set([...current].filter((id) => !ids.includes(id))));
      toast({ tone: "success", title: t("list.deleted", { count: ids.length }) });
    } catch (error) {
      console.error("[kb] delete failed:", error);
      toast({ tone: "error", title: t("list.deleteFailed") });
    } finally {
      setDeleting(false);
      setConfirming(null);
    }
  }

  const countLabel =
    limit === null
      ? t("list.countUnlimited", { count: rows.length })
      : t("list.count", { count: formatMetricNumber(locale, rows.length), limit: formatMetricNumber(locale, limit) });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">{t("list.title")}</h2>
          {documents ? <p className="mt-0.5 text-xs text-slate-400">{countLabel}</p> : null}
        </div>

        {selectedIds.length > 0 ? (
          <div role="toolbar" aria-label={t("list.bulkActions")} className="flex items-center gap-2">
            <span className="text-xs text-slate-300">{t("list.selected", { count: selectedIds.length })}</span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              {t("list.clearSelection")}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirming(selectedIds)}>
              <Trash2 aria-hidden />
              {t("list.deleteSelected")}
            </Button>
          </div>
        ) : null}
      </div>

      {documents === null && !loadFailed ? (
        <div className="grid gap-2 p-5" aria-busy>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : loadFailed && documents === null ? (
        <EmptyState
          icon={AlertCircle}
          title={t("list.loadFailedTitle")}
          description={t("list.loadFailedDescription")}
          action={
            <Button variant="secondary" size="sm" onClick={onReload}>
              {t("list.reload")}
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState icon={Layers} title={t("list.emptyTitle")} description={t("list.emptyDescription")} />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : selectedIds.length > 0 ? "indeterminate" : false}
                    onCheckedChange={(checked) => setSelected(checked === true ? new Set(rows.map((d) => d.id)) : new Set())}
                    aria-label={t("list.selectAll")}
                  />
                </TableHead>
                <TableHead>{t("list.columns.name")}</TableHead>
                <TableHead>{t("list.columns.status")}</TableHead>
                <TableHead className="text-end">{t("list.columns.chunks")}</TableHead>
                <TableHead className="text-end">{t("list.columns.size")}</TableHead>
                <TableHead>{t("list.columns.added")}</TableHead>
                <TableHead className="w-24">
                  <span className="sr-only">{t("list.columns.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((doc) => (
                <TableRow key={doc.id} data-state={selected.has(doc.id) ? "selected" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(doc.id)}
                      onCheckedChange={(checked) => toggle(doc.id, checked === true)}
                      aria-label={t("list.select", { title: doc.title })}
                    />
                  </TableCell>
                  <TableCell className="max-w-64">
                    <div className="flex items-center gap-2">
                      {doc.sourceType === "file" ? (
                        <FileText aria-hidden className="size-4 shrink-0 text-slate-500" />
                      ) : (
                        <TypeIcon aria-hidden className="size-4 shrink-0 text-slate-500" />
                      )}
                      <span className="truncate font-medium text-slate-100">{doc.title}</span>
                    </div>
                    {doc.status === "failed" && doc.error ? (
                      <p className="mt-0.5 truncate ps-6 text-xs text-red-300" title={doc.error}>
                        {doc.error}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge tone={doc.status === "ready" ? "success" : doc.status === "failed" ? "error" : "warn"}>
                      {doc.status === "processing" ? <Spinner className="size-3" /> : null}
                      {t(`list.status.${doc.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell dir="ltr" className="text-end font-mono text-xs text-slate-300">
                    {formatMetricNumber(locale, doc.chunkCount)}
                  </TableCell>
                  <TableCell dir="ltr" className="text-end font-mono text-xs text-slate-400">
                    {doc.byteSize === null ? "—" : formatBytes(locale, doc.byteSize)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {format.dateTime(new Date(doc.createdAt), { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={doc.status !== "ready"}
                        onClick={() => onPreview(doc)}
                        aria-label={t("list.viewChunks", { title: doc.title })}
                      >
                        <Layers aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 hover:text-red-300"
                        onClick={() => setConfirming([doc.id])}
                        aria-label={t("list.deleteOne", { title: doc.title })}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && !deleting && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("list.confirmTitle", { count: confirming?.length ?? 0 })}</DialogTitle>
            <DialogDescription>{t("list.confirmDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(null)} disabled={deleting}>
              {t("list.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} loading={deleting}>
              {t("list.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
