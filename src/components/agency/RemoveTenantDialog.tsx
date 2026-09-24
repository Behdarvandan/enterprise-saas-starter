"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { unlinkTenant } from "@/app/[locale]/agency/tenants/actions";
import { Button } from "@/core/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/ui/primitives/dialog";
import FormStatus from "@/components/ui/FormStatus";
import { useRouter } from "@/i18n/navigation";
import { formatTokens } from "@/lib/agency/format";
import { toast } from "@/lib/toast";
import type { TenantRowData } from "./TenantTable";

interface RemoveTenantDialogProps {
  tenant: TenantRowData;
  onClose: () => void;
}

/** Destructive confirmation: spells out exactly what removing a tenant does and doesn't do. */
export default function RemoveTenantDialog({ tenant, onClose }: RemoveTenantDialogProps) {
  const t = useTranslations("agency.tenants.remove");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleRemove() {
    setError(undefined);
    startTransition(async () => {
      const outcome = await unlinkTenant(tenant.tenantId);
      if (outcome.success) {
        toast({ tone: "success", title: t("removed", { name: tenant.name }) });
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
          <DialogTitle>{t("title", { name: tenant.name })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1 ps-5 text-sm text-slate-400">
          <li>{t("loseAccess")}</li>
          <li>{t("returnsTokens", { tokens: formatTokens(locale, tenant.granted) })}</li>
          <li>{t("relink")}</li>
        </ul>

        <FormStatus error={error} successMessage="" />

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            {t("keep")}
          </Button>
          <Button type="button" variant="destructive" onClick={handleRemove} loading={pending}>
            {pending ? t("removing") : t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
