import { useTranslations } from "next-intl";

const CONTROL_KEYS = [
  "isolation",
  "privilegedOps",
  "serviceRole",
  "paymentVerification",
  "deployment",
] as const;

export default function SecuritySection() {
  const t = useTranslations("marketing.security");

  return (
    <section id="security" className="border-y border-subtle bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-ink-primary sm:text-3xl">{t("title")}</h2>
        <dl className="mt-10 space-y-6">
          {CONTROL_KEYS.map((key) => (
            <div key={key} className="grid grid-cols-1 gap-1 sm:grid-cols-[200px_1fr] sm:gap-6">
              <dt className="text-sm font-semibold text-ink-primary">
                {t(`controls.${key}.label`)}
              </dt>
              <dd className="text-sm leading-relaxed text-ink-muted">
                {t(`controls.${key}.detail`)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
