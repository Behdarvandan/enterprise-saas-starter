"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import FormStatus from "@/components/ui/FormStatus";
import { updateEnabledSkills } from "./actions";

const SKILL_LABELS: Record<string, { title: string; description: string }> = {
  rag_search: {
    title: "Knowledge base search (RAG)",
    description:
      "Let the assistant search your uploaded documents to ground its answers.",
  },
  calendar_booking: {
    title: "Calendar booking assistant",
    description:
      "Let the assistant check appointment availability for your services.",
  },
};

interface SkillsToggleFormProps {
  availableSkills: string[];
  initialEnabledSkills: string[];
}

export default function SkillsToggleForm({
  availableSkills,
  initialEnabledSkills,
}: SkillsToggleFormProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(new Set(initialEnabledSkills));
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: boolean }>({});

  function toggle(skill: string) {
    setResult({});
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(skill)) {
        next.delete(skill);
      } else {
        next.add(skill);
      }
      return next;
    });
  }

  function handleSave() {
    setResult({});
    startTransition(async () => {
      const outcome = await updateEnabledSkills(Array.from(enabled));
      setResult(outcome);
      if (outcome.success) router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      {availableSkills.map((skill) => {
        const label = SKILL_LABELS[skill] ?? { title: skill, description: "" };
        return (
          <div
            key={skill}
            className="flex items-center justify-between gap-4 border-b border-subtle py-4 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-primary">{label.title}</p>
              {label.description && (
                <p className="mt-0.5 text-xs text-ink-muted">{label.description}</p>
              )}
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

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <FormStatus
          error={result.error}
          success={result.success}
          successMessage="Skills updated."
        />
      </div>
    </div>
  );
}
