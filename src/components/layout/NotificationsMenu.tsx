"use client";

import { Bell, Lightbulb } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/ui/primitives/popover";
import { Link } from "@/i18n/navigation";
import { parseRecommendation } from "@/lib/dev-crew/recommendation";
import type { CrewInsight } from "@/types";

const SEEN_KEY = "pasargad:crew-seen";

interface NotificationsMenuProps {
  /** Newest first. */
  items: CrewInsight[];
}

/** Bell with the latest Dev Crew recommendations; the dot clears once the menu has been opened. */
export default function NotificationsMenu({ items }: NotificationsMenuProps) {
  const t = useTranslations("shell.notifications");
  const format = useFormatter();
  const latest = items[0]?.createdAt ?? null;
  const [seen, setSeen] = useState<string | null>(null);
  // Fixed reference time: keeps relative labels stable across re-renders.
  const [now] = useState(() => new Date());

  useEffect(() => {
    try {
      setSeen(window.localStorage.getItem(SEEN_KEY));
    } catch (error) {
      // Storage can be blocked (private mode); the dot then simply persists.
      console.warn("[notifications] localStorage unavailable:", error);
    }
  }, []);

  const unread = latest !== null && latest !== seen;

  function markSeen(open: boolean) {
    if (!open || !latest) return;
    setSeen(latest);
    try {
      window.localStorage.setItem(SEEN_KEY, latest);
    } catch (error) {
      console.warn("[notifications] could not persist seen marker:", error);
    }
  }

  return (
    <Popover onOpenChange={markSeen}>
      <PopoverTrigger
        aria-label={unread ? t("labelUnread") : t("label")}
        className="relative flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors outline-none hover:bg-slate-800/60 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <Bell aria-hidden className="size-4" />
        {unread ? (
          <span aria-hidden className="absolute end-2 top-2 size-2 rounded-full bg-violet-500 ring-2 ring-slate-950" />
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">
          {t("title")}
        </p>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">{t("empty")}</p>
        ) : (
          <ul className="max-h-80 divide-y divide-slate-800 overflow-y-auto">
            {items.map((item) => {
              const parsed = parseRecommendation(item.recommendation);
              return (
                <li key={item.id} className="flex gap-3 px-4 py-3">
                  <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-violet-400" />
                  <div className="min-w-0">
                    <p className="line-clamp-3 text-sm text-slate-200">{parsed.advice ?? parsed.raw}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {format.relativeTime(new Date(item.createdAt), now)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-slate-800 p-2">
          <Link
            href="/dashboard/crew-insights"
            className="block rounded-md px-2 py-1.5 text-center text-sm font-medium text-violet-300 transition-colors hover:bg-slate-800/60"
          >
            {t("viewAll")}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
