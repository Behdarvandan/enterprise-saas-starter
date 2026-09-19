"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import TenantPreview from "@/components/agency/TenantPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESETS = [
  { key: "violet", color: "#7c3aed" },
  { key: "emerald", color: "#059669" },
  { key: "amber", color: "#d97706" },
] as const;

const MAX_NAME_LENGTH = 24;

/**
 * Landing demo of the agency branding studio: the same scoped-CSS-variable
 * preview the agency portal renders, driven by a preset colour and a brand
 * name. Nothing is saved — it only shows what white-labelling looks like.
 */
export default function BrandingDemo() {
  const t = useTranslations("marketing.landing.whiteLabel.brand");
  const nameId = useId();
  const [color, setColor] = useState<string>(PRESETS[0].color);
  const [name, setName] = useState(() => t("sampleName"));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={nameId}>{t("nameLabel")}</Label>
          <Input
            id={nameId}
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">{t("colorLabel")}</span>
          <div className="flex gap-2" role="group" aria-label={t("colorLabel")}>
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                aria-pressed={color === preset.color}
                aria-label={t(`presets.${preset.key}`)}
                onClick={() => setColor(preset.color)}
                className={cn(
                  "size-9 rounded-lg border-2 transition-[transform,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                  color === preset.color ? "scale-105 border-slate-100" : "border-transparent hover:scale-105",
                )}
                style={{ backgroundColor: preset.color }}
              />
            ))}
          </div>
        </div>
      </div>

      <TenantPreview
        title={name}
        logoUrl={null}
        color={color}
        domain={t("domain")}
        onLogoError={() => undefined}
      />
    </div>
  );
}
