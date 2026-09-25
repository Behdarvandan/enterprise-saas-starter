import { Bot, Building2, Palette, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const MODULE_KEYS = ["digitalWorkforce", "knowledgeBase", "multiCompany", "whiteLabelPortal"] as const;
const MODULE_ICONS = { digitalWorkforce: Bot, knowledgeBase: Search, multiCompany: Building2, whiteLabelPortal: Palette };

/**
 * Compact "what we do" summary — a lighter-weight preview of the 4 product
 * modules covered in full on /product, linking each card to that page's
 * matching anchor.
 */
export default async function WhatWeDo() {
  const t = await getTranslations("marketing.megaNav");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {t("productsEyebrow")}
      </h2>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULE_KEYS.map((key) => {
          const Icon = MODULE_ICONS[key];
          return (
            <Link
              key={key}
              href={`/product#${key}`}
              className="block rounded-2xl border border-border bg-card p-5 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-xl"
            >
              <Icon aria-hidden size={20} className="text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">{t(`products.${key}.title`)}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t(`products.${key}.description`)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
