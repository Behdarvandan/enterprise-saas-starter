import { getTranslations } from "next-intl/server";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Link } from "@/i18n/navigation";

export async function HeroSection() {
  const t = await getTranslations("marketing.home.hero");

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center sm:py-28">
      <Badge>{t("badge")}</Badge>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {t("title")}
      </h1>
      <p className="max-w-xl text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" asChild>
          <Link href="/app">{t("ctaPrimary")}</Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/pricing">{t("ctaSecondary")}</Link>
        </Button>
      </div>
    </section>
  );
}
