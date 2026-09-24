"use client";

import { AlertTriangle, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";
import {
  updateAgencyBranding,
  type BrandingActionResult,
  type BrandingField,
} from "@/app/[locale]/agency/branding/actions";
import TenantPreview from "@/components/agency/TenantPreview";
import { Button } from "@/core/ui/primitives/button";
import FormStatus from "@/components/ui/FormStatus";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { useRouter } from "@/i18n/navigation";
import { deriveBrandPalette, isHexColor } from "@/lib/agency/palette";
import { toast } from "@/lib/toast";

export interface BrandingFormValues {
  title: string;
  logo_url: string;
  primary_color: string;
  cname_domain: string;
}

const FALLBACK_PICKER_COLOR = "#7c3aed";

function httpsUrlOrNull(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).protocol === "https:" ? trimmed : null;
  } catch (error) {
    // Not a parseable URL yet (the user is still typing): preview the default mark.
    console.debug("[branding] logo URL not parseable yet:", error);
    return null;
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-status-error">
      {message}
    </p>
  );
}

/**
 * Identity settings (title, logo, colour, domain) beside an instant preview of
 * the tenant experience. The preview reads local state, so it updates on every
 * keystroke; nothing is saved until the form is submitted.
 */
export default function BrandingStudio({ initial }: { initial: BrandingFormValues }) {
  const t = useTranslations("agency.branding");
  const router = useRouter();
  const id = useId();
  const [values, setValues] = useState(initial);
  const [result, setResult] = useState<BrandingActionResult>({});
  const [logoBroken, setLogoBroken] = useState(false);
  const [pending, startTransition] = useTransition();

  const fieldErrors: Partial<Record<BrandingField, string>> = result.fieldErrors ?? {};
  const color = isHexColor(values.primary_color) ? values.primary_color.toLowerCase() : null;
  const palette = deriveBrandPalette(color ?? FALLBACK_PICKER_COLOR);
  const logoUrl = logoBroken ? null : httpsUrlOrNull(values.logo_url);
  const dirty = (Object.keys(initial) as (keyof BrandingFormValues)[]).some((key) => initial[key] !== values[key]);

  function update<K extends keyof BrandingFormValues>(key: K, value: BrandingFormValues[K]) {
    setResult({});
    if (key === "logo_url") setLogoBroken(false);
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult({});
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const outcome = await updateAgencyBranding(data);
      setResult(outcome);
      if (outcome.success) {
        toast({ tone: "success", title: t("saved") });
        router.refresh();
      }
    });
  }

  const swatches = [
    { key: "base", label: t("palette.base"), value: palette.base },
    { key: "hover", label: t("palette.hover"), value: palette.hover },
    { key: "foreground", label: t("palette.text"), value: palette.foreground },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="grid content-start gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-title`}>{t("fields.title")}</Label>
          <Input
            id={`${id}-title`}
            name="title"
            maxLength={80}
            placeholder="Acme AI"
            autoComplete="off"
            value={values.title}
            onChange={(event) => update("title", event.target.value)}
            aria-invalid={fieldErrors.title ? true : undefined}
            aria-describedby={`${id}-title-hint ${id}-title-error`}
          />
          <FieldError id={`${id}-title-error`} message={fieldErrors.title} />
          <p id={`${id}-title-hint`} className="text-xs text-slate-400">
            {t("fields.titleHint")}
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-logo`}>{t("fields.logo")}</Label>
          <Input
            id={`${id}-logo`}
            name="logo_url"
            type="url"
            inputMode="url"
            dir="ltr"
            placeholder="https://cdn.youragency.com/logo.svg"
            autoComplete="off"
            className="text-start"
            value={values.logo_url}
            onChange={(event) => update("logo_url", event.target.value)}
            aria-invalid={fieldErrors.logo_url ? true : undefined}
            aria-describedby={`${id}-logo-hint ${id}-logo-error`}
          />
          <FieldError id={`${id}-logo-error`} message={fieldErrors.logo_url} />
          <p id={`${id}-logo-hint`} className="text-xs text-slate-400">
            {logoBroken ? t("fields.logoBroken") : t("fields.logoHint")}
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-color`}>{t("fields.color")}</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              aria-label={t("fields.colorPicker")}
              value={color ?? FALLBACK_PICKER_COLOR}
              onChange={(event) => update("primary_color", event.target.value)}
              className="h-9 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
            />
            <Input
              id={`${id}-color`}
              name="primary_color"
              dir="ltr"
              placeholder="#7c3aed"
              maxLength={7}
              autoComplete="off"
              spellCheck={false}
              className="max-w-40 text-start font-mono"
              value={values.primary_color}
              onChange={(event) => update("primary_color", event.target.value)}
              aria-invalid={fieldErrors.primary_color ? true : undefined}
              aria-describedby={`${id}-color-error`}
            />
          </div>
          <FieldError id={`${id}-color-error`} message={fieldErrors.primary_color} />

          <div className="mt-2 grid gap-2 rounded-lg border border-slate-800 p-3">
            <p className="text-xs font-medium text-slate-300">{t("palette.title")}</p>
            <ul className="flex flex-wrap gap-3">
              {swatches.map((swatch) => (
                <li key={swatch.key} className="flex items-center gap-2 text-xs text-slate-300">
                  <span
                    aria-hidden
                    className="size-5 rounded-md border border-slate-700"
                    style={{ backgroundColor: swatch.value }}
                  />
                  <span>{swatch.label}</span>
                  <span dir="ltr" className="font-mono text-slate-400">
                    {swatch.value}
                  </span>
                </li>
              ))}
            </ul>
            <p
              role="status"
              className={`flex items-center gap-1.5 text-xs ${palette.passesAA ? "text-emerald-300" : "text-amber-300"}`}
            >
              {palette.passesAA ? <Check aria-hidden className="size-3.5" /> : <AlertTriangle aria-hidden className="size-3.5" />}
              {palette.passesAA
                ? t("palette.contrastOk", { ratio: palette.contrast.toFixed(1) })
                : t("palette.contrastLow", { ratio: palette.contrast.toFixed(1) })}
            </p>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-domain`}>{t("fields.domain")}</Label>
          <Input
            id={`${id}-domain`}
            name="cname_domain"
            dir="ltr"
            placeholder="ai.youragency.com"
            autoComplete="off"
            spellCheck={false}
            className="text-start font-mono"
            value={values.cname_domain}
            onChange={(event) => update("cname_domain", event.target.value)}
            aria-invalid={fieldErrors.cname_domain ? true : undefined}
            aria-describedby={`${id}-domain-hint ${id}-domain-error`}
          />
          <FieldError id={`${id}-domain-error`} message={fieldErrors.cname_domain} />
          <p id={`${id}-domain-hint`} className="text-xs text-slate-400">
            {t("fields.domainHint")}
          </p>
        </div>

        <FormStatus error={result.error} success={result.success} successMessage={result.domainChanged ? t("savedDomainChanged") : t("saved")} />

        <div>
          <Button type="submit" loading={pending} disabled={!dirty}>
            {pending ? t("saving") : t("save")}
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <TenantPreview
          title={values.title}
          logoUrl={logoUrl}
          color={color}
          domain={values.cname_domain.trim() || null}
          onLogoError={() => setLogoBroken(true)}
        />
      </div>
    </form>
  );
}
