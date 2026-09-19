"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { chunkText } from "@/lib/rag/chunking";
import { MAX_CONTENT_LENGTH } from "@/lib/rag/file-types";

const PREVIEW_LIMIT = 6;

interface TextIngestFormProps {
  onSubmit: (title: string, content: string) => void;
}

/**
 * Paste-text ingest with a live chunk preview: runs the same `chunkText` the
 * server uses, so what you see here is exactly how the document will be split.
 */
export default function TextIngestForm({ onSubmit }: TextIngestFormProps) {
  const t = useTranslations("dashboard.knowledgeBase.text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const chunks = useMemo(() => chunkText(content), [content]);
  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
  const tooLong = content.length > MAX_CONTENT_LENGTH;
  const canSubmit = content.trim().length > 0 && !tooLong;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit(title.trim(), content);
    setTitle("");
    setContent("");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="kb-title">{t("titleLabel")}</Label>
        <Input
          id="kb-title"
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("titlePlaceholder")}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="kb-content">{t("contentLabel")}</Label>
        <Textarea
          id="kb-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t("contentPlaceholder")}
          className="min-h-40"
          aria-invalid={tooLong}
        />
        {tooLong ? <p className="text-xs text-status-error">{t("tooLong")}</p> : null}
      </div>

      <section aria-label={t("preview.title")} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xs font-semibold text-slate-200">{t("preview.title")}</h3>
          {chunks.length > 0 ? (
            <p className="text-xs text-slate-400">
              {t("preview.summary", { count: chunks.length, tokens: totalTokens })}
            </p>
          ) : null}
        </div>

        {chunks.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">{t("preview.empty")}</p>
        ) : (
          <ol className="mt-3 grid gap-2">
            {chunks.slice(0, PREVIEW_LIMIT).map((chunk) => (
              <li key={chunk.index} className="rounded-md border border-slate-800 bg-slate-900/60 p-2.5">
                <p className="text-[11px] font-medium text-violet-300">
                  {t("preview.chunk", { index: chunk.index + 1 })}
                  <span className="ms-2 font-mono text-slate-400">
                    {t("preview.tokens", { count: chunk.tokenCount })}
                  </span>
                </p>
                <p className="mt-1 line-clamp-3 text-xs whitespace-pre-wrap text-slate-300">{chunk.content}</p>
              </li>
            ))}
            {chunks.length > PREVIEW_LIMIT ? (
              <li className="text-center text-xs text-slate-400">
                {t("preview.more", { count: chunks.length - PREVIEW_LIMIT })}
              </li>
            ) : null}
          </ol>
        )}
      </section>

      <div>
        <Button type="submit" disabled={!canSubmit}>
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
