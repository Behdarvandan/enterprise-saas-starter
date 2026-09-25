import { getTranslations } from "next-intl/server";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Input } from "@/core/ui/primitives/input";
import { Slider } from "@/core/ui/primitives/slider";
import { Textarea } from "@/core/ui/primitives/textarea";
import KnowledgeBaseBindingCard from "./KnowledgeBaseBindingCard";
import PromptVariablesCard from "./PromptVariablesCard";
import TestPlaygroundCard from "./TestPlaygroundCard";
import ToolCallingCard from "./ToolCallingCard";

interface MockAgent {
  name: string;
  model: string;
  active: boolean;
}

/** Same 6 identities as /app/agents' ASSISTANTS, copied locally so this page renders a coherent agent for any [id]. */
const AGENTS: MockAgent[] = [
  { name: "Support triage", model: "Claude 3.5", active: true },
  { name: "Onboarding guide", model: "Llama 3.3", active: true },
  { name: "Booking assistant", model: "Claude 3.5", active: true },
  { name: "Invoice explainer", model: "Llama 3.3", active: false },
  { name: "Knowledge base search", model: "Claude 3.5", active: true },
  { name: "Escalation router", model: "Llama 3.3", active: false },
];

/** No real agent ids exist yet (the real ASSISTANTS array uses plain "1"-"6"), so any [id] is hashed onto the same pool for a stable, coherent identity. */
function resolveAgent(id: string): MockAgent {
  const sum = [...id].reduce((total, ch) => total + ch.charCodeAt(0), 0);
  return AGENTS[sum % AGENTS.length];
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = resolveAgent(id);
  const t = await getTranslations("dashboard.appAgentDetail");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{agent.name}</h1>
            <Badge variant={agent.active ? "default" : "secondary"}>
              {agent.active ? t("statusActive") : t("statusInactive")}
            </Badge>
            <Badge variant="outline">{agent.model}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t("agentIdLabel", { id })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary">
            {t("saveButton")}
          </Button>
          <Button type="button">{t("deployButton")}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="glass">
          <CardHeader>
            <CardTitle>{t("systemPrompt.title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="system-prompt-instructions" className="text-sm font-medium text-foreground">
                {t("systemPrompt.instructionsLabel")}
              </label>
              <Textarea
                id="system-prompt-instructions"
                rows={5}
                defaultValue="You are a helpful assistant for this workspace. Answer questions using the assigned knowledge base and escalate to a human when unsure."
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="system-prompt-temperature" className="text-sm font-medium text-foreground">
                  {t("systemPrompt.temperatureLabel")}
                </label>
                <span className="text-sm text-muted-foreground">0.7</span>
              </div>
              <Slider id="system-prompt-temperature" defaultValue={[0.7]} min={0} max={1} step={0.1} />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="system-prompt-max-tokens" className="text-sm font-medium text-foreground">
                {t("systemPrompt.maxTokensLabel")}
              </label>
              <Input id="system-prompt-max-tokens" type="number" defaultValue={2048} />
            </div>
          </CardContent>
        </Card>

        <KnowledgeBaseBindingCard
          copy={{
            title: t("knowledgeBase.title"),
            description: t("knowledgeBase.description"),
          }}
        />

        <ToolCallingCard
          copy={{
            title: t("tools.title"),
            description: t("tools.description"),
            webSearchLabel: t("tools.webSearch.label"),
            webhookLabel: t("tools.webhook.label"),
            webhookMethodLabel: t("tools.webhook.methodLabel"),
            webhookUrlLabel: t("tools.webhook.urlLabel"),
            webhookUrlPlaceholder: t("tools.webhook.urlPlaceholder"),
            sqlQueryLabel: t("tools.sqlQuery.label"),
            sqlTemplateLabel: t("tools.sqlQuery.templateLabel"),
            sqlTemplatePlaceholder: t("tools.sqlQuery.templatePlaceholder"),
            sqlMockHint: t("tools.sqlQuery.mockHint"),
          }}
        />

        <PromptVariablesCard
          copy={{
            title: t("variables.title"),
            description: t("variables.description"),
            keyLabel: t("variables.keyLabel"),
            defaultValueLabel: t("variables.defaultValueLabel"),
            addButton: t("variables.addButton"),
            removeButton: t("variables.removeButton"),
          }}
        />
      </div>

      <TestPlaygroundCard
        copy={{
          title: t("playground.title"),
          inputPlaceholder: t("playground.inputPlaceholder"),
          sendButton: t("playground.sendButton"),
          emptyHint: t("playground.emptyHint"),
          simulatedReply: t.raw("playground.simulatedReply") as string,
        }}
      />
    </div>
  );
}
