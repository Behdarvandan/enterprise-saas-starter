"use client";

import { useAgencyBranding } from "@/components/providers/agency-branding-provider";
import { cn } from "@/lib/utils";

/**
 * Abstract circular/dotted motif referenced in the brand brief §1.3 —
 * concentric circles + four cardinal dots, echoing the Simurgh emblem's
 * border pattern without depicting the bird itself. Monochrome, inherits
 * `currentColor` so it can sit on any accent-colored surface.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="13.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="3.5" r="1.75" fill="currentColor" />
      <circle cx="16" cy="28.5" r="1.75" fill="currentColor" />
      <circle cx="3.5" cy="16" r="1.75" fill="currentColor" />
      <circle cx="28.5" cy="16" r="1.75" fill="currentColor" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Optional line rendered under the wordmark (e.g. "Admin", "Client portal"). */
  subtitle?: string;
  /**
   * Drops the icon badge for a pure typographic wordmark on the default
   * (non-white-labelled) mark — used by the marketing header's floating
   * capsule nav, where a plain "Pasargad" reads cleaner than icon + text.
   * Has no effect on the white-label branch: an agency's custom logo_url
   * image still renders exactly as it does everywhere else.
   */
  iconless?: boolean;
}

/**
 * Shared wordmark + motif — replaces the old per-file "Nimbus" markup. On an
 * agency's custom domain (see AgencyBrandingProvider) it shows the agency's
 * own logo/title instead; everywhere else it is the default Pasargad mark.
 */
export default function Logo({ className, subtitle, iconless = false }: LogoProps) {
  const branding = useAgencyBranding();
  const logoUrl = branding?.logo_url;
  // A white-labelled logo must never sit next to the "Pasargad" wordmark: with
  // a logo but no title, the logo stands alone.
  const name = branding?.title ?? (logoUrl ? null : "Pasargad");

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {logoUrl ? (
        // Plain <img>: agency logos are hosted on arbitrary domains, which
        // next/image's build-time remotePatterns allowlist can't enumerate.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={branding?.title ?? ""}
          className="h-8 w-auto max-w-32 shrink-0 object-contain"
        />
      ) : iconless ? null : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-zinc-950/50">
          <LogoMark className="h-4 w-4" />
        </div>
      )}
      {name || subtitle ? (
        <div>
          {name ? (
            <span
              className={cn(
                "block font-semibold tracking-tight text-slate-100",
                iconless && !logoUrl ? "text-2xl font-bold" : "text-sm",
              )}
            >
              {name}
            </span>
          ) : null}
          {subtitle ? <span className="block text-xs text-slate-400">{subtitle}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
