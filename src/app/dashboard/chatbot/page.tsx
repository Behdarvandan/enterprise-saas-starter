import { redirect } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserMembership } from "@/lib/team";
import KnowledgeBasePanel from "./KnowledgeBasePanel";
import ChatWidget from "@/components/chat-widget/ChatWidget";

export const dynamic = "force-dynamic";

export default async function ChatbotPage() {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          <MessageSquareText size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Chatbot</h1>
          <p className="text-sm text-slate-500">
            Manage your RAG knowledge base and test the embeddable assistant.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <KnowledgeBasePanel organizationId={organizationId} />

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Embed the widget
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Drop the widget into any React page. It is already live in the
            bottom-right corner of this screen — try asking a question about an
            ingested document.
          </p>

          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
            <code>{`import { ChatWidget } from "@/components/chat-widget";

<ChatWidget
  organizationId="${organizationId}"
  title="AI Assistant"
/>`}</code>
          </pre>

          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">How it works</p>
            <ol className="mt-2 list-inside list-decimal space-y-1">
              <li>Ingest documents in the knowledge base panel.</li>
              <li>The visitor sends a prompt through the widget.</li>
              <li>Relevant chunks are retrieved via cosine similarity.</li>
              <li>The LLM streams a grounded answer in real time.</li>
            </ol>
          </div>
        </section>
      </div>

      {/* Floating playground widget scoped to this tenant. */}
      <ChatWidget organizationId={organizationId} />
    </div>
  );
}
