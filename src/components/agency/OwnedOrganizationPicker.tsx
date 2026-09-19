"use client";

import { Building2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { LinkableOrganization } from "@/lib/agency/linkable";
import { cn } from "@/lib/utils";

interface OwnedOrganizationPickerProps {
  organizations: LinkableOrganization[];
  value: string | null;
  onChange: (organizationId: string) => void;
  disabled?: boolean;
}

/** Searchable single-choice list of the organizations the caller may link (radio semantics). */
export default function OwnedOrganizationPicker({
  organizations,
  value,
  onChange,
  disabled,
}: OwnedOrganizationPickerProps) {
  const t = useTranslations("agency.tenants.picker");
  const groupName = useId();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? organizations.filter((org) => `${org.name} ${org.slug}`.toLowerCase().includes(needle))
      : organizations;
  }, [organizations, query]);

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center">
        <Building2 aria-hidden className="size-6 text-slate-500" />
        <p className="text-sm font-medium text-slate-100">{t("emptyTitle")}</p>
        <p className="max-w-sm text-xs text-slate-400">{t("emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className="ps-9"
        />
      </div>

      <div role="radiogroup" aria-label={t("label")} className="max-h-56 overflow-y-auto rounded-lg border border-slate-800">
        {visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-slate-400">{t("noMatches")}</p>
        ) : (
          visible.map((org) => {
            const selected = value === org.id;
            return (
              <label
                key={org.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border-b border-slate-800 px-3 py-2.5 transition-colors last:border-0 focus-within:bg-slate-800/60",
                  selected ? "bg-violet-500/10" : "hover:bg-slate-800/40",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name={groupName}
                  value={org.id}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => onChange(org.id)}
                  className="size-4 accent-violet-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-100">{org.name}</span>
                  <span dir="ltr" className="block truncate text-start font-mono text-xs text-slate-400">
                    {org.slug}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
