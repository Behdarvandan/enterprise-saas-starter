import { getTranslations } from "next-intl/server";
import Logo from "@/components/layout/Logo";
import SystemStatus from "@/components/marketing/SystemStatus";
import { Link } from "@/i18n/navigation";

// No /contact page: general questions go to this address only. Placeholder
// until a verified sending domain exists (see the Resend-sandbox caveat in
// src/lib/email.ts).
const CONTACT_EMAIL = "hello@pasargad.com";

interface FooterLink {
  href: string;
  label: string;
}

/**
 * Marketing footer. Legal/docs links are deliberately absent: those pages do
 * not exist yet, and a footer link to a 404 costs more trust than it earns.
 */
export default async function Footer() {
  const t = await getTranslations("marketing.landing.footer");

  const columns: { heading: string; links: FooterLink[] }[] = [
    {
      heading: t("product"),
      links: [
        { href: "/#capabilities", label: t("links.capabilities") },
        { href: "/#pricing", label: t("links.pricing") },
        { href: "/saas", label: t("links.saas") },
        { href: "/services", label: t("links.services") },
      ],
    },
    {
      heading: t("agencies"),
      links: [
        { href: "/#agency", label: t("links.whiteLabel") },
        { href: "/agency", label: t("links.agencyPortal") },
        { href: "/services#quote", label: t("links.agencyApply") },
      ],
    },
    {
      heading: t("account"),
      links: [
        { href: "/login", label: t("links.signIn") },
        { href: "/signup", label: t("links.signUp") },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="inline-block rounded-lg focus-visible:ring-2 focus-visible:ring-ring/60">
              <Logo />
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">{t("tagline")}</p>
            <div className="mt-5">
              <SystemStatus />
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/80">
                {column.heading}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{t("copyright", { year: new Date().getFullYear() })}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
