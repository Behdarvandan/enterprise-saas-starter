"use client";

import FormStatus from "@/components/ui/FormStatus";
import { Button } from "@/core/ui/primitives/button";
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { useFormAction } from "@/hooks/useFormAction";
import { updateAgencyBranding, type BrandingField } from "./actions";

interface BrandingFormCopy {
  fields: {
    title: string;
    titleHint: string;
    logo: string;
    logoHint: string;
    color: string;
    domain: string;
    domainHint: string;
  };
  save: string;
  saving: string;
  saved: string;
  savedDomainChanged: string;
}

interface BrandingFormValues {
  title: string;
  logoUrl: string;
  primaryColor: string;
  cnameDomain: string;
}

function fieldError(
  errors: Partial<Record<BrandingField, string>> | undefined,
  field: BrandingField,
): string | undefined {
  return errors?.[field];
}

export default function BrandingForm({
  initialValues,
  copy,
}: {
  initialValues: BrandingFormValues;
  copy: BrandingFormCopy;
}) {
  const { result, loading, handleSubmit } = useFormAction(updateAgencyBranding);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="branding-title">{copy.fields.title}</Label>
        <Input id="branding-title" name="title" defaultValue={initialValues.title} />
        <p className="text-xs text-muted-foreground">{copy.fields.titleHint}</p>
        {fieldError(result?.fieldErrors, "title") ? (
          <p className="text-xs text-destructive">{fieldError(result?.fieldErrors, "title")}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="branding-logo-url">{copy.fields.logo}</Label>
        <Input id="branding-logo-url" name="logo_url" type="url" defaultValue={initialValues.logoUrl} />
        <p className="text-xs text-muted-foreground">{copy.fields.logoHint}</p>
        {fieldError(result?.fieldErrors, "logo_url") ? (
          <p className="text-xs text-destructive">{fieldError(result?.fieldErrors, "logo_url")}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="branding-primary-color">{copy.fields.color}</Label>
        <div className="flex items-center gap-3">
          <Input
            id="branding-primary-color"
            name="primary_color"
            type="color"
            defaultValue={initialValues.primaryColor || "#0f766e"}
            className="h-9 w-16 cursor-pointer p-1"
          />
          <span className="text-sm text-muted-foreground">{initialValues.primaryColor}</span>
        </div>
        {fieldError(result?.fieldErrors, "primary_color") ? (
          <p className="text-xs text-destructive">{fieldError(result?.fieldErrors, "primary_color")}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="branding-domain">{copy.fields.domain}</Label>
        <Input id="branding-domain" name="cname_domain" defaultValue={initialValues.cnameDomain} />
        <p className="text-xs text-muted-foreground">{copy.fields.domainHint}</p>
        {fieldError(result?.fieldErrors, "cname_domain") ? (
          <p className="text-xs text-destructive">{fieldError(result?.fieldErrors, "cname_domain")}</p>
        ) : null}
      </div>

      <FormStatus
        error={result?.error}
        success={result?.success}
        successMessage={result?.domainChanged ? copy.savedDomainChanged : copy.saved}
      />

      <Button type="submit" loading={loading} className="self-start">
        {loading ? copy.saving : copy.save}
      </Button>
    </form>
  );
}
