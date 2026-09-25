"use client";

import { type DragEvent, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { cn } from "@/lib/utils";

interface DocumentUploadZoneCopy {
  dropzoneLabel: string;
  dropzoneTitle: string;
  dropzoneDragActive: string;
  dropzoneHint: string;
  urlLabel: string;
  urlPlaceholder: string;
  urlHint: string;
  urlSubmit: string;
}

/** UI-only placeholder: no real upload or URL-fetch wiring exists yet (no Storage bucket, no scraper). */
export default function DocumentUploadZone({ copy }: { copy: DocumentUploadZoneCopy }) {
  const [dragActive, setDragActive] = useState(false);

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave() {
    setDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragActive(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card variant="glass">
        <CardContent className="p-4">
          <label
            aria-label={copy.dropzoneLabel}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-8 text-center transition-colors",
              dragActive && "border-primary bg-accent",
            )}
          >
            <input type="file" multiple className="sr-only" />
            <UploadCloud aria-hidden className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {dragActive ? copy.dropzoneDragActive : copy.dropzoneTitle}
            </p>
            <p className="text-xs text-muted-foreground">{copy.dropzoneHint}</p>
          </label>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardContent className="flex flex-col gap-2 p-4">
          <label htmlFor="knowledge-url" className="text-sm font-medium text-foreground">
            {copy.urlLabel}
          </label>
          <Input id="knowledge-url" type="url" placeholder={copy.urlPlaceholder} />
          <p className="text-xs text-muted-foreground">{copy.urlHint}</p>
          <Button variant="default" size="sm" className="mt-1 self-start" disabled>
            {copy.urlSubmit}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
