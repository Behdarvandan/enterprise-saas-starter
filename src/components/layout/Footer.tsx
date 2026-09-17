import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/layout/Logo";

export default async function Footer() {
  const tHeader = await getTranslations("marketing.header");
  const tFooter = await getTranslations("marketing.footer");

  // Reuses marketing.header's labels since the footer links to the same
  // destinations under the same names.
  const PRODUCT_LINKS = [
    { label: tHeader("platform"), href: "/#platform" },
    { label: tHeader("security"), href: "/#security" },
    { label: tHeader("pricing"), href: "/pricing" },
    { label: tHeader("saas"), href: "/saas" },
    { label: tHeader("services"), href: "/services" },
  ];

  // No /contact page — brief §4/§4.6: general questions go to a footer
  // email link only. Placeholder address until a verified sending domain
  // is configured (see the Resend-sandbox caveat in src/lib/email.ts).
  const CONTACT_EMAIL = "hello@pasargad.com";

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
            <Link href="/">
              <Logo />
            </Link>
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

        <div className="mt-10 flex flex-col gap-3 border-t border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            {tFooter("copyright", { year: new Date().getFullYear() })}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-xs font-medium text-ink-muted transition-colors hover:text-ink-primary"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
