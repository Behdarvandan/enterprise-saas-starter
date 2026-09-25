"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/primitives/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import type { MembershipRole } from "@/types";
import { removeMember, updateMemberRole } from "./actions";

export interface TeamMember {
  membershipId: string;
  userId: string;
  role: MembershipRole;
  email: string | null;
  fullName: string | null;
}

interface TeamMembersTableCopy {
  columns: { member: string; role: string; actions: string };
  unknownMember: string;
  you: string;
  remove: string;
  removeAria: (name: string) => string;
  roleAria: (name: string) => string;
  roles: { owner: string; admin: string; member: string };
}

export default function TeamMembersTable({
  members,
  viewerUserId,
  canManage,
  copy,
}: {
  members: TeamMember[];
  viewerUserId: string;
  canManage: boolean;
  copy: TeamMembersTableCopy;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRoleChange(membershipId: string, role: MembershipRole) {
    setPendingId(membershipId);
    startTransition(async () => {
      await updateMemberRole(membershipId, role);
      setPendingId(null);
    });
  }

  function handleRemove(membershipId: string, name: string) {
    if (!window.confirm(copy.removeAria(name))) return;
    setPendingId(membershipId);
    startTransition(async () => {
      await removeMember(membershipId);
      setPendingId(null);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{copy.columns.member}</TableHead>
            <TableHead>{copy.columns.role}</TableHead>
            {canManage ? <TableHead>{copy.columns.actions}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const name = member.fullName || member.email || copy.unknownMember;
            const isViewer = member.userId === viewerUserId;
            const canEditRow = canManage && member.role !== "owner" && !isViewer;

            return (
              <TableRow key={member.membershipId}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {name}
                      {isViewer ? <span className="text-muted-foreground"> {copy.you}</span> : null}
                    </span>
                    {member.email && member.fullName ? (
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {canEditRow ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleRoleChange(member.membershipId, value as MembershipRole)
                      }
                      disabled={pendingId === member.membershipId}
                    >
                      <SelectTrigger aria-label={copy.roleAria(name)} className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{copy.roles.admin}</SelectItem>
                        <SelectItem value="member">{copy.roles.member}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={member.role === "owner" ? "default" : "outline"}>
                      {copy.roles[member.role]}
                    </Badge>
                  )}
                </TableCell>
                {canManage ? (
                  <TableCell>
                    {member.role !== "owner" && !isViewer ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === member.membershipId}
                        onClick={() => handleRemove(member.membershipId, name)}
                        aria-label={copy.removeAria(name)}
                      >
                        {copy.remove}
                      </Button>
                    ) : null}
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
