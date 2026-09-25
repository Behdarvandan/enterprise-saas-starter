"use client";

import { ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Spinner } from "@/core/ui/primitives/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/core/ui/primitives/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import type { UserOrganization } from "@/lib/team";
import { toast } from "@/lib/toast";

interface TenantSwitcherProps {
  organizations: UserOrganization[];
  activeOrganizationId: string;
  /**
   * Persists the switch (e.g. a server action) and is awaited before the
   * router refreshes. Core has no knowledge of *how* a switch is persisted —
   * the caller supplies it. An `{ error }` result surfaces as a toast
   * instead of refreshing.
   */
  onSwitch: (organizationId: string) => Promise<{ error?: string } | void>;
}

/**
 * Active-organization badge + quick tenant switcher. The trigger always shows
 * who you are acting as; the menu (radio group: arrow keys, typeahead, Esc)
 * only opens when there is somewhere else to switch to.
 */
export default function TenantSwitcher({ organizations, activeOrganizationId, onSwitch }: TenantSwitcherProps) {
  const t = useTranslations("shell");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const nameOf = (org: UserOrganization) => org.organizationName ?? t("organization.untitled");
  const active = organizations.find((org) => org.organizationId === activeOrganizationId);
  const activeName = active ? nameOf(active) : t("organization.untitled");
  const canSwitch = organizations.length > 1;

  function handleChange(organizationId: string) {
    if (organizationId === activeOrganizationId) return;
    startTransition(async () => {
      const result = await onSwitch(organizationId);
      if (result?.error) {
        toast({ tone: "error", title: t("organization.switchFailed"), description: result.error });
        return;
      }
      router.refresh();
    });
  }

  const badge = (
    <>
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary"
      >
        {activeName.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span className="block truncate text-sm font-medium text-slate-100">{activeName}</span>
        {active ? (
          <span className="block truncate text-xs text-slate-400">{t(`roles.${active.role}`)}</span>
        ) : null}
      </span>
    </>
  );

  const triggerClass =
    "flex w-full items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/50 p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60";

  if (!canSwitch) {
    return (
      <div className={triggerClass} aria-label={t("organization.active")}>
        {badge}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("organization.switch")}
        className={`${triggerClass} hover:border-slate-700 hover:bg-slate-900`}
      >
        {badge}
        {pending ? (
          <Spinner className="text-slate-400" />
        ) : (
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-slate-500" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>{t("organization.label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={activeOrganizationId} onValueChange={handleChange}>
          {organizations.map((org) => (
            <DropdownMenuRadioItem
              key={org.organizationId}
              value={org.organizationId}
              className="justify-between gap-2"
            >
              <span className="truncate">{nameOf(org)}</span>
              <span className="shrink-0 text-xs text-slate-400">{t(`roles.${org.role}`)}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
