"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { isRtlLocale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSelectorProps {
  className?: string;
}

/** Short code shown on the trigger — text only, no flags or icons. */
const LOCALE_CODES: Record<(typeof routing.locales)[number], string> = {
  en: "EN",
  tr: "TR",
  de: "DE",
  fa: "FA",
};

/** Full name, written in the language's own script. */
const LOCALE_NAMES: Record<(typeof routing.locales)[number], string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  fa: "فارسی",
};

/**
 * Minimalist, text-only language dropdown (Vercel/Linear style — no flags,
 * no glyphs). The trigger is a bare locale code; the open menu is a
 * `.liquid-glass` panel listing each locale's native name.
 */
export default function LanguageSelector({ className }: LanguageSelectorProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex h-9 items-center rounded-control px-2.5 text-xs font-semibold tracking-wide text-zinc-400 transition-colors hover:text-zinc-100",
          className,
        )}
        aria-label="Change language"
      >
        {LOCALE_CODES[locale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="liquid-glass min-w-36 rounded-2xl p-1.5">
        {routing.locales.map((candidate) => (
          <DropdownMenuItem
            key={candidate}
            dir={isRtlLocale(candidate) ? "rtl" : "ltr"}
            className={cn(
              "justify-between rounded-lg text-sm text-zinc-400 focus:bg-white/5 focus:text-zinc-100",
              candidate === locale && "text-zinc-100",
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
