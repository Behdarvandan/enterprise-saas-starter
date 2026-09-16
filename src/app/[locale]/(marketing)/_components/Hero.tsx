import Link from "next/link";
import DashboardPreview from "./DashboardPreview";

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div
          className="animate-reveal-up"
          style={{ animationDelay: "0ms" }}
        >
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-ink-primary sm:text-5xl">
            Booking infrastructure that keeps every organization&apos;s data
            provably separate.
          </h1>
          <p
            className="mt-5 animate-reveal-up text-lg text-ink-muted"
            style={{ animationDelay: "80ms" }}
          >
            Nimbus runs scheduling, payments, and an AI assistant for
            multi-tenant teams on PostgreSQL row-level security — a database
            trigger blocks double-bookings before they&apos;re written, not after.
          </p>

          <div
            className="mt-8 flex flex-wrap items-center gap-3 animate-reveal-up"
            style={{ animationDelay: "160ms" }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-interactive bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet/90"
            >
              Start free trial
            </Link>
            <Link
              href="/pricing#enterprise"
              className="inline-flex items-center gap-2 rounded-interactive border border-subtle px-5 py-2.5 text-sm font-semibold text-ink-primary transition-colors hover:border-violet-dim/60"
            >
              Book a demo
            </Link>
          </div>
        </div>

        <div className="animate-reveal-up" style={{ animationDelay: "220ms" }}>
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
