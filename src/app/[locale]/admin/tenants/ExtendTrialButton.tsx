"use client";

import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { extendTrialAction } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/ui/primitives/dialog";
import { Button } from "@/core/ui/primitives/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface ExtendTrialButtonProps {
  organizationId: string;
  organizationName: string;
}

const DAY_OPTIONS = [7, 14, 30] as const;

export function ExtendTrialButton({ organizationId, organizationName }: ExtendTrialButtonProps) {
  const t = useTranslations("admin.tenants");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<(typeof DAY_OPTIONS)[number]>(14);
  const [loading, setLoading] = useState(false);

  const previewDate = format.dateTime(new Date(Date.now() + days * 24 * 60 * 60 * 1000), {
    dateStyle: "medium",
  });

  async function handleConfirm() {
    setLoading(true);
    const result = await extendTrialAction(organizationId, days);
    setLoading(false);

    if (result.error || !result.newTrialEndsAt) {
      toast({ tone: "error", title: result.error ?? t("extendTrialError") });
      return;
    }

    toast({
      tone: "success",
      title: t("extendTrialSuccess", {
        date: format.dateTime(new Date(result.newTrialEndsAt), { dateStyle: "medium" }),
      }),
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <CalendarClock aria-hidden className="size-3.5" />
        {t("extendTrial")}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("extendTrialDialogTitle", { name: organizationName })}</DialogTitle>
          <DialogDescription>
            {t("extendTrialDialogDescription", { days, date: previewDate })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          {DAY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
                days === option
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:border-ring hover:text-foreground",
              )}
            >
              {t(`days${option}` as "days7" | "days14" | "days30")}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            {t("extendTrialCancel")}
          </Button>
          <Button variant="default" onClick={handleConfirm} disabled={loading}>
            {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            {t("extendTrialConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
