"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { updateTenantSkills } from "@/app/[locale]/agency/tenants/actions";
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
import { Switch } from "@/components/ui/switch";
import { getSkillLabel } from "@/lib/skills-catalog";
import type { TenantRowData } from "./TenantTable";

interface TenantSkillsDialogProps {
  tenant: TenantRowData;
  /** Skills the agency's own plan allows it to hand out. */
  allowedSkills: string[];
  onClose: () => void;
}

export default function TenantSkillsDialog({ tenant, allowedSkills, onClose }: TenantSkillsDialogProps) {
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
          <DialogTitle>Skills for {tenant.name}</DialogTitle>
          <DialogDescription>
            Choose what this tenant&apos;s AI assistant can do. Available skills depend on your
            agency plan.
          </DialogDescription>
        </DialogHeader>

        <div>
          {allowedSkills.map((skill) => {
            const label = getSkillLabel(skill);
            return (
              <div
                key={skill}
                className="flex items-center justify-between gap-4 border-b border-subtle py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-primary">{label.title}</p>
                  {label.description ? (
                    <p className="mt-0.5 text-xs text-ink-muted">{label.description}</p>
                  ) : null}
                </div>
                <Switch
                  checked={enabled.has(skill)}
                  onCheckedChange={() => toggle(skill)}
                  disabled={pending}
                  aria-label={`Toggle ${label.title}`}
                />
              </div>
            );
          })}
          {allowedSkills.length <= 1 ? (
            <p className="pt-3 text-xs text-ink-muted">
              Upgrade your agency plan to hand out more skills, such as calendar booking.
            </p>
          ) : null}
        </div>

        <FormStatus error={error} successMessage="" />

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending ? "Saving…" : "Save skills"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
