"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface HeaderProps {
  /** Opens the mobile navigation drawer. Only visible below `lg`. */
  onOpenMenu: () => void;
  /** Left side of the header, after the mobile menu button (e.g. search). */
  headerStart?: ReactNode;
  /** Right side of the header (status, notifications, language, user menu). */
  headerEnd?: ReactNode;
}

/** The authenticated portals' sticky glass top bar: mobile menu toggle plus the shell's header slots. */
export default function Header({ onOpenMenu, headerStart, headerEnd }: HeaderProps) {
  const t = useTranslations("shell");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t("openMenu")}
        className="-ms-1 flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-ring/60 lg:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>
      <div className="flex min-w-0 flex-1 items-center">{headerStart}</div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{headerEnd}</div>
    </header>
  );
}
