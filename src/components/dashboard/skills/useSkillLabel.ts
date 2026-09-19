"use client";

import { useTranslations } from "next-intl";
import { isSkillId } from "@/lib/skills-catalog";

/** Localized title/description for a skill id; unknown ids fall back to a readable id. */
export function useSkillLabel() {
  const t = useTranslations("dashboard.skills.catalog");

  return (skill: string): { title: string; description: string } =>
    isSkillId(skill)
      ? { title: t(`${skill}.title`), description: t(`${skill}.description`) }
      : { title: skill.replace(/_/g, " "), description: "" };
}
