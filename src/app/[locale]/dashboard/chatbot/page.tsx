import { getTranslations } from "next-intl/server";
import ChatSimulator from "@/components/chat-widget/ChatSimulator";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/core/ui/primitives/card";
import { requireMembership } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ChatbotPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ChatbotPage({ searchParams }: ChatbotPageProps) {
  const { q } = await searchParams;
  const { membership } = await requireMembership();
  const organizationId = membership.organizationId;
  const t = await getTranslations("dashboard.chatbot");

  const steps = [t("how.step1"), t("how.step2"), t("how.step3"), t("how.step4")];

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChatSimulator organizationId={organizationId} initialQuery={q} />

        <div className="grid content-start gap-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{t("embed.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("embed.description")}</p>
            <pre
              dir="ltr"
              className="mt-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-start font-mono text-xs leading-relaxed text-primary"
            >
              <code>{`import { ChatWidget } from "@/components/chat-widget";

<ChatWidget
  organizationId="${organizationId}"
/>`}</code>
            </pre>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{t("how.title")}</h2>
            <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-sm text-muted-foreground marker:text-primary">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
