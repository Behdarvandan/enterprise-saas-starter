"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import ChunkPreviewSheet from "@/components/dashboard/knowledge-base/ChunkPreviewSheet";
import DocumentList from "@/components/dashboard/knowledge-base/DocumentList";
import DropZone from "@/components/dashboard/knowledge-base/DropZone";
import RetrievalSimulator from "@/components/dashboard/knowledge-base/RetrievalSimulator";
import TextIngestForm from "@/components/dashboard/knowledge-base/TextIngestForm";
import UploadQueue from "@/components/dashboard/knowledge-base/UploadQueue";
import { useDocuments } from "@/components/dashboard/knowledge-base/useDocuments";
import { useUploadQueue } from "@/components/dashboard/knowledge-base/useUploadQueue";
import { Card } from "@/core/ui/primitives/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/ui/primitives/tabs";
import type { DocumentListItem } from "@/types";

interface KnowledgeBasePanelProps {
  /** Advertised document cap for the plan; null when unlimited. */
  documentLimit: number | null;
}

/**
 * Knowledge base manager: drag-and-drop / paste ingestion with live per-file
 * status, the document table with chunk preview and bulk delete, and the
 * retrieval simulator. State lives in two hooks; children stay presentational.
 */
export default function KnowledgeBasePanel({ documentLimit }: KnowledgeBasePanelProps) {
  const t = useTranslations("dashboard.knowledgeBase");
  const { documents, loadError, refresh, remove } = useDocuments();
  const queue = useUploadQueue(refresh);
  const [previewing, setPreviewing] = useState<DocumentListItem | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="grid content-start gap-6">
        <Card className="p-5">
          <Tabs defaultValue="files">
            <TabsList>
              <TabsTrigger value="files">{t("tabs.files")}</TabsTrigger>
              <TabsTrigger value="text">{t("tabs.text")}</TabsTrigger>
            </TabsList>
            <TabsContent value="files" className="mt-4">
              <DropZone onFiles={queue.addFiles} />
            </TabsContent>
            <TabsContent value="text" className="mt-4">
              <TextIngestForm onSubmit={queue.addText} />
            </TabsContent>
          </Tabs>
          <UploadQueue items={queue.items} onRetry={queue.retry} onDismiss={queue.dismiss} />
        </Card>

        <DocumentList
          documents={documents}
          loadFailed={loadError !== null}
          onReload={() => void refresh()}
          onDelete={remove}
          onPreview={setPreviewing}
          limit={documentLimit}
        />
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <RetrievalSimulator />
      </div>

      <ChunkPreviewSheet document={previewing} onClose={() => setPreviewing(null)} />
    </div>
  );
}
