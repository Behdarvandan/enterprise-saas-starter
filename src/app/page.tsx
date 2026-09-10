import Link from "next/link";
import { ArrowRight, Database, Layers, Lock } from "lucide-react";
import Card from "@/components/ui/Card";

const features = [
  {
    icon: Lock,
    title: "Supabase Authentication",
    description:
      "Email/password auth with SSR session-refresh middleware already wired up.",
  },
  {
    icon: Database,
    title: "Typed Database Client",
    description:
      "Isolated Supabase client helpers for server and browser environments.",
  },
  {
    icon: Layers,
    title: "Modular Architecture",
    description:
      "Strict src/app, src/components, src/lib, and src/types separation.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Enterprise SaaS starter kit
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          A production-ready Next.js 15 foundation with Supabase authentication,
          typed clients, and container-first deployment.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Get started
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View dashboard
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <feature.icon size={22} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{feature.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
