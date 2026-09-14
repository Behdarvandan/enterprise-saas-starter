"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

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

function storageKey(userId: string) {
  return `nimbus:onboarding-dismissed:${userId}`;
}

/**
 * First-login checklist for a new tenant admin. Dismissal is stored in
 * localStorage per user — there's no onboarding-state column in the schema,
 * and adding one is out of scope for a presentation-layer pass.
 */
export default function OnboardingChecklist({ userId, items }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey(userId)) === "1");
    } catch {
      setDismissed(false);
    }
  }, [userId]);

  const remaining = items.filter((item) => !item.done).length;

  if (dismissed || remaining === 0) return null;

  function dismiss() {
    try {
      localStorage.setItem(storageKey(userId), "1");
    } catch {
      // Private browsing or storage disabled — dismissal just won't persist.
    }
    setDismissed(true);
  }

  return (
    <div className="border border-subtle bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-primary">
            Finish setting up your organization
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {remaining} step{remaining === 1 ? "" : "s"} left before you&apos;re fully live.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss setup checklist"
          className="shrink-0 rounded-control p-1.5 text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink-primary"
        >
          <X size={16} />
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-control border border-subtle bg-surface-raised px-3 py-2.5 text-sm transition-colors hover:border-violet-dim/60"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  item.done ? "bg-status-success/15 text-status-success" : "border border-subtle text-ink-muted"
                }`}
              >
                {item.done && <Check size={12} />}
              </span>
              <span className={item.done ? "text-ink-muted line-through" : "text-ink-primary"}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
