import { requireMembership } from "@/lib/auth";
import { canManageMembers } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_ENABLED_SKILLS, DEFAULT_ENABLED_SKILLS } from "@/lib/payment/handlers";
import { Card } from "@/components/ui/card";
import SkillsToggleForm from "./SkillsToggleForm";

export default async function SkillsPage() {
  const { supabase, membership } = await requireMembership();

  const { data: organization } = await supabase
    .from("organizations")
    .select("plan_id")
    .eq("id", membership.organizationId)
    .maybeSingle();

  const availableSkills =
    (organization?.plan_id && PLAN_ENABLED_SKILLS[organization.plan_id]) ||
    DEFAULT_ENABLED_SKILLS;

  // tenant_configs has no client-readable RLS policy (it carries system
  // prompts and skill grants — service-role only, see
  // supabase/migrations/20261119000000_tenant_configs_and_match_vectors_bridge.sql),
  // so this page reads it the same way team/actions.ts writes audit_logs:
  // via the admin client, gated by requireMembership() above and an
  // explicit organization_id filter in the query itself.
  const admin = createAdminClient();
  const { data: tenantConfig } = await admin
    .from("tenant_configs")
    .select("config")
    .eq("tenant_id", membership.organizationId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const crewConfig =
    (tenantConfig?.config as { crew_config?: { enabled_skills?: string[] } } | null)
      ?.crew_config ?? {};
  const enabledSkills = crewConfig.enabled_skills ?? DEFAULT_ENABLED_SKILLS;

  const canManage = canManageMembers(membership.role);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Skills</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Choose which capabilities your AI assistant can use in conversations.
      </p>

      <div className="mt-6">
        <Card className="animate-reveal-up p-6">
          {canManage ? (
            <SkillsToggleForm
              availableSkills={availableSkills}
              initialEnabledSkills={enabledSkills.filter((skill) =>
                availableSkills.includes(skill),
              )}
            />
          ) : (
            <p className="text-sm text-ink-muted">
              Only owners and admins can manage skills.
            </p>
          )}
        </Card>

        {availableSkills.length <= 1 && (
          <p className="mt-4 text-sm text-ink-muted">
            Upgrade your plan to unlock more skills like calendar booking.
          </p>
        )}
      </div>
    </div>
  );
}
