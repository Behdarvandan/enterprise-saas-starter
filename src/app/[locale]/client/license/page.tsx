import { KeyRound } from "lucide-react";
import { requireMembership } from "@/lib/auth";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { canRotateApiKey } from "@/lib/team";
import RotateApiKeyButton from "./RotateApiKeyButton";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  active: "success",
  suspended: "warn",
  cancelled: "error",
} as const;

export default async function ClientLicensePage() {
  const { supabase, membership } = await requireMembership();

  const { data: subscription } = await supabase
    .from("saas_subscriptions")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  if (!subscription) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-ink-primary">License</h1>
        <div className="mt-8">
          <EmptyState
            icon={KeyRound}
            title="No SaaS license"
            description="This organization doesn't have an active SaaS license yet."
          />
        </div>
      </div>
    );
  }

  const canRotate = canRotateApiKey(membership.role);
  const maskedKey = `${subscription.license_key.slice(0, 6)}••••••••${subscription.license_key.slice(-4)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">License</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Manage your SaaS license and API key.
      </p>

      <div className="mt-8 rounded-interactive border border-subtle bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Tier
            </p>
            <p className="mt-1 text-lg font-semibold capitalize text-ink-primary">
              {subscription.tier}
            </p>
          </div>
          <Badge tone={STATUS_TONE[subscription.status as keyof typeof STATUS_TONE]}>
            {subscription.status}
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Seats
            </p>
            <p className="mt-1 text-sm font-medium text-ink-primary">{subscription.seats}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              License key
            </p>
            <p className="mt-1 font-mono text-sm text-ink-primary">{maskedKey}</p>
          </div>
        </div>

        {canRotate && (
          <div className="mt-6 border-t border-subtle pt-4">
            <RotateApiKeyButton />
          </div>
        )}
      </div>
    </div>
  );
}
