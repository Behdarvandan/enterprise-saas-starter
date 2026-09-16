"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import LeadForm from "../_components/LeadForm";

export default function ContactPage() {
  const t = useTranslations("marketing.contactPage");
  const [kind, setKind] = useState<"saas" | "freelance">("freelance");

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 text-ink-muted">{t("subtitle")}</p>

      <div className="mt-8 inline-flex rounded-interactive border border-subtle bg-surface p-1">
        <button
          type="button"
          onClick={() => setKind("freelance")}
          className={`rounded-control px-4 py-2 text-sm font-semibold transition-colors ${
            kind === "freelance"
              ? "bg-violet text-white"
              : "text-ink-muted hover:text-ink-primary"
          }`}
        >
          {t("kindFreelance")}
        </button>
        <button
          type="button"
          onClick={() => setKind("saas")}
          className={`rounded-control px-4 py-2 text-sm font-semibold transition-colors ${
            kind === "saas"
              ? "bg-violet text-white"
              : "text-ink-muted hover:text-ink-primary"
          }`}
        >
          {t("kindSaas")}
        </button>
      </div>

      <div className="mt-8">
        <LeadForm key={kind} kind={kind} />
      </div>
    </div>
  );
}
