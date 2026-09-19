import { getTranslations } from "next-intl/server";
import GlassPanel from "@/components/marketing/GlassPanel";
import Reveal from "@/components/marketing/Reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function FinalCta() {
  const t = await getTranslations("marketing.landing.cta");

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <Reveal>
        <GlassPanel className="relative isolate overflow-hidden px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_80%_at_50%_100%,rgba(124,58,237,0.25),transparent_70%)]"
          />
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-slate-400">{t("subtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="glow" size="lg">
              <Link href="/signup">{t("primary")}</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/services#quote">{t("secondary")}</Link>
            </Button>
          </div>
        </GlassPanel>
      </Reveal>
    </section>
  );
}
