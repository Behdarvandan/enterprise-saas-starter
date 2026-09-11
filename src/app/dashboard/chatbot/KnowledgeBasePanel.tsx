"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import Button from "@/components/ui/Button";

interface DocumentRow {
  id: string;
  title: string;
  source_type: string;
  status: string;
  chunk_count: number;
  created_at: string;
}

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
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
        Knowledge base
      </h2>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Title
        </label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Refund policy"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Content
        </label>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={6}
          placeholder="Paste document text, guidelines, or FAQs…"
          className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500"
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

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ingested documents
        </h3>

        {loading ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        ) : documents.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No documents yet. Ingest your first document to power the assistant.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {document.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {document.source_type} · {document.chunk_count} chunks
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    document.status === "ready"
                      ? "bg-emerald-100 text-emerald-700"
                      : document.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {document.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
