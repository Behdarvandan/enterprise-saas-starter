"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Document } from "@/types";

type DocumentRow = Pick<
  Document,
  "id" | "title" | "source_type" | "status" | "created_at"
> & { chunk_count: number };

interface KnowledgeBasePanelProps {
  organizationId: string;
}

export default function KnowledgeBasePanel({
  organizationId,
}: KnowledgeBasePanelProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/rag/ingest");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = (await res.json()) as { documents?: DocumentRow[] };
      setDocuments(data.documents ?? []);
    } catch {
      setError("Could not load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleIngest() {
    if (!content.trim() || ingesting) return;

    setIngesting(true);
    setError(null);

    try {
      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title,
          content,
          sourceType: "text",
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Ingestion failed");
      }

      setContent("");
      setTitle("");
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingestion failed");
    } finally {
      setIngesting(false);
    }
  }

  async function handleDelete(documentId: string) {
    setDeletingId(documentId);
    setError(null);

    try {
      const res = await fetch(
        `/api/rag/ingest?documentId=${encodeURIComponent(documentId)}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Delete failed");
      }

      setDocuments((current) => current.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setContent(text);
      if (!title) setTitle(file.name);
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <section className="animate-reveal-up border border-subtle bg-surface p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Knowledge base
      </h2>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-ink-muted">
          Title
        </label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Refund policy"
          className="w-full rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-ink-muted">
          Content
        </label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={6}
          placeholder="Paste document text, guidelines, or FAQs…"
          className="w-full resize-y rounded-control border border-subtle bg-surface-raised px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-violet-dim"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={handleIngest} disabled={ingesting || !content.trim()}>
          {ingesting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Ingesting…
            </>
          ) : (
            <>
              <Upload size={16} />
              Ingest document
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText size={16} />
          Upload file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.csv,.json,.html,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="mt-3 text-sm text-status-error">{error}</p>}

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Ingested documents
        </h3>

        {loading ? (
          <div className="mt-3 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Ingest your first document above so the assistant has something to search."
          />
        ) : (
          <ul className="mt-3 divide-y divide-subtle">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">
                    {document.title}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {document.source_type} · {document.chunk_count} chunks
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      document.status === "ready"
                        ? "success"
                        : document.status === "failed"
                          ? "error"
                          : "warn"
                    }
                  >
                    {document.status}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleDelete(document.id)}
                    disabled={deletingId === document.id}
                    aria-label={`Delete ${document.title}`}
                    className="rounded-control p-1.5 text-ink-muted transition-colors hover:bg-status-error/10 hover:text-status-error disabled:opacity-50"
                  >
                    {deletingId === document.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
