import Link from "next/link";
import { Boxes } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Platform", href: "/#platform" },
  { label: "Security", href: "/#security" },
  { label: "Pricing", href: "/pricing" },
];

const ACCOUNT_LINKS = [
  { label: "Sign in", href: "/login" },
  { label: "Start free trial", href: "/signup" },
  { label: "System status", href: "/api/health" },
];

export default function Footer() {
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
            <p className="mt-3 max-w-xs text-sm text-ink-muted">
              Multi-tenant booking and scheduling infrastructure with
              row-level isolation for every organization.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-primary">Product</p>
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
            <p className="text-xs font-semibold text-ink-primary">Account</p>
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
            © {new Date().getFullYear()} Nimbus. Built on PostgreSQL row-level
            security.
          </p>
        </div>
      </div>
    </footer>
  );
}
