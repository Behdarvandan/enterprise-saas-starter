import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/core/ui/primitives/card";
import ChunkingStrategyCard from "./ChunkingStrategyCard";
import DocumentTable from "./DocumentTable";
import DocumentUploadZone from "./DocumentUploadZone";
import HybridSearchWeightCard from "./HybridSearchWeightCard";

export type MockDocumentStatus = "processing" | "ready" | "failed";

/** Shaped to match the real `DocumentListItem` (src/types/index.ts) / `/api/rag/ingest` GET response, so wiring real data later is a drop-in swap. */
export interface MockDocument {
  id: string;
  title: string;
  sourceType: "file" | "text" | "url";
  status: MockDocumentStatus;
  createdAt: string;
  byteSize: number | null;
  mimeType: string | null;
  chunkCount: number;
  error: string | null;
}

const DOCUMENTS: MockDocument[] = [
  { id: "1", title: "Refund policy.pdf", sourceType: "file", status: "ready", createdAt: "2026-09-12T10:00:00Z", byteSize: 184_320, mimeType: "application/pdf", chunkCount: 14, error: null },
  { id: "2", title: "Onboarding checklist.md", sourceType: "file", status: "ready", createdAt: "2026-09-15T14:30:00Z", byteSize: 12_800, mimeType: "text/markdown", chunkCount: 6, error: null },
  { id: "3", title: "Pricing FAQ", sourceType: "text", status: "ready", createdAt: "2026-09-18T09:15:00Z", byteSize: 4_096, mimeType: "text/plain", chunkCount: 3, error: null },
  { id: "4", title: "Terms of service.pdf", sourceType: "file", status: "processing", createdAt: "2026-09-22T16:45:00Z", byteSize: 512_000, mimeType: "application/pdf", chunkCount: 0, error: null },
  { id: "5", title: "https://pasargad.ai/changelog", sourceType: "url", status: "processing", createdAt: "2026-09-23T08:20:00Z", byteSize: null, mimeType: null, chunkCount: 0, error: null },
  { id: "6", title: "Support macros.csv", sourceType: "file", status: "failed", createdAt: "2026-09-20T11:00:00Z", byteSize: 8_192, mimeType: "text/csv", chunkCount: 0, error: "extract_failed" },
  { id: "7", title: "Employee handbook.docx", sourceType: "file", status: "ready", createdAt: "2026-09-10T13:00:00Z", byteSize: 941_000, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", chunkCount: 52, error: null },
  { id: "8", title: "Shipping regions.json", sourceType: "file", status: "ready", createdAt: "2026-09-24T17:10:00Z", byteSize: 2_048, mimeType: "application/json", chunkCount: 2, error: null },
];

function formatStorage(totalBytes: number): string {
  const mb = totalBytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(totalBytes / 1024).toFixed(0)} KB`;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="glass">
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function KnowledgeEnginePage() {
  const t = await getTranslations("dashboard.knowledgeBase");

  const totalChunks = DOCUMENTS.reduce((sum, doc) => sum + doc.chunkCount, 0);
  const totalBytes = DOCUMENTS.reduce((sum, doc) => sum + (doc.byteSize ?? 0), 0);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <MetricCard label={t("metrics.totalDocuments")} value={String(DOCUMENTS.length)} />
        <MetricCard label={t("metrics.totalChunks")} value={String(totalChunks)} />
        <MetricCard label={t("metrics.storageUsed")} value={formatStorage(totalBytes)} />
      </div>

      <section className="grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-[360px_1fr]">
        <DocumentUploadZone
          copy={{
            dropzoneLabel: t("dropzone.label"),
            dropzoneTitle: t("dropzone.title"),
            dropzoneDragActive: t("dropzone.dragActive"),
            dropzoneHint: t("dropzone.hint", { size: 25 }),
            urlLabel: t("url.label"),
            urlPlaceholder: t("url.placeholder"),
            urlHint: t("url.hint"),
            urlSubmit: t("url.submit"),
          }}
        />
        <DocumentTable
          documents={DOCUMENTS}
          copy={{
            searchPlaceholder: t("list.searchPlaceholder"),
            filterAll: t("list.filterAll"),
            columns: {
              name: t("list.columns.name"),
              status: t("list.columns.status"),
              chunks: t("list.columns.chunks"),
              size: t("list.columns.size"),
              added: t("list.columns.added"),
            },
            status: {
              processing: t("list.status.processing"),
              ready: t("list.status.ready"),
              failed: t("list.status.failed"),
            },
            emptyTitle: t("list.emptyTitle"),
            emptyDescription: t("list.emptyDescription"),
          }}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-2">
        <ChunkingStrategyCard
          copy={{
            title: t("chunking.title"),
            description: t("chunking.description"),
            strategyRecursiveLabel: t("chunking.strategy.recursive"),
            strategySemanticLabel: t("chunking.strategy.semantic"),
            chunkSizeLabel: t("chunking.chunkSizeLabel"),
            overlapLabel: t("chunking.overlapLabel"),
            semanticThresholdLabel: t("chunking.semantic.thresholdLabel"),
            semanticHint: t("chunking.semantic.hint"),
            previewTemplate: t.raw("chunking.preview") as string,
          }}
        />
        <HybridSearchWeightCard
          copy={{
            title: t("hybridSearch.title"),
            description: t("hybridSearch.description"),
            denseLabelTemplate: t.raw("hybridSearch.denseLabel") as string,
            bm25LabelTemplate: t.raw("hybridSearch.bm25Label") as string,
          }}
        />
      </section>
    </div>
  );
}
