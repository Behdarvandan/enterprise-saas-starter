"use client";

import { useState } from "react";
import { Badge } from "@/core/ui/primitives/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";

interface ColorPaletteCardCopy {
  title: string;
  primaryAccentLabel: string;
  sidebarBackgroundLabel: string;
  previewLabel: string;
}

function ColorField({
  id,
  label,
  previewLabel,
  value,
  onChange,
}: {
  id: string;
  label: string;
  previewLabel: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-16 cursor-pointer p-1"
        />
        <Badge
          variant="outline"
          className="gap-1.5"
          style={{ borderColor: value }}
        >
          <span
            aria-hidden
            className="size-2.5 rounded-full"
            style={{ backgroundColor: value }}
          />
          {previewLabel}
        </Badge>
      </div>
    </div>
  );
}

/** UI-only preview: color values are local state, not persisted anywhere. */
export default function ColorPaletteCard({
  primaryAccent,
  sidebarBackground,
  copy,
}: {
  primaryAccent: string;
  sidebarBackground: string;
  copy: ColorPaletteCardCopy;
}) {
  const [accent, setAccent] = useState(primaryAccent);
  const [sidebar, setSidebar] = useState(sidebarBackground);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ColorField
          id="white-label-primary-accent"
          label={copy.primaryAccentLabel}
          previewLabel={copy.previewLabel}
          value={accent}
          onChange={setAccent}
        />
        <ColorField
          id="white-label-sidebar-background"
          label={copy.sidebarBackgroundLabel}
          previewLabel={copy.previewLabel}
          value={sidebar}
          onChange={setSidebar}
        />
      </CardContent>
    </Card>
  );
}
