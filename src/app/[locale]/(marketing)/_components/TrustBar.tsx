import { Container, Database, Lock, ShieldCheck } from "lucide-react";

const ITEMS = [
  { icon: Lock, label: "Row-level multi-tenant isolation" },
  { icon: Database, label: "PostgreSQL + Supabase RLS" },
  { icon: ShieldCheck, label: "Stripe-verified webhook signing" },
  { icon: Container, label: "Docker / ECS Fargate deployment" },
];

export default function TrustBar() {
  return (
    <section className="border-y border-subtle bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6 lg:px-8">
        {ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <item.icon size={16} className="shrink-0 text-violet-dim" />
            <span className="text-xs font-medium text-ink-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
