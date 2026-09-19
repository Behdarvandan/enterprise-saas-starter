import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/layout/Logo";

interface SidebarFrameProps {
  /** Where the logo links to (the portal's home). */
  homeHref: string;
  /** Line under the wordmark, e.g. the portal name. */
  subtitle?: string;
  /** Pinned under the logo — the tenant switcher on the dashboard. */
  top?: ReactNode;
  /** The navigation itself. */
  children: ReactNode;
  /** Pinned at the bottom — status, back links. */
  bottom?: ReactNode;
}

/** Shared sidebar chrome: brand, optional switcher, scrolling nav, pinned footer. */
export default function SidebarFrame({ homeHref, subtitle, top, children, bottom }: SidebarFrameProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link href={homeHref} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
          <Logo subtitle={subtitle} />
        </Link>
      </div>
      {top ? <div className="px-3 pb-3">{top}</div> : null}
      <div className="flex-1 overflow-y-auto px-3 py-2">{children}</div>
      {bottom ? <div className="border-t border-slate-800 p-3">{bottom}</div> : null}
    </div>
  );
}
