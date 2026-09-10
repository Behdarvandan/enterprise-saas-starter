import Link from "next/link";
import { Boxes } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md">
            <Boxes size={20} />
          </div>
          <span>
            Nimbus<span className="text-brand-600">SaaS</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="transition-colors hover:text-brand-600">
            Home
          </Link>
          <Link
            href="/dashboard"
            className="transition-colors hover:text-brand-600"
          >
            Dashboard
          </Link>
          <Link href="/login" className="transition-colors hover:text-brand-600">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
