import { Bot, Building2, Palette, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AmbientGlow } from "@/components/ui/liquid/AmbientGlow";
import { LiquidCard } from "@/components/ui/liquid/LiquidCard";
import SystemStatus from "@/components/marketing/SystemStatus";

const GUIDE_KEYS = ["digitalWorkforce", "knowledgeBase", "multiCompany", "whiteLabelPortal"] as const;
const GUIDE_ICONS = { digitalWorkforce: Bot, knowledgeBase: Search, multiCompany: Building2, whiteLabelPortal: Palette };

export default async function ResourcesPage() {
  const t = await getTranslations("marketing.resourcesPage");

  return (
    <div>
      <section className="animate-reveal-up relative isolate overflow-hidden mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <AmbientGlow position="top" />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight text-ink-primary sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 text-lg text-ink-muted">{t("heroSubtitle")}</p>
          <div className="mt-8 inline-flex flex-col items-center gap-2 rounded-2xl border border-subtle bg-surface px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("statusTitle")}</p>
            <SystemStatus />
          </div>
        </div>
      </section>

      <section
        className="animate-reveal-up border-y border-subtle bg-surface"
        style={{ animationDelay: "80ms" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("guidesTitle")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {GUIDE_KEYS.map((key) => {
              const Icon = GUIDE_ICONS[key];
              return (
                <LiquidCard key={key} interactive className="flex items-start gap-4 p-6">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon aria-hidden size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-ink-primary">{t(`guides.${key}.title`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t(`guides.${key}.description`)}</p>
                  </div>
                </LiquidCard>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
