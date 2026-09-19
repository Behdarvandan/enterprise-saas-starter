"use client";

import { Monitor, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";
import { LogoMark } from "@/components/layout/Logo";
import { getBrandingCssVars } from "@/lib/agency/branding";
import { cn } from "@/lib/utils";

interface TenantPreviewProps {
  title: string;
  /** A validated https logo URL, or null for the default mark. */
  logoUrl: string | null;
  /** A validated `#rrggbb` colour, or null for the platform violet. */
  color: string | null;
  domain: string | null;
  onLogoError: () => void;
}

/**
 * A miniature tenant dashboard rendered with the agency's palette applied as
 * scoped CSS variables — the same variables `getBrandingCssVars` sets on
 * `<html>` on the agency's domain. Only what really follows the brand
 * (primary actions, active nav, chat bubble) changes; metric values stay
 * violet, exactly as on the live dashboard.
 */
export default function TenantPreview({ title, logoUrl, color, domain, onLogoError }: TenantPreviewProps) {
  const t = useTranslations("agency.branding.preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const vars = getBrandingCssVars({ primary_color: color ?? undefined }) as CSSProperties;
  const name = title.trim() || t("brandFallback");
  const mobile = device === "mobile";

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-100">{t("title")}</h3>
        <div role="group" aria-label={t("device")} className="flex rounded-lg border border-slate-800 p-0.5">
          {(["desktop", "mobile"] as const).map((kind) => {
            const Icon = kind === "desktop" ? Monitor : Smartphone;
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={device === kind}
                aria-label={t(kind)}
                onClick={() => setDevice(kind)}
                className={cn(
                  "rounded-md p-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
                  device === kind ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-100",
                )}
              >
                <Icon aria-hidden className="size-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={vars}
        className={cn(
          "mx-auto w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition-[max-width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          mobile ? "max-w-[17rem]" : "max-w-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-1.5">
          <span aria-hidden className="flex gap-1">
            <span className="size-2 rounded-full bg-slate-700" />
            <span className="size-2 rounded-full bg-slate-700" />
            <span className="size-2 rounded-full bg-slate-700" />
          </span>
          <span dir="ltr" className="truncate rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">
            {domain ?? t("domainFallback")}
          </span>
        </div>

        <div className="flex">
          {mobile ? null : (
            <aside className="w-36 shrink-0 border-e border-slate-800 p-3">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  // Plain <img>: agency logos live on arbitrary hosts (see Logo.tsx).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" onError={onLogoError} className="h-6 w-auto max-w-20 object-contain" />
                ) : (
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <LogoMark className="size-3.5" />
                  </span>
                )}
                <span className="truncate text-xs font-semibold text-slate-100">{name}</span>
              </div>
              <ul className="mt-4 grid gap-1 text-[11px]">
                <li className="rounded-md bg-primary/15 px-2 py-1.5 font-medium text-slate-100">{t("navOverview")}</li>
                <li className="px-2 py-1.5 text-slate-400">{t("navKnowledge")}</li>
                <li className="px-2 py-1.5 text-slate-400">{t("navSkills")}</li>
              </ul>
            </aside>
          )}

          <div className="min-w-0 flex-1 space-y-3 p-3">
            {mobile ? (
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" onError={onLogoError} className="h-6 w-auto max-w-20 object-contain" />
                ) : (
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <LogoMark className="size-3.5" />
                  </span>
                )}
                <span className="truncate text-xs font-semibold text-slate-100">{name}</span>
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-[10px] text-slate-400">{t("metricLabel")}</p>
              <p dir="ltr" className="mt-1 text-start font-mono text-lg font-semibold text-violet-400">
                94.2%
              </p>
            </div>

            <div className="grid gap-1.5">
              <p className="max-w-[80%] rounded-2xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200">
                {t("chatAgent")}
              </p>
              <p className="ms-auto max-w-[80%] rounded-2xl bg-primary px-3 py-1.5 text-[11px] text-primary-foreground">
                {t("chatUser")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground">
                {t("button")}
              </span>
              <span className="rounded-lg border border-slate-700 px-3 py-1.5 text-[11px] text-slate-300">
                {t("buttonSecondary")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
