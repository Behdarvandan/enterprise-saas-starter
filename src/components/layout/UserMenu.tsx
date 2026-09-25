"use client";

import { useTranslations } from "next-intl";
import SignOutButton from "@/components/auth/SignOutButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/core/ui/primitives/popover";

interface UserMenuProps {
  email: string;
}

export default function UserMenu({ email }: UserMenuProps) {
  const t = useTranslations("shell");

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("userMenu")}
        className="flex size-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/50 text-xs font-semibold text-primary transition-colors outline-none hover:border-slate-700 focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {(email.charAt(0) || "?").toUpperCase()}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-xs text-slate-400">{t("signedInAs")}</p>
        <p dir="ltr" className="mt-0.5 truncate text-start text-sm font-medium text-slate-100">
          {email}
        </p>
        <div className="mt-3 border-t border-slate-800 pt-3">
          <SignOutButton className="w-full" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
