import { getTranslations } from "next-intl/server";
import BrandingStudio from "@/components/agency/BrandingStudio";
import DnsStatusPanel from "@/components/agency/DnsStatusPanel";
import PageHeader, { PageContainer } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAgencyAdmin } from "@/lib/agency/admin";
import { parseAgencyBranding } from "@/lib/agency/branding";
import { getCnameTarget } from "@/lib/agency/cname";
import { getCnameCheckState } from "@/lib/agency/cname-state";
import { normalizeCnameStatus } from "@/lib/agency/verify-response";

export const dynamic = "force-dynamic";

export default async function AgencyBrandingPage() {
  const { supabase, agency } = await requireAgencyAdmin();
  const t = await getTranslations("agency.branding");

  const branding = parseAgencyBranding(agency.branding);
  const checkState = await getCnameCheckState(supabase, agency.id);

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <Card className="p-6">
        {/* Keyed by the saved values so a successful save re-seeds the form from the server. */}
        <BrandingStudio
          key={JSON.stringify([branding, agency.cname_domain])}
          initial={{
            title: branding.title ?? "",
            logo_url: branding.logo_url ?? "",
            primary_color: branding.primary_color ?? "",
            cname_domain: agency.cname_domain ?? "",
          }}
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dns.title")}</CardTitle>
          <CardDescription>{t("dns.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Keyed by the saved domain so a changed domain starts from a clean state. */}
          <DnsStatusPanel
            key={agency.cname_domain ?? "no-domain"}
            agencyId={agency.id}
            domain={agency.cname_domain}
            status={normalizeCnameStatus(agency.cname_status)}
            verifiedAt={agency.cname_verified_at}
            lastCheckedAt={checkState.lastCheckedAt}
            lastRecords={checkState.records}
            target={getCnameTarget()}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
