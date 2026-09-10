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
  owner: "bg-brand-100 text-brand-700",
  admin: "bg-violet-100 text-violet-700",
  member: "bg-slate-100 text-slate-700",
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
        <p className="truncate text-sm font-medium text-slate-800">
          {name ?? email}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-slate-400">(you)</span>
          )}
        </p>
        <p className="truncate text-xs text-slate-500">{email}</p>
      </div>

      <div className="flex items-center gap-3">
        {showActions ? (
          <select
            value={role}
            onChange={(event) =>
              handleRoleChange(event.target.value as MembershipRole)
            }
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleStyles[role]}`}
          >
            {role}
          </span>
        )}

        {showActions && !isCurrentUser && (
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </li>
  );
}
