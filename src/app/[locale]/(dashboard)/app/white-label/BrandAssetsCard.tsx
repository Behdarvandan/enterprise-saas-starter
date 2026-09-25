import { UploadCloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";

interface BrandAssetsCardCopy {
  title: string;
  appNameLabel: string;
  appNamePlaceholder: string;
  logoLabel: string;
  logoHint: string;
  faviconLabel: string;
  faviconHint: string;
}

/** UI-only placeholder: no Storage bucket wiring for logo/favicon uploads yet. */
export default function BrandAssetsCard({
  appName,
  copy,
}: {
  appName: string;
  copy: BrandAssetsCardCopy;
}) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="white-label-app-name" className="text-sm font-medium text-foreground">
            {copy.appNameLabel}
          </label>
          <Input id="white-label-app-name" defaultValue={appName} placeholder={copy.appNamePlaceholder} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">{copy.logoLabel}</span>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary hover:bg-accent">
              <input type="file" accept="image/png,image/svg+xml" className="sr-only" />
              <UploadCloud aria-hidden className="size-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{copy.logoHint}</p>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">{copy.faviconLabel}</span>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary hover:bg-accent">
              <input type="file" accept="image/x-icon,image/png" className="sr-only" />
              <UploadCloud aria-hidden className="size-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{copy.faviconHint}</p>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
