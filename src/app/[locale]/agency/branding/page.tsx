import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/core/ui/primitives/card";
import { parseAgencyBranding } from "@/lib/agency/branding";
import { requireAgencyAdmin } from "@/lib/agency/admin";
import { getCnameTarget } from "@/lib/agency/cname";
import BrandingForm from "./BrandingForm";
import DomainVerificationCard from "./DomainVerificationCard";

const VALID_STATUSES = ["pending", "active", "failed"] as const;

export default async function AgencyBrandingPage() {
  const { agency } = await requireAgencyAdmin();
  const t = await getTranslations("agency.branding");

  const branding = parseAgencyBranding(agency.branding);
  const status = VALID_STATUSES.includes(agency.cname_status as (typeof VALID_STATUSES)[number])
    ? (agency.cname_status as (typeof VALID_STATUSES)[number])
    : "pending";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <Card variant="section">
        <CardHeader>
          <CardTitle>{t("fields.title")}</CardTitle>
          <CardDescription>{t("fields.titleHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm
            initialValues={{
              title: branding.title ?? "",
              logoUrl: branding.logo_url ?? "",
              primaryColor: branding.primary_color ?? "",
              cnameDomain: agency.cname_domain ?? "",
            }}
            copy={{
              fields: {
                title: t("fields.title"),
                titleHint: t("fields.titleHint"),
                logo: t("fields.logo"),
                logoHint: t("fields.logoHint"),
                color: t("fields.color"),
                domain: t("fields.domain"),
                domainHint: t("fields.domainHint"),
              },
              save: t("save"),
              saving: t("saving"),
              saved: t("saved"),
              savedDomainChanged: t("savedDomainChanged"),
            }}
          />
        </CardContent>
      </Card>

      <DomainVerificationCard
        agencyId={agency.id}
        domain={agency.cname_domain}
        target={getCnameTarget()}
        initialStatus={status}
        copy={{
          title: t("dns.title"),
          description: t("dns.description"),
          noDomain: t("dns.noDomain"),
          addRecord: t("dns.addRecord"),
          recordType: t("dns.record.type"),
          recordName: t("dns.record.name"),
          recordValue: t("dns.record.value"),
          verify: t("dns.verify"),
          checking: t("dns.checking"),
          status: {
            pending: t("dns.status.pending"),
            active: t("dns.status.active"),
            failed: t("dns.status.failed"),
          },
          message: {
            pending: t("dns.message.pending", { domain: agency.cname_domain ?? "" }),
            active: t("dns.message.active", { domain: agency.cname_domain ?? "" }),
            failed: t("dns.message.failed", {
              domain: agency.cname_domain ?? "",
              target: getCnameTarget(),
            }),
          },
          lastChecked: t("dns.lastChecked"),
          neverChecked: t("dns.neverChecked"),
          genericError: t("dns.errors.generic"),
        }}
      />
    </div>
  );
}
