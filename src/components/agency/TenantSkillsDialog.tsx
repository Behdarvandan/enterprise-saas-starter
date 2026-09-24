"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { updateTenantSkills } from "@/app/[locale]/agency/tenants/actions";
import { useSkillLabel } from "@/components/dashboard/skills/useSkillLabel";
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
import { Switch } from "@/core/ui/primitives/switch";
import { useRouter } from "@/i18n/navigation";
import { toast } from "@/lib/toast";
import type { TenantRowData } from "./TenantTable";

interface TenantSkillsDialogProps {
  tenant: TenantRowData;
  /** Skills the agency's own plan allows it to hand out. */
  allowedSkills: string[];
  onClose: () => void;
}

export default function TenantSkillsDialog({ tenant, allowedSkills, onClose }: TenantSkillsDialogProps) {
  const t = useTranslations("agency.tenants.skills");
  const skillLabel = useSkillLabel();
  const router = useRouter();
  const [enabled, setEnabled] = useState(
    () => new Set(tenant.enabledSkills.filter((skill) => allowedSkills.includes(skill))),
  );
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function toggle(skill: string) {
    setError(undefined);
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }

  function handleSave() {
    setError(undefined);
    startTransition(async () => {
      const outcome = await updateTenantSkills(tenant.tenantId, Array.from(enabled));
      if (outcome.success) {
        toast({ tone: "success", title: t("saved", { name: tenant.name }) });
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

        <div>
          {allowedSkills.map((skill) => {
            const label = skillLabel(skill);
            return (
              <div
                key={skill}
                className="flex items-center justify-between gap-4 border-b border-slate-800 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">{label.title}</p>
                  {label.description ? <p className="mt-0.5 text-xs text-slate-400">{label.description}</p> : null}
                </div>
                <Switch
                  checked={enabled.has(skill)}
                  onCheckedChange={() => toggle(skill)}
                  disabled={pending}
                  aria-label={t("toggle", { skill: label.title })}
                />
              </div>
            );
          })}
          {allowedSkills.length <= 1 ? <p className="pt-3 text-xs text-slate-400">{t("upgradeHint")}</p> : null}
        </div>

        <FormStatus error={error} successMessage="" />

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSave} loading={pending}>
            {pending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
