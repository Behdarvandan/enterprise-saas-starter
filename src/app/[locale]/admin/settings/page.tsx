import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { requireOperatorAdmin, getOperatorOrganizationId } from "@/lib/operator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { supabase } = await requireOperatorAdmin();
  const operatorOrgId = await getOperatorOrganizationId();

  const { data: organization } = operatorOrgId
    ? await supabase.from("organizations").select("name, slug").eq("id", operatorOrgId).maybeSingle()
    : { data: null };

  const { data: members } = operatorOrgId
    ? await supabase
        .from("memberships")
        .select("id, role, user_id")
        .eq("organization_id", operatorOrgId)
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
  const customDomainConfigured = Boolean(
    process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes("resend.dev"),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-semibold text-ink-primary">Ayarlar</h1>
      <p className="mt-1 text-sm text-ink-muted">
        İşletme bilgileri, ekip ve entegrasyon durumu.
      </p>

      <Tabs defaultValue="general" className="mt-8">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="team">Ekip</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="integrations">Entegrasyonlar</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="mt-4 rounded-interactive border border-subtle bg-surface p-6">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  İşletme adı
                </dt>
                <dd className="mt-1 text-sm text-ink-primary">{organization?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Slug
                </dt>
                <dd className="mt-1 font-mono text-sm text-ink-primary">
                  {organization?.slug ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="mt-4 overflow-hidden rounded-interactive border border-subtle bg-surface">
            {(members ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-ink-muted">
                Ekip üyesi bulunamadı.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-subtle bg-surface-raised text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Kullanıcı</th>
                    <th className="px-4 py-3">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {(members ?? []).map((member) => {
                    const profile = profileById.get(member.user_id);
                    return (
                      <tr key={member.id} className="border-b border-subtle last:border-0">
                        <td className="px-4 py-3 text-ink-primary">
                          {profile?.full_name || profile?.email || member.user_id}
                        </td>
                        <td className="px-4 py-3 capitalize text-ink-muted">{member.role}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <p className="border-t border-subtle px-4 py-3 text-xs text-ink-muted">
              Bugün tek kullanıcı — çoklu ekip/rol yönetimi ilerideki bir sürüm için ayrılmıştır.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="mt-4 rounded-interactive border border-dashed border-subtle bg-surface p-6 text-center">
            <p className="text-sm font-medium text-ink-primary">Yakında</p>
            <p className="mt-1 text-sm text-ink-muted">
              Bildirim tercihleri henüz yapılandırılabilir değil.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="mt-4 space-y-3">
            <IntegrationRow
              label={`Ödeme sağlayıcı (${provider})`}
              connected={provider === "paytr" ? payTrConfigured : stripeConfigured}
            />
            <IntegrationRow label="Resend (e-posta)" connected={resendConfigured} />

            {resendConfigured && !customDomainConfigured && (
              <div className="flex items-start gap-2.5 rounded-interactive border border-status-warn/30 bg-status-warn/10 p-4 text-sm text-status-warn">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>
                  Özel bir gönderim alan adı yapılandırılmamış — üretim e-postaları Resend&apos;in
                  sandbox göndericisinden (<code className="font-mono">resend.dev</code>) gidiyor
                  ve yalnızca hesabın kendi doğrulanmış adresine ulaşıyor, gerçek müşterilere
                  değil. <code className="font-mono">EMAIL_FROM</code> ortam değişkenini
                  doğrulanmış bir alan adıyla ayarlayın.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IntegrationRow({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-interactive border border-subtle bg-surface px-4 py-3">
      <span className="text-sm font-medium text-ink-primary">{label}</span>
      {connected ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-status-success">
          <CheckCircle2 size={14} />
          Bağlı
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
          <XCircle size={14} />
          Yapılandırılmadı
        </span>
      )}
    </div>
  );
}
