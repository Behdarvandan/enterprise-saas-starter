"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { resolveActiveHref, type ShellNavGroup } from "@/components/layout/nav-config";

interface ShellNavProps {
  groups: ShellNavGroup[];
  /** Accessible name for the landmark, e.g. "Dashboard navigation". */
  label: string;
}

/** Grouped, config-driven sidebar navigation with a single active entry. */
export default function ShellNav({ groups, label }: ShellNavProps) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const activeHref = resolveActiveHref(
    pathname,
    groups.flatMap((group) => group.items.map((item) => item.href)),
  );

  return (
    <nav aria-label={label} className="flex flex-col gap-5">
      {groups.map((group, index) => (
        <div key={group.labelKey ?? `group-${index}`} className="flex flex-col gap-0.5">
          {group.labelKey ? (
            <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
              {t(`groups.${group.labelKey}`)}
            </p>
          ) : null}
          {group.items.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  active
                    ? "bg-slate-800/70 text-slate-100 before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-full before:bg-violet-500"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                )}
              >
                <item.icon
                  aria-hidden
                  className={cn("size-4 shrink-0", active ? "text-violet-400" : "text-slate-500")}
                />
                <span className="truncate">{t(`nav.${item.labelKey}`)}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
