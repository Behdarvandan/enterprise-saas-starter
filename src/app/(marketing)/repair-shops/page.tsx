import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";

const STEPS = [
  {
    icon: CalendarCheck,
    step: "1",
    title: "Customer books online",
    body: "They pick a service and an open time slot from your real-time availability — no phone tag, no back-and-forth.",
  },
  {
    icon: Smartphone,
    step: "2",
    title: "Describes device & issue",
    body: "A short form captures the device model and a free-text description of the problem before they ever walk in.",
  },
  {
    icon: MessageSquareText,
    step: "3",
    title: "Shop gets full context",
    body: "Your technician opens the appointment already knowing what device is coming in and what's wrong with it.",
  },
];

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Public booking widget",
    body: "A hosted booking page for your services — screen replacements, diagnostics, battery swaps — with live availability and automatic slot durations.",
  },
  {
    icon: MessageSquareText,
    title: "AI pre-diagnosis chat",
    body: "An embeddable assistant that helps customers describe their issue before booking, and can answer common repair FAQs pulled from your shop's own knowledge base.",
  },
  {
    icon: Users,
    title: "Built to grow with you",
    body: "The same multi-tenant foundation that runs one shop today can separate multiple locations or teams later — each with its own isolated bookings and data.",
  },
  {
    icon: Wallet,
    title: "Stripe-ready deposits",
    body: "Take a deposit at booking time through Stripe Checkout, or skip payment entirely for free consultations — both paths are wired in.",
  },
];

export default function RepairShopsLandingPage() {
  return (
    <div>
      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="animate-reveal-up" style={{ animationDelay: "0ms" }}>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-ink-primary sm:text-5xl">
              AI-powered booking for repair shops — customers describe the
              issue before they walk in.
            </h1>
            <p
              className="mt-5 animate-reveal-up text-lg text-ink-muted"
              style={{ animationDelay: "80ms" }}
            >
              Capture the device and a description of the problem right at
              booking time, so your bench isn&apos;t guessing — and fewer
              vague appointments turn into no-shows.
            </p>

            <div
              className="mt-8 flex flex-wrap items-center gap-3 animate-reveal-up"
              style={{ animationDelay: "160ms" }}
            >
              <Link
                href="/book/repair-shop-demo"
                className="inline-flex items-center gap-2 rounded-interactive bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet/90"
              >
                See live demo
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-interactive border border-subtle px-5 py-2.5 text-sm font-semibold text-ink-primary transition-colors hover:border-violet-dim/60"
              >
                Get started
              </Link>
            </div>
          </div>

          <div className="animate-reveal-up" style={{ animationDelay: "220ms" }}>
            <RepairBookingPreview />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* HOW IT WORKS                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-subtle bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">
            How it works
          </h2>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Three steps from a customer finding your booking page to a
            technician who already knows what they&apos;re walking into.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-subtle bg-subtle sm:grid-cols-3">
            {STEPS.map((item) => (
              <div key={item.step} className="bg-canvas p-8">
                <item.icon size={20} className="text-violet-dim" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Step {item.step}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-ink-primary">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-2.5 text-xs font-medium text-ink-muted">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-violet-dim" />
            <span>
              Double-booking is rejected at the database level — a trigger
              blocks any overlapping appointment before it can be written, so
              two customers can never land the same slot even under
              concurrent bookings.
            </span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FEATURES                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">
          Everything a repair shop's front desk needs.
        </h2>
        <p className="mt-3 max-w-2xl text-ink-muted">
          No point-of-sale integration required to get started — just a
          booking page and an assistant that's already grounded in your own
          documentation.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-interactive border border-subtle bg-surface p-6"
            >
              <feature.icon size={20} className="text-violet-dim" />
              <h3 className="mt-4 text-base font-semibold text-ink-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* PRICING (placeholder — see inline note)                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-subtle bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">
              Simple pricing for a single shop.
            </h2>
            <p className="mt-3 text-ink-muted">
              One plan, built for a solo or small repair shop. Multi-location
              pricing available on request.
            </p>
          </div>

          {/*
            TODO(pricing): $29/mo below is a PLACEHOLDER, not a finalized
            price — swap it out before this page goes live. The visible
            "Placeholder — TODO" badge is intentional so this can't be
            mistaken for a real, final price if shipped as-is.
          */}
          <div className="mt-10 max-w-sm rounded-interactive border border-violet-dim bg-surface-raised p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-primary">
                Shop
              </h3>
              <span className="rounded-control border border-status-warn/40 bg-status-warn/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-status-warn">
                Placeholder — TODO
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-ink-primary">
                $29
              </span>
              <span className="text-sm text-ink-muted">/mo</span>
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              Placeholder price — to be finalized.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                "Unlimited bookings",
                "Public booking page & availability calendar",
                "AI pre-diagnosis chat & knowledge base",
                "Stripe deposits at checkout",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-ink-muted"
                >
                  <CheckCircle2 size={14} className="shrink-0 text-status-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* CTA BAND                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t border-subtle bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-16 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="text-xl font-semibold text-ink-primary">
              See it running on a real repair shop.
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              No signup required — book a slot on the live demo shop.
            </p>
          </div>
          <Link
            href="/book/repair-shop-demo"
            className="inline-flex items-center gap-2 rounded-interactive bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet/90"
          >
            Try the live demo
          </Link>
        </div>
      </section>
    </div>
  );
}

const PREVIEW_ROWS = [
  {
    name: "Jordan M.",
    device: "iPhone 13 Pro — cracked screen",
    time: "9:00 AM",
    tone: "success" as const,
  },
  {
    name: "Casey L.",
    device: "Dell XPS 15 — won't power on",
    time: "10:30 AM",
    tone: "success" as const,
  },
  {
    name: "Priya R.",
    device: "Pixel 7 — battery drains fast",
    time: "1:15 PM",
    tone: "warn" as const,
  },
];

const PREVIEW_TONE_CLASS = {
  success: "bg-status-success/10 text-status-success",
  warn: "bg-status-warn/10 text-status-warn",
};

/** Static preview of the booking queue with device/issue context — no live data. */
function RepairBookingPreview() {
  return (
    <div className="rounded-interactive border border-subtle bg-surface p-4 shadow-2xl shadow-black/40 sm:p-5">
      <div className="flex items-center justify-between border-b border-subtle pb-3">
        <div className="flex items-center gap-2">
          <CalendarCheck size={16} className="text-violet-dim" />
          <span className="text-sm font-semibold text-ink-primary">
            Today&apos;s repairs
          </span>
        </div>
        <span className="font-mono text-xs text-ink-muted">repair-shop-demo</span>
      </div>

      <ul className="mt-3 space-y-2">
        {PREVIEW_ROWS.map((row) => (
          <li
            key={row.name}
            className="flex items-center justify-between rounded-control border border-subtle bg-surface-raised px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-ink-primary">{row.name}</p>
              <p className="text-xs text-ink-muted">{row.device}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono text-xs text-ink-muted">
                <Clock3 size={12} />
                {row.time}
              </span>
              <span
                className={`flex items-center gap-1 rounded-control px-2 py-0.5 text-xs font-semibold ${PREVIEW_TONE_CLASS[row.tone]}`}
              >
                <CheckCircle2 size={12} />
                {row.tone === "success" ? "confirmed" : "pending"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
