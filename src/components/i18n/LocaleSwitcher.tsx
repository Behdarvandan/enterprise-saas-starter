"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  className?: string;
}

const LOCALE_LABELS: Record<(typeof routing.locales)[number], string> = {
  en: "EN",
  tr: "TR",
};

/** Two-locale toggle: switches to the other supported locale, same path. */
export default function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const nextLocale = routing.locales.find((candidate) => candidate !== locale) ?? locale;

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      aria-label={`Switch to ${LOCALE_LABELS[nextLocale]}`}
      title={`Switch to ${LOCALE_LABELS[nextLocale]}`}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-control text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-raised hover:text-ink-primary",
        className,
      )}
    >
      {LOCALE_LABELS[nextLocale]}
    </button>
  );
}
