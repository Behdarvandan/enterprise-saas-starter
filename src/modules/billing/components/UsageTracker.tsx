import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { requireUser } from "@/lib/auth";
import { getUserMembership } from "@/lib/team";
import { getTenantUsage } from "@/modules/billing/service";

/**
 * Metered B2B usage for the caller's active organization (api_calls_count /
 * token_usage_count from `tenant_usage`, written by `incrementUsage()`).
 * This is usage-based billing data, not a plan-capped quota, so there is no
 * "limit" to show a percentage against — just the period's raw counts.
 * Resolves its own tenant instead of taking props: `Slot` renders module
 * contributions with zero props (see src/core/ui/slots/Slot.tsx), so every
 * slotted component is responsible for its own data.
 */
export default async function UsageTracker() {
  const t = await getTranslations("dashboard.billing.usage");
  const { user } = await requireUser();
  const membership = await getUserMembership(user.id);
  const usage = membership ? await getTenantUsage(membership.organizationId) : null;

  const metrics: { key: "apiCalls" | "tokens"; value: number }[] = usage
    ? [
        { key: "apiCalls", value: usage.apiCallsCount },
        { key: "tokens", value: usage.tokenUsageCount },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          metrics.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{t(`metrics.${item.key}`)}</span>
              <span dir="ltr" className="font-mono tabular-nums text-muted-foreground">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
