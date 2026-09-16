"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Bell, Search, User } from "lucide-react";
import SignOutButton from "@/components/auth/SignOutButton";
import ThemeToggle from "@/components/theme-toggle";
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";

interface TopbarProps {
  userEmail: string;
}

export default function Topbar({ userEmail }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(`/dashboard/chatbot?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-subtle bg-canvas/95 px-4 backdrop-blur sm:px-6">
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask the knowledge base…"
          aria-label="Search the knowledge base"
          className="w-full rounded-control border border-subtle bg-surface py-2 pl-9 pr-3 text-sm text-ink-primary outline-none transition-colors placeholder:text-ink-muted focus:border-violet-dim"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink-primary"
          >
            <Bell size={17} />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-control border border-subtle bg-surface-raised p-4 shadow-lg">
              <p className="text-sm font-medium text-ink-primary">Notifications</p>
              <p className="mt-1 text-xs text-ink-muted">
                No new notifications right now.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setUserOpen((v) => !v)}
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
      </div>
    </header>
  );
}
