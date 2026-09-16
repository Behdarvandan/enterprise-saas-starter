"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MembershipRole } from "@/types";
import { removeMember, updateMemberRole } from "./actions";

interface MemberRowProps {
  membershipId: string;
  email: string;
  name: string | null;
  role: MembershipRole;
  isCurrentUser: boolean;
  canManage: boolean;
}

const roleStyles: Record<MembershipRole, string> = {
  owner: "bg-violet/15 text-violet-dim",
  admin: "bg-violet/10 text-violet-dim",
  member: "bg-surface-raised text-ink-muted",
};

export default function MemberRow({
  membershipId,
  email,
  name,
  role,
  isCurrentUser,
  canManage,
}: MemberRowProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const isOwner = role === "owner";
  const showActions = canManage && !isOwner;

  async function handleRoleChange(nextRole: MembershipRole) {
    setError(null);
    const result = await updateMemberRole(membershipId, nextRole);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleRemove() {
    setError(null);
    const result = await removeMember(membershipId);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink-primary">
          {name ?? email}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-ink-muted">(you)</span>
          )}
        </p>
        <p className="truncate text-xs text-ink-muted">{email}</p>
      </div>

      <div className="flex items-center gap-3">
        {showActions ? (
          <select
            value={role}
            onChange={(event) =>
              handleRoleChange(event.target.value as MembershipRole)
            }
            className="rounded-control border border-subtle bg-surface-raised px-2 py-1.5 text-xs text-ink-primary outline-none transition-colors focus:border-violet-dim"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span
            className={`rounded-control px-2.5 py-1 text-xs font-semibold capitalize ${roleStyles[role]}`}
          >
            {role}
          </span>
        )}

        {showActions && !isCurrentUser && (
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-control px-2 py-1.5 text-xs font-semibold text-status-error transition-colors hover:bg-status-error/10"
          >
            Remove
          </button>
        )}
      </div>

      {error && <p className="text-xs font-medium text-status-error">{error}</p>}
    </li>
  );
}
