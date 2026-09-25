"use client";

import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface ShellNavItem<TLabelKey extends string = string> {
  labelKey: TLabelKey;
  href: string;
  icon: LucideIcon;
}

export interface ShellNavGroup<
  TItemLabelKey extends string = string,
  TGroupLabelKey extends string = string,
> {
  /** Omitted for the ungrouped lead section. */
  labelKey?: TGroupLabelKey;
  items: ShellNavItem<TItemLabelKey>[];
}

/**
 * The single nav entry that owns `pathname`: the longest href that equals it
 * or is a path-segment prefix of it. Longest-match means a nested route
 * highlights its own entry rather than also lighting up its parent's.
 */
export function resolveActiveHref(pathname: string, hrefs: readonly string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

interface SidebarProps<TItemLabelKey extends string, TGroupLabelKey extends string> {
  /** Where the logo links to (the portal's home). */
  homeHref: string;
  /** Brand mark rendered at the top of the sidebar (core has no knowledge of the app's Logo component). */
  logo: ReactNode;
  /** Pinned under the logo — the tenant switcher on the dashboard. */
  top?: ReactNode;
  /** Grouped, config-driven navigation. */
  groups: ShellNavGroup<TItemLabelKey, TGroupLabelKey>[];
  /** Accessible name for the nav landmark, e.g. "Dashboard navigation". */
  label: string;
  /** Pinned at the bottom — status, back links. */
  bottom?: ReactNode;
}

/** The one dynamic sidebar: brand + optional switcher, grouped config-driven nav, pinned footer. Reused by every portal. */
export default function Sidebar<TItemLabelKey extends string, TGroupLabelKey extends string>({
  homeHref,
  logo,
  top,
  groups,
  label,
  bottom,
}: SidebarProps<TItemLabelKey, TGroupLabelKey>) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const activeHref = resolveActiveHref(
    pathname,
    groups.flatMap((group) => group.items.map((item) => item.href)),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link href={homeHref} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
          {logo}
        </Link>
      </div>
      {top ? <div className="px-3 pb-3">{top}</div> : null}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <nav aria-label={label} className="flex flex-col gap-5">
          {groups.map((group, index) => (
            <div key={group.labelKey ?? `group-${index}`} className="flex flex-col gap-0.5">
              {group.labelKey ? (
                <p className="px-3 pb-1 text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                  {/* `labelKey` is generic here — core doesn't know the app's
                      message-key domain by design. The concrete keys are
                      still authored as literal unions in nav-config.ts. */}
                  {t(`groups.${group.labelKey}` as Parameters<typeof t>[0])}
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
                        ? "bg-slate-800/70 text-slate-100 before:absolute before:inset-y-2 before:start-0 before:w-0.5 before:rounded-full before:bg-primary"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                    )}
                  >
                    <item.icon
                      aria-hidden
                      className={cn("size-4 shrink-0", active ? "text-primary" : "text-slate-500")}
                    />
                    <span className="truncate">{t(`nav.${item.labelKey}` as Parameters<typeof t>[0])}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
      {bottom ? <div className="border-t border-slate-800 p-3">{bottom}</div> : null}
    </div>
  );
}
