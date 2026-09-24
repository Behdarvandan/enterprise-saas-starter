"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import type { AuditLogEntry } from "@/modules/audit-logs/types";

interface AuditLogTableProps {
  entries?: AuditLogEntry[];
}

export default function AuditLogTable({ entries = [] }: AuditLogTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-sm text-slate-400">
              No audit log entries yet.
            </TableCell>
          </TableRow>
        ) : (
          entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.action}</TableCell>
              <TableCell>{entry.resource ?? "—"}</TableCell>
              <TableCell>{entry.actorId ?? "—"}</TableCell>
              <TableCell>{entry.createdAt}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
