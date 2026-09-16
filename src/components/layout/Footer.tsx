import { Boxes } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function Footer() {
  const tHeader = await getTranslations("marketing.header");
  const tFooter = await getTranslations("marketing.footer");

  // Reuses marketing.header's labels since the footer links to the same
  // destinations under the same names.
  const PRODUCT_LINKS = [
    { label: tHeader("platform"), href: "/#platform" },
    { label: tHeader("security"), href: "/#security" },
    { label: tHeader("pricing"), href: "/pricing" },
  ];

  const ACCOUNT_LINKS = [
    { label: tHeader("signIn"), href: "/login" },
    { label: tHeader("startTrial"), href: "/signup" },
    { label: tFooter("systemStatus"), href: "/api/health" },
  ];

  return (
    <footer className="border-t border-subtle bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-control bg-violet text-white">
                <Boxes size={17} />
              </div>
              <span className="text-sm font-semibold text-ink-primary">Nimbus</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-muted">{tFooter("tagline")}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-primary">{tFooter("productHeading")}</p>
            <ul className="mt-3 space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted transition-colors hover:text-ink-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-primary">{tFooter("accountHeading")}</p>
            <ul className="mt-3 space-y-2">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-muted transition-colors hover:text-ink-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-subtle pt-6">
          <p className="text-xs text-ink-muted">
            {tFooter("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
