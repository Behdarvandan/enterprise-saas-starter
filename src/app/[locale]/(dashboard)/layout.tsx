import type { ReactNode } from "react";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";
import AppEngineSidebar from "@/components/layout/AppEngineSidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/**
 * Shell for the planned App Engine routes (`.context/ARCHITECTURE.md` §9:
 * `/app`, `/app/agents`, `/app/knowledge`, …) — a route group, so it adds no
 * URL segment of its own. Separate from the legacy `dashboard/layout.tsx`
 * (dark slate `AppShell`, tenant/org chrome): this is the Pasargad-token
 * shell (Paper/Ink/Firuzeh, hairline borders, flat surfaces) that the new
 * IA renders inside as its pages ship.
 */
export default function AppEngineLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 h-screen shrink-0">
        <AppEngineSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border bg-background/95 px-4 backdrop-blur-sm">
          <LocaleSwitcher />
          <ThemeToggle />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
