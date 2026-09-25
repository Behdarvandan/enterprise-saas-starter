import { BookOpenCheck, CalendarCheck, Sparkles, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import AgentPlayground from "@/components/marketing/AgentPlayground";
import { Button } from "@/core/ui/primitives/button";
import LiveDot from "@/components/ui/LiveDot";
import { Link } from "@/i18n/navigation";

const POINTS: { key: "rag" | "booking" | "devCrew"; icon: LucideIcon }[] = [
  { key: "rag", icon: BookOpenCheck },
  { key: "booking", icon: CalendarCheck },
  { key: "devCrew", icon: Sparkles },
];

const CARD = "rounded-3xl border border-white/10 bg-neutral-900/40 backdrop-blur-2xl";

export default async function Hero() {
  const t = await getTranslations("marketing.landing.hero");

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="marketing-grid absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(100,116,139,0.18),transparent_70%)]"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 md:grid-cols-3 lg:px-8 lg:pb-28">
        <div className={`${CARD} animate-reveal-up p-8 md:col-span-2`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            <LiveDot />
            {t("badge")}
          </span>
          <h1 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
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
        </div>

        {/* AgentPlayground already renders its own GlassPanel shell — no
            extra card wrapper here, or it'd be a frame within a frame. */}
        <div className="animate-reveal-up md:col-span-1" style={{ animationDelay: "120ms" }}>
          <AgentPlayground />
        </div>

        {POINTS.map(({ key, icon: Icon }, index) => (
          <div
            key={key}
            className={`${CARD} animate-reveal-up flex flex-col gap-3 p-5 md:col-span-1`}
            style={{ animationDelay: `${160 + index * 40}ms` }}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white">
              <Icon aria-hidden className="size-6" />
            </span>
            <p className="text-sm text-slate-300">{t(`points.${key}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
