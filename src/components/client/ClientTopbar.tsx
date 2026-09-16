"use client";

import { useState } from "react";
import { User } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import ThemeToggle from "@/components/theme-toggle";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";

interface ClientTopbarProps {
  userEmail: string;
}

/**
 * Minimal top bar for the client portal — no knowledge-base search (that's
 * a dashboard/operator concept), just locale/theme controls and the
 * signed-in user menu, matching `Topbar`'s pattern for those pieces.
 */
export default function ClientTopbar({ userEmail }: ClientTopbarProps) {
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-2 border-b border-subtle bg-canvas/95 px-4 backdrop-blur sm:px-6">
      <LocaleSwitcher />
      <ThemeToggle />

      <div className="relative">
        <button
          type="button"
          onClick={() => setUserOpen((value) => !value)}
          aria-label="User menu"
          aria-expanded={userOpen}
          className="flex h-9 w-9 items-center justify-center rounded-control border border-subtle text-ink-muted transition-colors hover:text-ink-primary"
        >
          <User size={16} />
        </button>
        {userOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-control border border-subtle bg-surface-raised p-3 shadow-lg">
            <p className="truncate text-sm font-medium text-ink-primary">{userEmail}</p>
            <div className="mt-3 border-t border-subtle pt-3">
              <SignOutButton className="w-full" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
