import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/core/ui/primitives/card";
import AssistantTestDrawer from "./AssistantTestDrawer";

type MockAssistant = {
  id: string;
  name: string;
  description: string;
  model: "Llama 3.3" | "Claude 3.5" | (string & {});
  active: boolean;
  connectedDocuments: number;
};

/** No assistant/agent domain model exists yet in the codebase — placeholder data for this first pass. */
const ASSISTANTS: MockAssistant[] = [
  { id: "1", name: "Support triage", description: "Answers common billing and account questions.", model: "Claude 3.5", active: true, connectedDocuments: 12 },
  { id: "2", name: "Onboarding guide", description: "Walks new customers through initial setup.", model: "Llama 3.3", active: true, connectedDocuments: 4 },
  { id: "3", name: "Booking assistant", description: "Handles appointment scheduling and rescheduling.", model: "Claude 3.5", active: true, connectedDocuments: 7 },
  { id: "4", name: "Invoice explainer", description: "Answers questions about line items and charges.", model: "Llama 3.3", active: false, connectedDocuments: 3 },
  { id: "5", name: "Knowledge base search", description: "Finds answers from your own documents.", model: "Claude 3.5", active: true, connectedDocuments: 21 },
  { id: "6", name: "Escalation router", description: "Decides when a conversation needs a human.", model: "Llama 3.3", active: false, connectedDocuments: 2 },
];

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      data-active={active || undefined}
      className="size-2 shrink-0 rounded-full bg-muted data-[active]:animate-status-pulse data-[active]:bg-primary-hover"
    />
  );
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

export default function AgentsStudioPage() {
  const activeCount = ASSISTANTS.filter((a) => a.active).length;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <MetricCard label="Total assistants" value={String(ASSISTANTS.length)} />
        <MetricCard label="Active executions" value={String(activeCount)} />
        <MetricCard label="Monthly token usage" value="1.2M" />
      </div>

      <section className="grid grid-cols-1 gap-4 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
        {ASSISTANTS.map((assistant) => (
          <Card key={assistant.id} variant="item">
            <CardHeader>
              <div className="flex items-center gap-2">
                <StatusDot active={assistant.active} />
                <CardTitle>{assistant.name}</CardTitle>
              </div>
              <CardDescription>{assistant.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-2 pt-0">
              <Badge variant="secondary">{assistant.model}</Badge>
              <span className="text-xs text-muted-foreground">
                {assistant.connectedDocuments} document{assistant.connectedDocuments === 1 ? "" : "s"}
              </span>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="default" size="sm">
                Edit
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  Logs
                </Button>
                <AssistantTestDrawer assistantName={assistant.name}>
                  <Button variant="ghost" size="sm">
                    Test
                  </Button>
                </AssistantTestDrawer>
              </div>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
}
