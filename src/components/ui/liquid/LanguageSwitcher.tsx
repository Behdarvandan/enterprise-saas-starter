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
import { LiquidButton } from "@/components/ui/liquid/LiquidButton";

interface LanguageSwitcherProps {
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
 * Liquid Glass restyle of the language switcher — reuses the exact
 * navigation logic of `@/components/i18n/LocaleSwitcher` (same hooks, same
 * `router.replace` locale switch, same RTL-aware menu items) so behavior
 * isn't duplicated, only the trigger's material changes.
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations("shell");
  const pathname = usePathname();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <LiquidButton
          type="button"
          size="sm"
          className={cn("gap-1.5 rounded-full font-semibold", className)}
          aria-label={t("changeLanguage")}
        >
          <Globe aria-hidden size={15} />
          {LOCALE_CODES[locale]}
        </LiquidButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {routing.locales.map((candidate) => (
          <DropdownMenuItem
            key={candidate}
            dir={isRtlLocale(candidate) ? "rtl" : "ltr"}
            className={cn(
              "justify-between",
              candidate === locale && "font-semibold text-foreground",
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
