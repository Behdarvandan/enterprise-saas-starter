import { BadgeCheck, KeyRound, Server, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/core/ui/primitives/card";

const CONTROL_ICON: Record<string, LucideIcon> = {
  isolation: Shield,
  serviceRole: KeyRound,
  paymentVerification: BadgeCheck,
  deployment: Server,
};

const CONTROL_KEYS = ["isolation", "serviceRole", "paymentVerification", "deployment"] as const;

export async function SecurityTelemetryStrip() {
  const t = await getTranslations("marketing.home.telemetry");
  const security = await getTranslations("marketing.security");

  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("title")}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{t("description")}</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="section" className="p-5 text-center">
          <p className="font-mono text-2xl font-semibold text-foreground">{t("uptimeValue")}</p>
          <p className="text-xs text-muted-foreground">{t("uptimeLabel")}</p>
        </Card>
        <Card variant="section" className="p-5 text-center">
          <p className="font-mono text-2xl font-semibold text-foreground">{t("latencyValue")}</p>
          <p className="text-xs text-muted-foreground">{t("latencyLabel")}</p>
          <p className="mt-1 text-[11px] text-muted-foreground/80">{t("latencyNote")}</p>
        </Card>
        <Card variant="section" className="p-5 text-center">
          <p className="font-mono text-2xl font-semibold text-foreground">{t("isolationValue")}</p>
          <p className="text-xs text-muted-foreground">{t("isolationLabel")}</p>
        </Card>
      </div>

      <p className="mb-3 text-sm font-medium text-foreground">{t("controlsIntro")}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CONTROL_KEYS.map((key) => {
          const Icon = CONTROL_ICON[key];
          return (
            <Card key={key} variant="section">
              <CardHeader>
                <div className="mb-1 flex items-center gap-2">
                  <Icon aria-hidden className="size-4 text-primary" />
                  <CardTitle>{security(`controls.${key}.label`)}</CardTitle>
                </div>
                <CardDescription>{security(`controls.${key}.detail`)}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
