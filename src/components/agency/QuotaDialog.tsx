"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";
import { allocateQuota } from "@/app/[locale]/agency/tenants/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormStatus from "@/components/ui/FormStatus";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { formatTokens } from "@/lib/agency/format";
import { toast } from "@/lib/toast";
import type { TenantRowData } from "./TenantTable";

interface QuotaDialogProps {
  tenant: TenantRowData;
  /** Pool tokens not allocated to any tenant yet. */
  poolUnallocated: number;
  onClose: () => void;
}

export default function QuotaDialog({ tenant, poolUnallocated, onClose }: QuotaDialogProps) {
  const t = useTranslations("agency.tenants.quota");
  const locale = useLocale();
  const router = useRouter();
  const fieldId = useId();
  const [value, setValue] = useState(String(tenant.granted));
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  // Re-allocating never refunds what was already used, and can't exceed what
  // the pool still covers on top of this tenant's current allocation.
  const consumed = Math.max(tenant.granted - tenant.remaining, 0);
  const max = tenant.granted + poolUnallocated;

  function validate(raw: string): string | undefined {
    if (!/^\d+$/.test(raw.trim())) return t("errors.digits");
    const amount = Number(raw);
    if (amount < consumed) return t("errors.min", { min: formatTokens(locale, consumed) });
    if (amount > max) return t("errors.max", { max: formatTokens(locale, max) });
    return undefined;
  }

  const fieldError = touched ? validate(value) : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setServerError(undefined);
    if (validate(value)) return;

    startTransition(async () => {
      const outcome = await allocateQuota(tenant.tenantId, value.trim());
      if (outcome.success) {
        toast({ tone: "success", title: t("saved", { name: tenant.name }) });
        router.refresh();
        onClose();
      } else {
        setServerError(outcome.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("title", { name: tenant.name })}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={fieldId}>{t("label")}</Label>
            <Input
              id={fieldId}
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={`${fieldId}-hint`}
              className="text-start font-mono tabular-nums"
            />
            {fieldError ? (
              <p role="alert" className="text-xs font-medium text-status-error">
                {fieldError}
              </p>
            ) : null}
            <p id={`${fieldId}-hint`} className="text-xs text-slate-400">
              {t("hint", { used: formatTokens(locale, consumed), max: formatTokens(locale, max) })}
            </p>
          </div>

          <FormStatus error={serverError} successMessage="" />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
