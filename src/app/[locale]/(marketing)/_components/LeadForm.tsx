"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const BUDGET_RANGES = [
  "under_2k",
  "2k_5k",
  "5k_15k",
  "15k_50k",
  "50k_plus",
] as const;

interface LeadFormProps {
  kind: "saas" | "freelance";
}

const inputClass =
  "w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim";
const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-ink-muted";

/**
 * Shared lead-intake form for the SaaS/freelance marketing pages and the
 * general contact page. `kind` is attached to the submission so the admin
 * CRM (Faz 4) can tell a SaaS demo request from a freelance project inquiry
 * — the fields themselves are identical either way.
 */
export default function LeadForm({ kind }: LeadFormProps) {
  const t = useTranslations("marketing.leadForm");
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
        kind,
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        company: formData.get("company"),
        budgetRange: formData.get("budgetRange"),
        projectScope: formData.get("projectScope"),
        deadline: formData.get("deadline"),
        message: formData.get("message"),
        source: `marketing_${kind}`,
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
          <label htmlFor="company" className={labelClass}>
            {t("companyLabel")}
          </label>
          <input
            id="company"
            name="company"
            type="text"
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="budgetRange" className={labelClass}>
            {t("budgetLabel")}
          </label>
          <select id="budgetRange" name="budgetRange" className={inputClass}>
            <option value="">{t("budgetPlaceholder")}</option>
            {BUDGET_RANGES.map((range) => (
              <option key={range} value={range}>
                {t(`budgetOptions.${range}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="deadline" className={labelClass}>
            {t("deadlineLabel")}
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="projectScope" className={labelClass}>
          {t("scopeLabel")}
        </label>
        <textarea
          id="projectScope"
          name="projectScope"
          rows={3}
          placeholder={t("scopePlaceholder")}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className={labelClass}>
          {t("messageLabel")}
        </label>
        <textarea id="message" name="message" rows={4} className={inputClass} />
      </div>

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
