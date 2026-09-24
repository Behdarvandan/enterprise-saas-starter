"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isRtlLocale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/ui/primitives/dropdown-menu";

interface LocaleSwitcherProps {
  className?: string;
}

/** Short label shown on the trigger itself (never the full menu). */
const LOCALE_CODES: Record<(typeof routing.locales)[number], string> = {
  en: "EN",
  tr: "TR",
  de: "DE",
  fa: "FA",
};

/** Full name, written in the language's own script — never a bare code. */
const LOCALE_NAMES: Record<(typeof routing.locales)[number], string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  fa: "فارسی",
};

/**
 * Compact dropdown: globe + current locale code trigger, expanding to each
 * language's full native name (RTL-aware for فارسی). Replaces the old
 * two-way EN/TR toggle now that there are four locales.
 */
export default function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations("shell");
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-400 transition-colors outline-none hover:bg-slate-800/60 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60",
          className,
        )}
        aria-label={t("changeLanguage")}
      >
        <Globe aria-hidden size={15} />
        {LOCALE_CODES[locale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {routing.locales.map((candidate) => (
          <DropdownMenuItem
            key={candidate}
            dir={isRtlLocale(candidate) ? "rtl" : "ltr"}
            className={cn(
              "justify-between",
              candidate === locale && "font-semibold text-slate-100",
            )}
            onSelect={() => router.replace(pathname, { locale: candidate })}
          >
            {LOCALE_NAMES[candidate]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
