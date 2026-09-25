"use client";

import { useState, useTransition } from "react";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import { revokeInvitation } from "./actions";

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface PendingInvitationsTableCopy {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  columnEmail: string;
  columnRole: string;
  expires: (role: string, date: string) => string;
  revoke: string;
}

export default function PendingInvitationsTable({
  invitations,
  copy,
}: {
  invitations: PendingInvitation[];
  copy: PendingInvitationsTableCopy;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRevoke(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await revokeInvitation(id);
      setPendingId(null);
    });
  }

  return (
    <Card variant="section">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">{copy.emptyTitle}</p>
            <p className="text-sm text-muted-foreground">{copy.emptyDescription}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.columnEmail}</TableHead>
                  <TableHead>{copy.columnRole}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="text-foreground">{invitation.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {copy.expires(invitation.role, invitation.expiresAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === invitation.id}
                        onClick={() => handleRevoke(invitation.id)}
                      >
                        {copy.revoke}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
