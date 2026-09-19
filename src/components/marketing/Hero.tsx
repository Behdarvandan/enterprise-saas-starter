import { BookOpenCheck, CalendarCheck, Sparkles, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import AgentPlayground from "@/components/marketing/AgentPlayground";
import { Button } from "@/components/ui/button";
import LiveDot from "@/components/ui/LiveDot";
import { Link } from "@/i18n/navigation";

const POINTS: { key: "rag" | "booking" | "devCrew"; icon: LucideIcon }[] = [
  { key: "rag", icon: BookOpenCheck },
  { key: "booking", icon: CalendarCheck },
  { key: "devCrew", icon: Sparkles },
];

export default async function Hero() {
  const t = await getTranslations("marketing.landing.hero");

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="marketing-grid absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(124,58,237,0.22),transparent_70%)]"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pb-28">
        <div className="animate-reveal-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-md">
            <LiveDot />
            {t("badge")}
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-slate-100 sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-slate-400">{t("subtitle")}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild variant="glow" size="lg">
              <Link href="/signup">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/services#quote">{t("ctaSecondary")}</Link>
            </Button>
          </div>

          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {POINTS.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-start gap-2.5 text-sm text-slate-400">
                <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-violet-400" />
                {t(`points.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-reveal-up" style={{ animationDelay: "120ms" }}>
          <AgentPlayground />
        </div>
      </div>
    </section>
  );
}
