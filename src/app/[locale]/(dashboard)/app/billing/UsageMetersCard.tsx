import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { Progress } from "@/core/ui/primitives/progress";

interface UsageMetersCardCopy {
  title: string;
  vectorStorageLabel: string;
  tokenUsageLabel: string;
  apiCallsLabel: string;
}

function UsageRow({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <Progress value={percent} />
    </div>
  );
}

/** Vector storage is illustrative only (no real metric exists); token/API-call percentages are shaped to match the real usage_quotas/tenant_usage tables. */
export default function UsageMetersCard({
  vectorStoragePct,
  tokenUsagePct,
  apiCallsPct,
  copy,
}: {
  vectorStoragePct: number;
  tokenUsagePct: number;
  apiCallsPct: number;
  copy: UsageMetersCardCopy;
}) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <UsageRow label={copy.vectorStorageLabel} percent={vectorStoragePct} />
        <UsageRow label={copy.tokenUsageLabel} percent={tokenUsagePct} />
        <UsageRow label={copy.apiCallsLabel} percent={apiCallsPct} />
      </CardContent>
    </Card>
  );
}
