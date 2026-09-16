import { Banknote, ShieldCheck, Wrench } from "lucide-react";

const PERSONAS = [
  {
    icon: Wrench,
    role: "For operations",
    headline: "Nobody double-books a slot again.",
    body: "Availability, services, and appointments live behind a database trigger that rejects overlapping bookings at write time — not a client-side check that a race condition can slip past.",
  },
  {
    icon: ShieldCheck,
    role: "For IT & security review",
    headline: "Tenant isolation enforced in the database, not the app layer.",
    body: "Every table carries an organization_id and a Row Level Security policy scoped through is_org_member(). A compromised or buggy query can't cross a tenant boundary — Postgres refuses the row before your code ever sees it.",
  },
  {
    icon: Banknote,
    role: "For finance & billing",
    headline: "Subscription state stays in sync with Stripe, automatically.",
    body: "Checkout, plan changes, and cancellations flow through signature-verified Stripe webhooks that write directly to each organization's subscription record — no manual reconciliation.",
  },
];

export default function PersonaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-px overflow-hidden border border-subtle bg-subtle sm:grid-cols-3">
        {PERSONAS.map((persona) => (
          <div key={persona.role} className="bg-canvas p-8">
            <persona.icon size={20} className="text-violet-dim" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {persona.role}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-ink-primary">
              {persona.headline}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{persona.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
