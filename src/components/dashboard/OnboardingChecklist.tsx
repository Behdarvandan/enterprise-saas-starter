"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  done: boolean;
}

interface OnboardingChecklistProps {
  userId: string;
  items: ChecklistItem[];
}

// Legacy key name kept so users who already dismissed the list don't see it again.
function storageKey(userId: string) {
  return `nimbus:onboarding-dismissed:${userId}`;
}

/**
 * First-login checklist for a new tenant admin. Dismissal lives in
 * localStorage per user — the schema has no onboarding-state column.
 */
export default function OnboardingChecklist({ userId, items }: OnboardingChecklistProps) {
  const t = useTranslations("dashboard.overview.checklist");
  // Start hidden so a previously dismissed list never flashes before hydration.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey(userId)) === "1");
    } catch (error) {
      console.warn("[onboarding] localStorage unavailable:", error);
      setDismissed(false);
    }
  }, [userId]);

  const remaining = items.filter((item) => !item.done).length;
  if (dismissed || remaining === 0) return null;

  function dismiss() {
    try {
      localStorage.setItem(storageKey(userId), "1");
    } catch (error) {
      // Dismissal simply won't persist across visits.
      console.warn("[onboarding] could not persist dismissal:", error);
    }
    setDismissed(true);
  }

  return (
    <LiquidCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("remaining", { count: remaining })}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("dismiss")}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  item.done
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "border border-border text-muted-foreground",
                )}
              >
                {item.done ? <Check className="size-3" /> : null}
              </span>
              <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </LiquidCard>
  );
}
