"use client";

import { Activity, Search } from "lucide-react";
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
import type { ApprovalStatus } from "@/modules/agent-approval";
import ExecutionTraceDialog from "./ExecutionTraceDialog";
import type { ExecutionTraceSpan } from "./ExecutionTraceWaterfall";
import type { MockLogEntry, MockLogLevel } from "./page";

interface LogsTableCopy {
  searchPlaceholder: string;
  levels: Record<"all" | MockLogLevel, string>;
  columns: {
    timestamp: string;
    service: string;
    level: string;
    message: string;
    duration: string;
    authorization: string;
    trace: string;
  };
  hitl: {
    filterLabel: string;
    statusPending: string;
    statusApproved: string;
    statusRejected: string;
    none: string;
  };
  trace: {
    dialogTitle: string;
    totalDurationLabel: string;
    spanLabels: Record<ExecutionTraceSpan["name"], string>;
    viewButtonLabel: string;
    expandLabel: string;
    collapseLabel: string;
  };
}

const LEVEL_BADGE_VARIANT: Record<MockLogLevel, "outline" | "secondary" | "destructive"> = {
  info: "outline",
  warn: "secondary",
  error: "destructive",
};

const APPROVAL_BADGE_VARIANT: Record<ApprovalStatus, "outline" | "default" | "destructive"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
};

const LEVEL_FILTERS: (MockLogLevel | "all")[] = ["all", "info", "warn", "error"];

export default function LogsTable({
  logs,
  traces,
  copy,
}: {
  logs: MockLogEntry[];
  traces: Record<string, ExecutionTraceSpan[]>;
  copy: LogsTableCopy;
}) {
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<MockLogLevel | "all">("all");
  const [requiresApprovalOnly, setRequiresApprovalOnly] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" }),
    [locale],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesQuery =
        query === "" ||
        log.message.toLowerCase().includes(query) ||
        log.service.toLowerCase().includes(query);
      const matchesLevel = levelFilter === "all" || log.level === levelFilter;
      const matchesApproval = !requiresApprovalOnly || log.approvalStatus !== null;
      return matchesQuery && matchesLevel && matchesApproval;
    });
  }, [logs, search, levelFilter, requiresApprovalOnly]);

  const approvalStatusLabel: Record<ApprovalStatus, string> = {
    pending: copy.hitl.statusPending,
    approved: copy.hitl.statusApproved,
    rejected: copy.hitl.statusRejected,
  };

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
          {LEVEL_FILTERS.map((level) => (
            <Button
              key={level}
              type="button"
              variant={levelFilter === level ? "default" : "ghost"}
              size="sm"
              onClick={() => setLevelFilter(level)}
            >
              {copy.levels[level]}
            </Button>
          ))}
          <Button
            type="button"
            variant={requiresApprovalOnly ? "default" : "ghost"}
            size="sm"
            onClick={() => setRequiresApprovalOnly((current) => !current)}
          >
            {copy.hitl.filterLabel}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.columns.timestamp}</TableHead>
              <TableHead>{copy.columns.service}</TableHead>
              <TableHead>{copy.columns.level}</TableHead>
              <TableHead>{copy.columns.message}</TableHead>
              <TableHead>{copy.columns.duration}</TableHead>
              <TableHead>{copy.columns.authorization}</TableHead>
              <TableHead>{copy.columns.trace}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground">{timeFormatter.format(new Date(log.timestamp))}</TableCell>
                <TableCell className="font-medium text-foreground">{log.service}</TableCell>
                <TableCell>
                  <Badge variant={LEVEL_BADGE_VARIANT[log.level]}>{copy.levels[log.level]}</Badge>
                </TableCell>
                <TableCell className="text-foreground">{log.message}</TableCell>
                <TableCell className="text-muted-foreground">{log.durationMs} ms</TableCell>
                <TableCell>
                  {log.approvalStatus ? (
                    <Badge variant={APPROVAL_BADGE_VARIANT[log.approvalStatus]}>
                      {approvalStatusLabel[log.approvalStatus]}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">{copy.hitl.none}</span>
                  )}
                </TableCell>
                <TableCell>
                  {traces[log.id] ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setSelectedLogId(log.id)}
                      aria-label={copy.trace.viewButtonLabel}
                    >
                      <Activity className="size-4" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">{copy.hitl.none}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExecutionTraceDialog
        open={selectedLogId !== null}
        onOpenChange={(open) => setSelectedLogId(open ? selectedLogId : null)}
        spans={selectedLogId ? traces[selectedLogId] ?? [] : []}
        copy={{
          dialogTitle: copy.trace.dialogTitle,
          totalDurationLabel: copy.trace.totalDurationLabel,
          spanLabels: copy.trace.spanLabels,
          expandLabel: copy.trace.expandLabel,
          collapseLabel: copy.trace.collapseLabel,
        }}
      />
    </div>
  );
}
