import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/primitives/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/primitives/table";
import { Link } from "@/i18n/navigation";

const TIER_KEYS = ["starter", "pro", "enterprise"] as const;
type TierKey = (typeof TIER_KEYS)[number];

const COMPARISON_ROW_KEYS = [
  "agents",
  "documents",
  "workflows",
  "apiCalls",
  "vectorStorage",
  "whiteLabel",
  "customDomain",
  "support",
] as const;

const FAQ_KEYS = ["trial", "changePlan", "cancelData", "languages", "customDomain", "isolation"] as const;

export default async function PricingPage() {
  const t = await getTranslations("marketing.pricingPage");

  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-base text-muted-foreground">{t("subtitle")}</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TIER_KEYS.map((tier: TierKey) => {
            const isPopular = tier === "pro";
            const features = t.raw(`tiers.${tier}.features`) as string[];
            return (
              <Card
                key={tier}
                variant="section"
                className={isPopular ? "flex flex-col gap-4 border-primary p-6" : "flex flex-col gap-4 p-6"}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{t(`tiers.${tier}.name`)}</p>
                  {isPopular ? <Badge>{t("popularBadge")}</Badge> : null}
                </div>
                <p>
                  <span className="text-3xl font-semibold text-foreground">{t(`tiers.${tier}.price`)}</span>
                  <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
                </p>
                <p className="text-sm text-muted-foreground">{t(`tiers.${tier}.description`)}</p>
                <ul className="flex flex-1 flex-col gap-2">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={isPopular ? "default" : "secondary"} asChild>
                  <Link href="/signup">{t(`tiers.${tier}.cta`)}</Link>
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-center text-2xl font-semibold text-foreground">
          {t("comparison.title")}
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("comparison.columns.feature")}</TableHead>
                <TableHead>{t("comparison.columns.starter")}</TableHead>
                <TableHead>{t("comparison.columns.pro")}</TableHead>
                <TableHead>{t("comparison.columns.enterprise")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPARISON_ROW_KEYS.map((row) => (
                <TableRow key={row}>
                  <TableCell className="font-medium text-foreground">
                    {t(`comparison.rows.${row}.label`)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(`comparison.rows.${row}.starter`)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(`comparison.rows.${row}.pro`)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(`comparison.rows.${row}.enterprise`)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="mb-6 text-center text-2xl font-semibold text-foreground">{t("faq.title")}</h2>
        <div className="flex flex-col gap-4">
          {FAQ_KEYS.map((item) => (
            <Card key={item} variant="section">
              <CardHeader>
                <CardTitle>{t(`faq.items.${item}.question`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t(`faq.items.${item}.answer`)}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
