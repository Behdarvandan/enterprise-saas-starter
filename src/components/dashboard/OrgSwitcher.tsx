"use client";

import { useState } from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import type { UserOrganization } from "@/lib/team";

interface OrgSwitcherProps {
  organizations: UserOrganization[];
  activeOrganizationId: string;
}

/**
 * Multi-tenant org switcher. Every user currently resolves to exactly one
 * membership, so this renders as a static label with the picker affordance
 * in place — it activates the moment a user belongs to a second
 * organization, without any further UI work.
 */
export default function OrgSwitcher({
  organizations,
  activeOrganizationId,
}: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const active =
    organizations.find((org) => org.organizationId === activeOrganizationId) ??
    organizations[0];

  if (!active) return null;

  return (
    <div className="relative border-b border-subtle px-3 py-3">
      <button
        type="button"
        onClick={() => organizations.length > 1 && setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-control border border-subtle bg-surface-raised px-3 py-2 text-left transition-colors hover:border-violet-dim/60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-violet/15 text-violet-dim">
          <Building2 size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-primary">
            {active.organizationName}
          </p>
          <p className="text-xs capitalize text-ink-muted">{active.role}</p>
        </div>
        {organizations.length > 1 && (
          <ChevronsUpDown size={14} className="shrink-0 text-ink-muted" />
        )}
      </button>

      {open && organizations.length > 1 && (
        <ul
          role="listbox"
          className="absolute left-3 right-3 top-full z-20 mt-1 rounded-control border border-subtle bg-surface-raised py-1 shadow-lg"
        >
          {organizations.map((org) => (
            <li key={org.organizationId}>
              <button
                type="button"
                role="option"
                aria-selected={org.organizationId === activeOrganizationId}
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink-primary hover:bg-subtle/40"
              >
                {org.organizationName}
                {org.organizationId === activeOrganizationId && (
                  <Check size={14} className="text-violet-dim" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
