import { Bot, BookOpen, Palette, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/core/ui/primitives/card";
import { cn } from "@/lib/utils";

const FEATURE_ICON: Record<string, LucideIcon> = {
  agents: Bot,
  rag: BookOpen,
  workflows: Workflow,
  whiteLabel: Palette,
};

interface FeatureCellConfig {
  key: "agents" | "rag" | "workflows" | "whiteLabel";
  className: string;
  tint?: string;
}

// Exactly 4 cells for 4 items, tiled asymmetrically on a 3-col/2-row grid at
// `lg` (agents: 2x1, rag: 1x2, workflows/whiteLabel: 1x1 each - 6 units
// total, no empty cells). Collapses to a plain 2-col grid below `lg`.
const CELLS: FeatureCellConfig[] = [
  { key: "agents", className: "sm:col-span-2 lg:col-span-2", tint: "bg-primary/5 border-primary/20" },
  { key: "rag", className: "lg:row-span-2", tint: "bg-accent border-primary/10" },
  { key: "workflows", className: "" },
  { key: "whiteLabel", className: "", tint: "bg-secondary/60" },
];

export async function BentoFeatureGrid() {
  const t = await getTranslations("marketing.home.features");

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">{t("eyebrow")}</p>
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-[repeat(2,minmax(220px,1fr))]">
        {CELLS.map(({ key, className, tint }) => {
          const Icon = FEATURE_ICON[key];
          const subBullets = t.raw(`items.${key}.subBullets`) as string[];

          return (
            <Card
              key={key}
              variant="section"
              className={cn("flex flex-col gap-3 p-6", tint, className)}
            >
              <Icon aria-hidden className="size-7 text-primary" />
              <h3 className="text-base font-semibold text-foreground">
                {t(`items.${key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">{t(`items.${key}.description`)}</p>
              <ul className="mt-auto flex flex-col gap-1.5 pt-2 text-sm text-muted-foreground">
                {subBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-primary/60" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
