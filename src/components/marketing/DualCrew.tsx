import {
  ArrowDown,
  ArrowRight,
  CalendarCheck,
  Headset,
  LineChart,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import GlassPanel from "@/components/marketing/GlassPanel";
import Reveal from "@/components/marketing/Reveal";
import SectionHeading from "@/components/marketing/SectionHeading";
import Badge from "@/components/ui/Badge";
import LiveDot from "@/components/ui/LiveDot";

const OPS_POINTS = ["always", "rag", "booking"] as const;
const DEV_POINTS = ["scan", "recommend", "loop"] as const;

function CrewPoints({ items, icon: Icon }: { items: string[]; icon: LucideIcon }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-foreground">
          <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** The two-loop architecture: Ops Crew serves customers, Dev Crew improves it. */
export default async function DualCrew() {
  const t = await getTranslations("marketing.landing.crew");

  return (
    <section id="capabilities" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <Reveal>
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      </Reveal>

      <Reveal className="mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <GlassPanel className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Headset aria-hidden className="size-5" />
              </span>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">{t("ops.title")}</h3>
            </div>
            <Badge tone="success">
              <LiveDot />
              {t("ops.tag")}
            </Badge>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("ops.description")}</p>
          <CrewPoints items={OPS_POINTS.map((key) => t(`ops.points.${key}`))} icon={CalendarCheck} />
          <div dir="ltr" className="mt-6 flex flex-wrap gap-2 font-mono text-xs">
            <code className="rounded-md bg-muted px-2 py-1 text-primary">rag_search</code>
            <code className="rounded-md bg-muted px-2 py-1 text-primary">calendar_booking</code>
          </div>
        </GlassPanel>

        <div
          aria-hidden
          className="flex items-center justify-center gap-2 py-1 text-xs font-medium text-muted-foreground lg:flex-col lg:px-2"
        >
          <span className="flex items-center gap-1.5">
            <ArrowDown className="size-4 text-primary lg:hidden" />
            <ArrowRight className="hidden size-4 text-primary lg:block rtl:rotate-180" />
            {t("loop.toDev")}
          </span>
          <span className="flex items-center gap-1.5">
            <ArrowDown className="size-4 rotate-180 text-emerald-400 lg:hidden" />
            <ArrowRight className="hidden size-4 rotate-180 text-emerald-400 lg:block rtl:rotate-0" />
            {t("loop.toOps")}
          </span>
        </div>

        <GlassPanel className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ScanSearch aria-hidden className="size-5" />
              </span>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">{t("dev.title")}</h3>
            </div>
            <Badge tone="violet">{t("dev.tag")}</Badge>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("dev.description")}</p>
          <CrewPoints items={DEV_POINTS.map((key) => t(`dev.points.${key}`))} icon={LineChart} />

          <div className="mt-6 rounded-xl border border-border bg-muted/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("dev.sample.label")}
              </p>
              <span dir="ltr" className="font-mono text-xs text-amber-400">
                {t("dev.sample.count")}
              </span>
            </div>
            <p className="mt-2 text-sm text-foreground">{t("dev.sample.recommendation")}</p>
            <code dir="ltr" className="mt-3 inline-block rounded bg-muted px-2 py-1 font-mono text-[11px] text-primary">
              dev_crew.recommendation
            </code>
          </div>
        </GlassPanel>
      </Reveal>
    </section>
  );
}
