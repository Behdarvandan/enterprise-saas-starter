import { Globe2, Layers, Palette, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import BrandingDemo from "@/components/marketing/BrandingDemo";
import GlassPanel from "@/components/marketing/GlassPanel";
import Reveal from "@/components/marketing/Reveal";
import SectionHeading from "@/components/marketing/SectionHeading";
import { Button } from "@/core/ui/primitives/button";
import LiveDot from "@/components/ui/LiveDot";
import { Link } from "@/i18n/navigation";
import { getCnameTarget } from "@/lib/agency/cname";

const POINTS: { key: "domain" | "brand" | "quota"; icon: LucideIcon }[] = [
  { key: "domain", icon: Globe2 },
  { key: "brand", icon: Palette },
  { key: "quota", icon: Layers },
];

/** Sample hostname shown in the DNS card — an example, not a real agency. */
const SAMPLE_DOMAIN = "ai.youragency.com";

export default async function WhiteLabelSection() {
  const t = await getTranslations("marketing.landing.whiteLabel");
  const cnameTarget = getCnameTarget();

  const records = [
    { label: t("dns.type"), value: "CNAME" },
    { label: t("dns.name"), value: SAMPLE_DOMAIN },
    { label: t("dns.value"), value: cnameTarget },
  ];

  return (
    <section id="agency" className="scroll-mt-20 border-t border-border bg-secondary/20">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
            <ul className="mt-8 space-y-5">
              {POINTS.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon aria-hidden className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t(`points.${key}.title`)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t(`points.${key}.body`)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild variant="default" size="lg">
                <Link href="/solutions#quote">{t("ctaApply")}</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/agency">{t("ctaPortal")}</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={120} className="space-y-4">
            <GlassPanel className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">{t("dns.title")}</h3>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <LiveDot />
                  {t("dns.status")}
                </span>
              </div>
              <dl dir="ltr" className="mt-4 grid gap-2 font-mono text-xs">
                {records.map((record) => (
                  <div
                    key={record.label}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/60 px-3 py-2"
                  >
                    <dt className="text-muted-foreground">{record.label}</dt>
                    <dd className="truncate text-primary">{record.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">{t("dns.hint")}</p>
            </GlassPanel>

            <GlassPanel className="p-5">
              <BrandingDemo />
            </GlassPanel>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
