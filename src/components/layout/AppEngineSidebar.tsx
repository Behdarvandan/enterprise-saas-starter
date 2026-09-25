"use client";

import {
  ArrowLeft,
  BookOpen,
  Bot,
  CreditCard,
  LayoutDashboard,
  type LucideIcon,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { resolveActiveHref } from "@/core/ui/shell/Sidebar";
import { Button } from "@/core/ui/primitives/button";
import { cn } from "@/lib/utils";
import Logo from "@/components/layout/Logo";

interface AppEngineNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface AppEngineNavGroup {
  label: string;
  items: AppEngineNavItem[];
}

/** Planned App Engine routes (`.context/ARCHITECTURE.md` §9) — pages land per-route as each module ships. */
const NAV_GROUPS: AppEngineNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/app", icon: LayoutDashboard },
      { label: "Agents", href: "/app/agents", icon: Bot },
      { label: "Knowledge", href: "/app/knowledge", icon: BookOpen },
      { label: "Workflows", href: "/app/workflows", icon: Workflow },
      { label: "Logs", href: "/app/logs", icon: ScrollText },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "White-label", href: "/app/white-label", icon: Palette },
      { label: "Settings", href: "/app/settings", icon: Settings },
      { label: "Billing", href: "/app/billing", icon: CreditCard },
    ],
  },
];

const COLLAPSE_STORAGE_KEY = "pasargad-app-sidebar-collapsed";

/**
 * Collapsible rail for the new App Engine shell — a separate surface from the
 * legacy `DashboardSidebar`/`AppShell` (dark slate, fixed width), styled
 * instead on the Pasargad tokens: hairline border, flat surface, no shadow.
 */
export default function AppEngineSidebar() {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true");
    } catch {
      // Private browsing / blocked storage — default to expanded.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // Best-effort persistence only.
      }
      return next;
    });
  }

  const activeHref = resolveActiveHref(
    pathname,
    NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href)),
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col border-e border-border/40 bg-card/60 backdrop-blur-md transition-[width] duration-150 ease-out",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 gap-3 p-4",
          collapsed ? "flex-col items-center" : "items-center justify-between",
        )}
      >
        <Link
          href="/"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {collapsed ? <Logo variant="mark" size={24} /> : <Logo variant="horizontal" size={20} />}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden size={16} className="rtl:-scale-x-100" />
          ) : (
            <PanelLeftClose aria-hidden size={16} className="rtl:-scale-x-100" />
          )}
        </Button>
      </div>

      <nav aria-label="App Engine navigation" className="flex-1 overflow-y-auto px-2 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5 pb-4">
            {!collapsed ? (
              <p className="px-2.5 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon aria-hidden size={16} className={cn("shrink-0", active && "text-primary")} />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border/40 p-2">
        <Link
          href="/"
          title={collapsed ? t("landingPage") : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            collapsed && "justify-center px-0",
          )}
        >
          <ArrowLeft aria-hidden size={16} className="shrink-0 rtl:rotate-180" />
          {!collapsed ? <span className="truncate">{t("landingPage")}</span> : null}
        </Link>
      </div>
    </div>
  );
}
