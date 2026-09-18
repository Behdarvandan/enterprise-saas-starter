import BrandingForm from "@/components/agency/BrandingForm";
import CnameVerifier from "@/components/agency/CnameVerifier";
import { Card } from "@/components/ui/card";
import { requireAgencyAdmin } from "@/lib/agency/admin";
import { parseAgencyBranding } from "@/lib/agency/branding";
import { getCnameTarget } from "@/lib/agency/cname";
import { normalizeCnameStatus } from "@/lib/agency/verify-response";

export const dynamic = "force-dynamic";

export default async function AgencyBrandingPage() {
  const { agency } = await requireAgencyAdmin();

  const branding = parseAgencyBranding(agency.branding);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-ink-primary">Branding &amp; domain</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Make the platform look like yours: your logo, colors and title, served from your own
        domain.
      </p>

      <Card className="animate-reveal-up mt-8 rounded-interactive p-6">
        <BrandingForm
          initial={{
            title: branding.title ?? "",
            logo_url: branding.logo_url ?? "",
            primary_color: branding.primary_color ?? "",
            cname_domain: agency.cname_domain ?? "",
          }}
        />
      </Card>

      <Card
        className="animate-reveal-up mt-6 rounded-interactive p-6"
        style={{ animationDelay: "60ms" }}
      >
        <h2 className="text-sm font-semibold text-ink-primary">Domain verification</h2>
        <p className="mb-5 mt-1 text-xs text-ink-muted">
          Your branding is only served on a domain once its CNAME record is verified.
        </p>
        {/* Keyed by the saved domain so a changed domain starts from a clean state. */}
        <CnameVerifier
          key={agency.cname_domain ?? "no-domain"}
          agencyId={agency.id}
          domain={agency.cname_domain}
          status={normalizeCnameStatus(agency.cname_status)}
          verifiedAt={agency.cname_verified_at}
          target={getCnameTarget()}
        />
      </Card>
    </div>
  );
}
