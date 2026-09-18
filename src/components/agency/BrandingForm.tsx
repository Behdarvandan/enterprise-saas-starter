"use client";

import { useId, useState, useTransition, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  updateAgencyBranding,
  type BrandingActionResult,
  type BrandingField,
} from "@/app/[locale]/agency/branding/actions";
import { LogoMark } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import FormStatus from "@/components/ui/FormStatus";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrandingCssVars } from "@/lib/agency/branding";

export interface BrandingFormValues {
  title: string;
  logo_url: string;
  primary_color: string;
  cname_domain: string;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const FALLBACK_PICKER_COLOR = "#7c3aed";

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    // Not a parseable URL: the preview just shows the default mark.
    return false;
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

export default function BrandingForm({ initial }: { initial: BrandingFormValues }) {
  const router = useRouter();
  const id = useId();
  const [values, setValues] = useState(initial);
  const [result, setResult] = useState<BrandingActionResult>({});
  const [logoBroken, setLogoBroken] = useState(false);
  const [pending, startTransition] = useTransition();

  const fieldErrors: Partial<Record<BrandingField, string>> = result.fieldErrors ?? {};
  const validColor = HEX_COLOR.test(values.primary_color) ? values.primary_color.toLowerCase() : null;
  const previewVars = getBrandingCssVars({ primary_color: validColor ?? undefined });
  const previewLogo = values.logo_url.trim() && isHttpsUrl(values.logo_url.trim()) && !logoBroken
    ? values.logo_url.trim()
    : null;
  const previewTitle = values.title.trim() || "Your brand";

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
      if (outcome.success) router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid gap-8">
        <fieldset className="grid gap-4">
          <legend className="text-sm font-semibold text-ink-primary">Brand</legend>

          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-title`}>Brand title</Label>
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
            <p id={`${id}-title-hint`} className="text-xs text-ink-muted">
              Shown next to your logo and as the page title on your domain.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-logo`}>Logo URL</Label>
            <Input
              id={`${id}-logo`}
              name="logo_url"
              type="url"
              inputMode="url"
              placeholder="https://cdn.youragency.com/logo.svg"
              autoComplete="off"
              value={values.logo_url}
              onChange={(event) => update("logo_url", event.target.value)}
              aria-invalid={fieldErrors.logo_url ? true : undefined}
              aria-describedby={`${id}-logo-hint ${id}-logo-error`}
            />
            <FieldError id={`${id}-logo-error`} message={fieldErrors.logo_url} />
            <p id={`${id}-logo-hint`} className="text-xs text-ink-muted">
              A public https:// image. Roughly 32 px tall reads best; SVG or PNG on a transparent
              background works well on the dark theme.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-color`}>Primary color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Pick the primary color"
                value={validColor ?? FALLBACK_PICKER_COLOR}
                onChange={(event) => update("primary_color", event.target.value)}
                className="h-9 w-12 cursor-pointer rounded-control border border-subtle bg-transparent p-0.5"
              />
              <Input
                id={`${id}-color`}
                name="primary_color"
                placeholder="#7c3aed"
                maxLength={7}
                autoComplete="off"
                spellCheck={false}
                className="max-w-32 font-mono"
                value={values.primary_color}
                onChange={(event) => update("primary_color", event.target.value)}
                aria-invalid={fieldErrors.primary_color ? true : undefined}
                aria-describedby={`${id}-color-hint ${id}-color-error`}
              />
            </div>
            <FieldError id={`${id}-color-error`} message={fieldErrors.primary_color} />
            <p id={`${id}-color-hint`} className="text-xs text-ink-muted">
              Buttons, links and highlights on your domain. Leave empty for the platform default.
            </p>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-sm font-semibold text-ink-primary">Custom domain</legend>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-domain`}>Domain</Label>
            <Input
              id={`${id}-domain`}
              name="cname_domain"
              inputMode="url"
              placeholder="ai.youragency.com"
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              value={values.cname_domain}
              onChange={(event) => update("cname_domain", event.target.value)}
              aria-invalid={fieldErrors.cname_domain ? true : undefined}
              aria-describedby={`${id}-domain-hint ${id}-domain-error`}
            />
            <FieldError id={`${id}-domain-error`} message={fieldErrors.cname_domain} />
            <p id={`${id}-domain-hint`} className="text-xs text-ink-muted">
              A subdomain you control. After saving, point its CNAME record here and verify it
              below. Changing the domain requires verifying again.
            </p>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <FormStatus
            error={result.error}
            success={result.success}
            successMessage={
              result.domainChanged
                ? "Saved. Verify your domain's DNS below to activate it."
                : "Branding saved."
            }
          />
        </div>
      </div>

      {/* Live preview: colors are applied directly (not through the theme
          variables), since those only take effect at :root. */}
      <aside aria-label="Branding preview" className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Preview
        </p>
        <div
          className="rounded-interactive border border-subtle bg-canvas p-5"
          style={previewVars as CSSProperties}
        >
          <div className="flex items-center gap-2.5">
            {previewLogo ? (
              // Plain <img>: agency logos live on arbitrary hosts, which
              // next/image's build-time allowlist can't enumerate.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewLogo}
                alt=""
                onError={() => setLogoBroken(true)}
                className="h-8 w-auto max-w-32 shrink-0 object-contain"
              />
            ) : (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-violet text-primary-foreground"
                style={
                  validColor
                    ? { backgroundColor: validColor, color: previewVars["--primary-foreground"] }
                    : undefined
                }
              >
                <LogoMark className="h-4 w-4" />
              </div>
            )}
            <span className="font-serif text-sm font-semibold tracking-tight text-ink-primary">
              {previewTitle}
            </span>
          </div>

          {logoBroken ? (
            <p className="mt-3 text-xs text-status-warn">
              That image couldn&apos;t be loaded. Check the URL.
            </p>
          ) : null}

          <p className="mt-5 text-sm text-ink-muted">
            Ask anything about your account, or{" "}
            <span className="font-medium" style={validColor ? { color: validColor } : undefined}>
              book an appointment
            </span>
            .
          </p>
          <div
            className="mt-4 inline-flex rounded-interactive bg-violet px-4 py-2 text-sm font-semibold text-primary-foreground"
            style={
              validColor
                ? { backgroundColor: validColor, color: previewVars["--primary-foreground"] }
                : undefined
            }
          >
            Get started
          </div>
        </div>
      </aside>
    </form>
  );
}
