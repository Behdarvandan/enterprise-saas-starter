"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import { NativeSelect } from "@/core/ui/primitives/native-select";
import { useRouter } from "@/i18n/navigation";
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

const roleTone: Record<MembershipRole, BadgeTone> = {
  owner: "violet",
  admin: "violet",
  member: "neutral",
};

const ASSIGNABLE_ROLES: readonly MembershipRole[] = ["admin", "member"];

function isAssignableRole(value: string): value is MembershipRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

export default function MemberRow({
  membershipId,
  email,
  name,
  role,
  isCurrentUser,
  canManage,
}: MemberRowProps) {
  const t = useTranslations("dashboard.team");
  const tRoles = useTranslations("shell.roles");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const isOwner = role === "owner";
  const showActions = canManage && !isOwner;
  const displayName = name ?? email;

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
        <p className="truncate text-sm font-medium text-foreground">
          {displayName}
          {isCurrentUser ? <span className="ms-2 text-xs text-muted-foreground">{t("you")}</span> : null}
        </p>
        <p dir="ltr" className="truncate text-start text-xs text-muted-foreground">
          {email}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {showActions ? (
          <NativeSelect
            value={role}
            aria-label={t("roleAria", { name: displayName })}
            className="h-8 text-xs"
            onChange={(event) => {
              const { value } = event.target;
              if (isAssignableRole(value)) void handleRoleChange(value);
            }}
          >
            <option value="member">{tRoles("member")}</option>
            <option value="admin">{tRoles("admin")}</option>
          </NativeSelect>
        ) : (
          <Badge tone={roleTone[role]}>{tRoles(role)}</Badge>
        )}

        {showActions && !isCurrentUser ? (
          <button
            type="button"
            onClick={handleRemove}
            aria-label={t("removeAria", { name: displayName })}
            className="rounded-md px-2 py-1.5 text-xs font-medium text-status-error transition-colors hover:bg-red-400/10 focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {t("remove")}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-status-error">
          {error}
        </p>
      ) : null}
    </li>
  );
}
