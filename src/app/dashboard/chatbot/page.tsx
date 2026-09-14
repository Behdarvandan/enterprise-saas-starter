import { redirect } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserMembership } from "@/lib/team";
import Card from "@/components/ui/Card";
import KnowledgeBasePanel from "./KnowledgeBasePanel";
import ChatWidget from "@/components/chat-widget/ChatWidget";

export const dynamic = "force-dynamic";

interface ChatbotPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ChatbotPage({ searchParams }: ChatbotPageProps) {
  const { q } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const membership = await getUserMembership(user.id);
  if (!membership) redirect("/dashboard");

  const organizationId = membership.organizationId;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-control bg-violet/10 text-violet-dim">
          <MessageSquareText size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink-primary">AI Chatbot</h1>
          <p className="text-sm text-ink-muted">
            Manage your RAG knowledge base and test the embeddable assistant.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <KnowledgeBasePanel organizationId={organizationId} />

        <Card className="p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Embed the widget
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Drop the widget into any React page. It is already live in the
            bottom-right corner of this screen — try asking a question about an
            ingested document.
          </p>

          <pre className="mt-4 overflow-x-auto rounded-control border border-subtle bg-canvas p-4 font-mono text-xs leading-relaxed text-ink-muted">
            <code>{`import { ChatWidget } from "@/components/chat-widget";

<ChatWidget
  organizationId="${organizationId}"
  title="AI Assistant"
/>`}</code>
          </pre>

          <div className="mt-4 rounded-control border border-subtle bg-canvas p-4 text-xs text-ink-muted">
            <p className="font-semibold text-ink-primary">How it works</p>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>Ingest documents in the knowledge base panel.</li>
              <li>The visitor sends a prompt through the widget.</li>
              <li>Relevant chunks are retrieved via cosine similarity.</li>
              <li>The LLM streams a grounded answer in real time.</li>
            </ol>
          </div>
        </Card>
      </div>

      {/* Floating playground widget scoped to this tenant. */}
      <ChatWidget organizationId={organizationId} initialQuery={q} />
    </div>
  );
}
