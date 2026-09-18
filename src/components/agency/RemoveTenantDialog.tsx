"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { unlinkTenant } from "@/app/[locale]/agency/tenants/actions";
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
import { formatTokens } from "@/lib/agency/format";
import type { TenantRowData } from "./TenantTable";

interface RemoveTenantDialogProps {
  tenant: TenantRowData;
  onClose: () => void;
}

/** Destructive confirmation: spells out exactly what removing a tenant does and doesn't do. */
export default function RemoveTenantDialog({ tenant, onClose }: RemoveTenantDialogProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleRemove() {
    setError(undefined);
    startTransition(async () => {
      const outcome = await unlinkTenant(tenant.tenantId);
      if (outcome.success) {
        router.refresh();
        onClose();
      } else {
        setError(outcome.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {tenant.name} from your agency?</DialogTitle>
          <DialogDescription>
            The organization and its data are not deleted. It simply stops being managed by your
            agency.
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>You lose access to its usage, chats and insights.</li>
          <li>
            Its {formatTokens(tenant.granted)}-token allocation returns to your pool, and its
            assistant stops drawing from it.
          </li>
          <li>You can link it again later, if its owner is you.</li>
        </ul>

        <FormStatus error={error} successMessage="" />

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Keep tenant
          </Button>
          <Button type="button" variant="destructive" onClick={handleRemove} disabled={pending}>
            {pending ? "Removing…" : "Remove tenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
