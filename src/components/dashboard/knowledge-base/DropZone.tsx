"use client";

import { UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { ACCEPT_ATTRIBUTE, MAX_FILE_BYTES } from "@/lib/rag/file-types";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
}

/** Drag-and-drop target that is also a keyboard-operable file picker. */
export default function DropZone({ onFiles }: DropZoneProps) {
  const t = useTranslations("dashboard.knowledgeBase.dropzone");
  const inputRef = useRef<HTMLInputElement>(null);
  // dragenter/dragleave fire for every child; a counter avoids flicker.
  const depth = useRef(0);
  const [active, setActive] = useState(false);

  function open() {
    inputRef.current?.click();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    depth.current = 0;
    setActive(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onFiles(files);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("label")}
      onClick={open}
      onKeyDown={onKeyDown}
      onDragEnter={(event) => {
        event.preventDefault();
        depth.current += 1;
        setActive(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setActive(false);
      }}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-muted/40 hover:border-border hover:bg-secondary/50",
      )}
    >
      <UploadCloud aria-hidden className={cn("size-8", active ? "text-primary" : "text-muted-foreground")} />
      <p className="text-sm font-medium text-foreground">{active ? t("dragActive") : t("title")}</p>
      <p className="text-xs text-muted-foreground">{t("hint", { size: MAX_FILE_BYTES / (1024 * 1024) })}</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPT_ATTRIBUTE}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) onFiles(files);
          // Reset so picking the same file again still fires `change`.
          event.target.value = "";
        }}
      />
    </div>
  );
}
