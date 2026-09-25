import { Check } from "lucide-react";
import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";
import { cn } from "@/lib/utils";

interface PlanTier {
  id: "starter" | "pro" | "enterprise";
  name: string;
  price: string;
  features: string[];
}

interface PlanComparisonGridCopy {
  title: string;
  currentBadge: string;
  upgradeButton: string;
}

/** UI-only: "Upgrade Plan" has no checkout wiring. Only one real Lemon Squeezy plan/variant exists in the codebase (no Starter/Enterprise variant IDs), so this grid is aspirational mock content. */
export default function PlanComparisonGrid({
  tiers,
  currentTierId,
  copy,
}: {
  tiers: PlanTier[];
  currentTierId: PlanTier["id"];
  copy: PlanComparisonGridCopy;
}) {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiers.map((tier) => {
          const isCurrent = tier.id === currentTierId;
          return (
            <Card
              key={tier.id}
              variant="glass"
              className={cn("flex flex-col gap-4 p-5", isCurrent && "border-primary")}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{tier.name}</p>
                {isCurrent && <Badge variant="secondary">{copy.currentBadge}</Badge>}
              </div>
              <p className="text-2xl font-semibold text-foreground">{tier.price}</p>
              <ul className="flex flex-1 flex-col gap-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button type="button" variant={isCurrent ? "secondary" : "default"} disabled={isCurrent}>
                {copy.upgradeButton}
              </Button>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
