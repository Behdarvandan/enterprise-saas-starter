"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { updateSkillConfig } from "@/app/[locale]/dashboard/skills/actions";
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
import { Input } from "@/core/ui/primitives/input";
import { Label } from "@/core/ui/primitives/label";
import { toast } from "@/lib/toast";
import {
  buildSkillConfigSchema,
  defaultsFor,
  getSkillConfig,
  type NumberField,
} from "@/lib/skills/skill-config";
import type { SkillId } from "@/lib/skills-catalog";

interface SkillConfigDialogProps {
  skillId: SkillId;
  /** Current stored values, keyed by field. */
  values: Record<string, number>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Renders the settings form for one skill from its descriptor
 * (`lib/skills/skill-config`) — the same descriptor the Server Action
 * validates against — so adding a skill setting is a one-place change.
 */
export default function SkillConfigDialog({ skillId, values, open, onOpenChange }: SkillConfigDialogProps) {
  const t = useTranslations("dashboard.skills");
  const definition = getSkillConfig(skillId);
  const [draft, setDraft] = useState<Record<string, string>>(() => toDraft(values));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!definition) return null;
  const fields = definition.fields;
  const schema = buildSkillConfigSchema(fields);

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(toDraft(values));
      setError(undefined);
    }
    onOpenChange(next);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = Object.fromEntries(fields.map((f) => [f.key, Number(draft[f.key])]));
    if (!schema.safeParse(candidate).success) {
      setError(t("errors.invalidConfig"));
      return;
    }

    setError(undefined);
    startTransition(async () => {
      const result = await updateSkillConfig(skillId, candidate);
      if (result.error) {
        setError(result.error);
        return;
      }
      toast({ tone: "success", title: t("config.saved") });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{t("config.title", { skill: t(`catalog.${skillId}.title`) })}</DialogTitle>
            <DialogDescription>{t("config.description")}</DialogDescription>
          </DialogHeader>

          {fields.map((field) => (
            <FieldRow
              key={field.key}
              skillId={skillId}
              field={field}
              value={draft[field.key] ?? ""}
              disabled={pending}
              onChange={(next) => setDraft((current) => ({ ...current, [field.key]: next }))}
            />
          ))}

          <FormStatus error={error} successMessage="" />

          <DialogFooter className="items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setDraft(toDraft(defaultsFor(fields)))}
            >
              {t("config.reset")}
            </Button>
            <Button type="submit" loading={pending}>
              {t("config.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function toDraft(values: Record<string, number>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)]));
}

interface FieldRowProps {
  skillId: SkillId;
  field: NumberField;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

function FieldRow({ skillId, field, value, disabled, onChange }: FieldRowProps) {
  const t = useTranslations("dashboard.skills.config");
  const id = `${skillId}-${field.key}`;
  const numeric = Number(value);
  const invalid = value === "" || Number.isNaN(numeric) || numeric < field.min || numeric > field.max;

  // Field copy lives under `config.fields.<key>`; only rag_search's keys exist today.
  const label = field.key === "top_k" ? t("fields.top_k.label") : t("fields.similarity_threshold.label");
  const description =
    field.key === "top_k" ? t("fields.top_k.description") : t("fields.similarity_threshold.description");

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          dir="ltr"
          type="number"
          inputMode="decimal"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          disabled={disabled}
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.value)}
          className="w-24 text-end font-mono tabular-nums"
        />
      </div>
      <input
        dir="ltr"
        type="range"
        aria-label={label}
        min={field.min}
        max={field.max}
        step={field.step}
        value={invalid ? field.defaultValue : numeric}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-1.5 w-full cursor-pointer accent-violet-500"
      />
      <p className="text-xs text-slate-400">{description}</p>
      <p className={invalid ? "text-xs text-status-error" : "text-xs text-slate-400"}>
        {invalid
          ? t("invalid", { min: field.min, max: field.max })
          : t("range", { min: field.min, max: field.max, default: field.defaultValue })}
      </p>
    </div>
  );
}
