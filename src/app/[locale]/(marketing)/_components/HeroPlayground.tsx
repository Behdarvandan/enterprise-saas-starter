"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import ChatWidget from "@/components/chat-widget/ChatWidget";

// Pre-seeded "Repair Shop Demo" organization (supabase/seed-repair-shop-demo.sql,
// knowledge base content added by scripts/seed-demo-knowledge-base.ts) — the
// visitor's typed shop name only personalizes the sample question sent into
// this real, safe, pre-seeded org; nothing is fetched or scraped from it.
const DEMO_ORGANIZATION_ID = "aaaaaaaa-0000-0000-0000-000000000001";

export default function HeroPlayground() {
  const t = useTranslations("marketing.hero.playground");
  const [shopName, setShopName] = useState("");
  const [started, setStarted] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined);

  function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = shopName.trim();
    setInitialQuery(name ? t("sampleQuestionWithName", { name }) : t("sampleQuestion"));
    setStarted(true);
  }

  return (
    <div
      className="animate-reveal-up mt-16 rounded-interactive border border-subtle bg-surface p-6 transition-[box-shadow,border-color] duration-200 hover:border-gold/50 hover:shadow-md hover:shadow-gold/10 sm:p-8"
      style={{ animationDelay: "280ms" }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Sparkles size={14} />
        {t("kicker")}
      </div>
      <h2 className="mt-2 font-serif text-xl font-semibold text-ink-primary sm:text-2xl">
        {t("title")}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t("description")}</p>

      {!started ? (
        <form onSubmit={handleStart} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={shopName}
            onChange={(event) => setShopName(event.target.value)}
            placeholder={t("placeholder")}
            className="flex-1 rounded-control border border-subtle bg-surface-raised px-4 py-2.5 text-sm text-ink-primary outline-none transition-colors focus:border-gold/50"
          />
          <button
            type="submit"
            className="rounded-interactive bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("cta")}
          </button>
        </form>
      ) : (
        <p className="mt-5 text-sm text-ink-muted">{t("started")}</p>
      )}

      {started && (
        <ChatWidget
          organizationId={DEMO_ORGANIZATION_ID}
          title={t("widgetTitle")}
          initialQuery={initialQuery}
        />
      )}
    </div>
  );
}
