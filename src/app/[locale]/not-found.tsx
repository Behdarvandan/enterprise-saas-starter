import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("common.notFound");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-ink-primary">{t("title")}</h1>
      <p className="mt-2 text-sm text-ink-muted">{t("body")}</p>
    </div>
  );
}
