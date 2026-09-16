import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPortfolioItem, getPortfolioItems } from "@/lib/portfolio";

export function generateStaticParams() {
  return getPortfolioItems().map((item) => ({ slug: item.slug }));
}

interface PortfolioDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailPageProps) {
  const { slug } = await params;
  const item = getPortfolioItem(slug);

  if (!item) notFound();

  const t = await getTranslations("marketing.portfolioPage");

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <Link
        href="/freelance"
        className="inline-flex items-center gap-2 text-sm font-semibold text-violet-dim hover:text-violet"
      >
        <ArrowLeft size={16} />
        {t("backLink")}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
        {item.title}
      </h1>
      <p className="mt-4 text-lg text-ink-muted">{item.summary}</p>

      <div className="mt-8 rounded-interactive border border-subtle bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("stackLabel")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-control bg-surface-raised px-2.5 py-1 text-xs font-medium text-ink-primary"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-8 text-sm leading-relaxed text-ink-muted">{item.outcome}</p>
    </div>
  );
}
