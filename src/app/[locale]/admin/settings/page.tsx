import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireOperatorAdmin, getOperatorOrganizationId } from "@/lib/operator";
import { asMembershipRole } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { supabase } = await requireOperatorAdmin();
  const operatorOrgId = await getOperatorOrganizationId();
  const [t, tRoles] = await Promise.all([getTranslations("admin.settings"), getTranslations("shell.roles")]);

  const { data: organization } = operatorOrgId
    ? await supabase.from("organizations").select("name, slug").eq("id", operatorOrgId).maybeSingle()
    : { data: null };

  const { data: members } = operatorOrgId
    ? await supabase.from("memberships").select("id, role, user_id").eq("organization_id", operatorOrgId)
    : { data: [] };

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const provider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? "stripe";
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const payTrConfigured = Boolean(process.env.PAYTR_MERCHANT_ID);
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const customDomainConfigured = Boolean(process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes("resend.dev"));

  const connected = t("integrations.connected");
  const notConfigured = t("integrations.notConfigured");

  function IntegrationRow({ label, isConnected }: { label: string; isConnected: boolean }) {
    return (
      <Card variant="item" className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-slate-100">{label}</span>
        {isConnected ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 aria-hidden size={14} />
            {connected}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <XCircle aria-hidden size={14} />
            {notConfigured}
          </span>
        )}
      </Card>
    );
  }

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title={t("title")} description={t("description")} />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t("tabs.general")}</TabsTrigger>
          <TabsTrigger value="team">{t("tabs.team")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("tabs.notifications")}</TabsTrigger>
          <TabsTrigger value="integrations">{t("tabs.integrations")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="p-6">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-400">{t("general.name")}</dt>
                <dd className="mt-1 text-sm text-slate-100">{organization?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-400">{t("general.slug")}</dt>
                <dd dir="ltr" className="mt-1 text-start font-mono text-sm text-slate-100">
                  {organization?.slug ?? "—"}
                </dd>
              </div>
            </dl>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card className="overflow-hidden">
            {(members ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">{t("team.empty")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("team.user")}</TableHead>
                    <TableHead>{t("team.role")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(members ?? []).map((member) => {
                    const profile = profileById.get(member.user_id);
                    const role = asMembershipRole(member.role);
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="text-slate-100">{profile?.full_name || profile?.email || member.user_id}</TableCell>
                        <TableCell className="text-slate-400">{role ? tRoles(role) : member.role}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            <p className="border-t border-slate-800 px-4 py-3 text-xs text-slate-400">{t("team.note")}</p>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card className="border-dashed p-6 text-center">
            <p className="text-sm font-medium text-slate-100">{t("notifications.title")}</p>
            <p className="mt-1 text-sm text-slate-400">{t("notifications.description")}</p>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <div className="space-y-3">
            <IntegrationRow
              label={t("integrations.payment", { provider })}
              isConnected={provider === "paytr" ? payTrConfigured : stripeConfigured}
            />
            <IntegrationRow label={t("integrations.email")} isConnected={resendConfigured} />
            {resendConfigured && !customDomainConfigured ? (
              <div role="note" className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                <AlertTriangle aria-hidden size={16} className="mt-0.5 shrink-0" />
                <p>
                  {t.rich("integrations.sandboxWarning", {
                    code: (chunks) => <code className="font-mono">{chunks}</code>,
                  })}
                </p>
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
