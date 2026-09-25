"use client";

import { Search } from "lucide-react";
import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Input } from "@/core/ui/primitives/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import { cn } from "@/lib/utils";
import type { MockDocument, MockDocumentStatus } from "./page";

interface DocumentTableCopy {
  searchPlaceholder: string;
  filterAll: string;
  columns: { name: string; status: string; chunks: string; size: string; added: string };
  status: Record<MockDocumentStatus, string>;
  emptyTitle: string;
  emptyDescription: string;
}

const STATUS_BADGE_VARIANT: Record<MockDocumentStatus, "secondary" | "outline" | "destructive"> = {
  ready: "secondary",
  processing: "outline",
  failed: "destructive",
};

const STATUS_FILTERS: (MockDocumentStatus | "all")[] = ["all", "processing", "ready", "failed"];

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export default function DocumentTable({
  documents,
  copy,
}: {
  documents: MockDocument[];
  copy: DocumentTableCopy;
}) {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MockDocumentStatus | "all">("all");

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesQuery = query === "" || doc.title.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="ps-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((status) => (
            <Button
              key={status}
              type="button"
              variant={statusFilter === status ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? copy.filterAll : copy.status[status]}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.columns.name}</TableHead>
              <TableHead>{copy.columns.status}</TableHead>
              <TableHead>{copy.columns.chunks}</TableHead>
              <TableHead>{copy.columns.size}</TableHead>
              <TableHead>{copy.columns.added}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <p className="text-sm font-medium text-foreground">{copy.emptyTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{copy.emptyDescription}</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium text-foreground">{doc.title}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[doc.status]} className={cn(doc.status === "processing" && "text-muted-foreground")}>
                      {copy.status[doc.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.chunkCount}</TableCell>
                  <TableCell>{formatBytes(doc.byteSize)}</TableCell>
                  <TableCell>{dateFormatter.format(new Date(doc.createdAt))}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
