import { ArrowRight, Boxes, ChevronRight, Cpu, Database, Radio } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

const STAGE_ICON: Record<string, LucideIcon> = {
  ingestion: Database,
  vector: Boxes,
  orchestration: Cpu,
  stream: Radio,
};

const STAGE_KEYS = ["ingestion", "vector", "orchestration", "stream"] as const;

/** Real request path, not a roadmap illustration - each stage expands (native <details>, no client JS) to its own description. */
export async function ArchitecturePipeline() {
  const t = await getTranslations("marketing.home.architecture");

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("title")}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{t("description")}</p>
      </div>

      <div className="flex flex-col items-stretch gap-2 lg:flex-row lg:items-start lg:gap-3">
        {STAGE_KEYS.map((key, index) => {
          const Icon = STAGE_ICON[key];
          return (
            <div
              key={key}
              className="flex flex-col items-stretch gap-2 lg:flex-1 lg:flex-row lg:items-center"
            >
              <details className="group aceternity-border-beam-active flex-1 rounded-xl border border-border bg-card transition-colors open:bg-accent/40">
                <summary className="flex cursor-pointer items-center gap-3 rounded-xl p-4 outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-ring/60 [&::-webkit-details-marker]:hidden">
                  <Icon aria-hidden className="size-5 shrink-0 text-primary" />
                  <span className="flex-1 text-sm font-semibold text-foreground">
                    {t(`stages.${key}.title`)}
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                  />
                </summary>
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out group-open:grid-rows-[1fr]">
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 text-sm text-muted-foreground">
                      {t(`stages.${key}.description`)}
                    </p>
                  </div>
                </div>
              </details>
              {index < STAGE_KEYS.length - 1 ? (
                <ArrowRight
                  aria-hidden
                  className="mx-auto size-5 shrink-0 rotate-90 text-muted-foreground lg:rotate-0"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
