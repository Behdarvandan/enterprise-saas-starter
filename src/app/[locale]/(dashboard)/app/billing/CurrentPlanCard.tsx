import { Badge } from "@/core/ui/primitives/badge";
import { Button } from "@/core/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/primitives/card";

interface CurrentPlanCardCopy {
  title: string;
  planName: string;
  renewsLabel: string;
  statusActive: string;
  manageButton: string;
}

/** UI-only: "Manage Subscription" maps conceptually to POST /api/billing-portal, but is not wired here. */
export default function CurrentPlanCard({
  price,
  renewsOn,
  copy,
}: {
  price: string;
  renewsOn: string;
  copy: CurrentPlanCardCopy;
}) {
  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>{copy.title}</CardTitle>
        <Badge>{copy.statusActive}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-2xl font-semibold text-foreground">{copy.planName}</p>
          <p className="text-sm text-muted-foreground">
            {price} · {copy.renewsLabel} {renewsOn}
          </p>
        </div>
        <Button type="button" variant="secondary" className="self-start">
          {copy.manageButton}
        </Button>
      </CardContent>
    </Card>
  );
}
