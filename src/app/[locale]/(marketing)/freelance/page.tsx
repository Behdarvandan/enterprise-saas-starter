import { Code2, Database, MessageSquareText, Workflow } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import LeadForm from "../_components/LeadForm";
import { getPortfolioItems } from "@/lib/portfolio";

const SERVICE_ICONS = [Code2, Database, MessageSquareText, Workflow] as const;

export default async function FreelancePage() {
  const t = await getTranslations("marketing.freelancePage");
  const portfolioItems = getPortfolioItems();

  const services = [
    t("services.fullStack"),
    t("services.multiTenant"),
    t("services.ragAi"),
    t("services.payments"),
  ];

  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-ink-primary sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 text-lg text-ink-muted">{t("heroSubtitle")}</p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="#project">{t("ctaPrimary")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-subtle bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("servicesTitle")}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => {
              const Icon = SERVICE_ICONS[index];
              return (
                <div
                  key={service}
                  className="rounded-interactive border border-subtle bg-canvas p-6"
                >
                  <Icon size={20} className="text-violet-dim" />
                  <p className="mt-4 text-sm text-ink-muted">{service}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("portfolioTitle")}
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {portfolioItems.map((item) => (
            <Link
              key={item.slug}
              href={`/freelance/portfolio/${item.slug}`}
              className="rounded-interactive border border-subtle bg-surface p-6 transition-colors hover:border-violet-dim/60"
            >
              <h3 className="text-base font-semibold text-ink-primary">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {item.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-control bg-surface-raised px-2 py-0.5 text-xs font-medium text-ink-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="project" className="border-t border-subtle bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">
            {t("formTitle")}
          </h2>
          <p className="mt-3 text-ink-muted">{t("formSubtitle")}</p>
          <div className="mt-8">
            <LeadForm kind="freelance" />
          </div>
        </div>
      </section>
    </div>
  );
}
