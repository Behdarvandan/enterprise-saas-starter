"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
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
import { formatTokens } from "@/lib/agency/format";
import type { TenantRowData } from "./TenantTable";

interface QuotaDialogProps {
  tenant: TenantRowData;
  /** Pool tokens not allocated to any tenant yet. */
  poolUnallocated: number;
  onClose: () => void;
}

export default function QuotaDialog({ tenant, poolUnallocated, onClose }: QuotaDialogProps) {
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
    if (!/^\d+$/.test(raw.trim())) return "Enter a whole number of tokens (0 or more).";
    const amount = Number(raw);
    if (amount < consumed) {
      return `Enter at least ${formatTokens(consumed)} — this tenant has already used that many.`;
    }
    if (amount > max) {
      return `Enter at most ${formatTokens(max)} — that's all your pool can cover for this tenant.`;
    }
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
            <DialogTitle>Allocate tokens to {tenant.name}</DialogTitle>
            <DialogDescription>
              Set this tenant&apos;s total token budget for the current period. Tokens it has
              already used stay counted.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={fieldId}>Total tokens</Label>
            <Input
              id={fieldId}
              inputMode="numeric"
              autoComplete="off"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={`${fieldId}-hint`}
              className="font-mono"
            />
            {fieldError ? (
              <p role="alert" className="text-xs font-medium text-status-error">
                {fieldError}
              </p>
            ) : null}
            <p id={`${fieldId}-hint`} className="font-mono text-xs text-ink-muted">
              Used so far: {formatTokens(consumed)} · Maximum you can set: {formatTokens(max)}
            </p>
          </div>

          <FormStatus error={serverError} successMessage="" />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save allocation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
