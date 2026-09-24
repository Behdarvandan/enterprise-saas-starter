"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/core/ui/primitives/button";

const PROJECT_CATEGORIES = [
  "fullstack_saas",
  "ai_automation",
  "architecture_security",
  "payment_subscription",
] as const;

type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

const WORKING_MODES = ["hourly", "project", "either"] as const;

const inputClass =
  "w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim";
const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-ink-muted";

/**
 * "Teklif Al" quote form (brief §4.4) — the marketing site's only
 * lead-intake form, single page (no wizard), no budget field. Project
 * category drives one dynamic follow-up question so the pipeline gets
 * CRM-quality detail without adding friction up front. Always submits
 * `kind: "freelance"` since this form only appears on /services — /saas
 * never captures leads, it links here instead.
 */
export default function LeadForm() {
  const t = useTranslations("marketing.leadForm");
  const [category, setCategory] = useState<ProjectCategory | "">("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "freelance",
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        projectCategory: formData.get("projectCategory"),
        workingMode: formData.get("workingMode") || undefined,
        message: formData.get("message"),
        projectScope: formData.get("followUp"),
        source: "marketing_services",
      }),
    }).catch(() => null);

    if (!response) {
      setStatus("error");
      setError(t("genericError"));
      return;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      setStatus("error");
      setError(data.error ?? t("genericError"));
      return;
    }

    setStatus("success");
    event.currentTarget.reset();
    setCategory("");
  }

  if (status === "success") {
    return (
      <div className="rounded-interactive border border-status-success/30 bg-status-success/10 p-6 text-sm font-medium text-status-success">
        {t("successMessage")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="fullName" className={labelClass}>
            {t("fullNameLabel")}
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
            {t("emailLabel")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="phone" className={labelClass}>
            {t("phoneLabel")}
          </label>
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="projectCategory" className={labelClass}>
            {t("categoryLabel")}
          </label>
          <select
            id="projectCategory"
            name="projectCategory"
            required
            value={category}
            onChange={(event) => setCategory(event.target.value as ProjectCategory)}
            className={inputClass}
          >
            <option value="" disabled>
              {t("categoryPlaceholder")}
            </option>
            {PROJECT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {t(`categoryOptions.${option}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className={labelClass}>
          {t("messageLabel")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          required
          placeholder={t("messagePlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="workingMode" className={labelClass}>
          {t("workingModeLabel")} <span className="normal-case text-ink-muted/70">{t("workingModeOptional")}</span>
        </label>
        <select id="workingMode" name="workingMode" className={inputClass}>
          <option value="">{t("workingModePlaceholder")}</option>
          {WORKING_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {t(`workingModeOptions.${mode}`)}
            </option>
          ))}
        </select>
      </div>

      {category && (
        <div className="space-y-1.5">
          <label htmlFor="followUp" className={labelClass}>
            {t(`followUpQuestions.${category}`)}
          </label>
          <textarea id="followUp" name="followUp" rows={2} className={inputClass} />
        </div>
      )}

      {error && (
        <p className="rounded-control bg-status-error/10 px-3 py-2 text-xs font-medium text-status-error">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={status === "loading"}
        className="w-full sm:w-auto"
      >
        {status === "loading" ? t("sending") : t("submitButton")}
      </Button>
    </form>
  );
}
