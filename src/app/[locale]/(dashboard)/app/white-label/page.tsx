import { getTranslations } from "next-intl/server";
import BrandAssetsCard from "./BrandAssetsCard";
import ColorPaletteCard from "./ColorPaletteCard";
import DomainSetupCard from "./DomainSetupCard";
import WidgetSnippetCard from "./WidgetSnippetCard";

interface MockBrandingState {
  appName: string;
  primaryAccent: string;
  sidebarBackground: string;
  domain: string;
  cnameTarget: string;
  domainStatus: "verified" | "pending";
}

const BRANDING: MockBrandingState = {
  appName: "Acme Workspace",
  primaryAccent: "#0f766e",
  sidebarBackground: "#18181b",
  domain: "app.acme.com",
  cnameTarget: "cname.pasargad.app",
  domainStatus: "pending",
};

export default async function WhiteLabelPage() {
  const t = await getTranslations("dashboard.whiteLabel");

  return (
    <div className="flex flex-col gap-1 p-6">
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t("description")}</p>

      <div className="flex flex-col gap-6">
        <BrandAssetsCard
          appName={BRANDING.appName}
          copy={{
            title: t("brandAssets.title"),
            appNameLabel: t("brandAssets.appNameLabel"),
            appNamePlaceholder: t("brandAssets.appNamePlaceholder"),
            logoLabel: t("brandAssets.logoLabel"),
            logoHint: t("brandAssets.logoHint"),
            faviconLabel: t("brandAssets.faviconLabel"),
            faviconHint: t("brandAssets.faviconHint"),
          }}
        />

        <ColorPaletteCard
          primaryAccent={BRANDING.primaryAccent}
          sidebarBackground={BRANDING.sidebarBackground}
          copy={{
            title: t("colorPalette.title"),
            primaryAccentLabel: t("colorPalette.primaryAccentLabel"),
            sidebarBackgroundLabel: t("colorPalette.sidebarBackgroundLabel"),
            previewLabel: t("colorPalette.previewLabel"),
          }}
        />

        <DomainSetupCard
          domain={BRANDING.domain}
          cnameTarget={BRANDING.cnameTarget}
          status={BRANDING.domainStatus}
          copy={{
            title: t("domain.title"),
            domainLabel: t("domain.domainLabel"),
            domainPlaceholder: t("domain.domainPlaceholder"),
            cnameLabel: t("domain.cnameLabel"),
            copyButton: t("domain.copyButton"),
            statusVerified: t("domain.statusVerified"),
            statusPending: t("domain.statusPending"),
          }}
        />

        <WidgetSnippetCard
          copy={{
            title: t("widget.title"),
            description: t("widget.description"),
            positionLabel: t("widget.positionLabel"),
            positionBottomRight: t("widget.positionBottomRight"),
            positionBottomLeft: t("widget.positionBottomLeft"),
            accentColorLabel: t("widget.accentColorLabel"),
            greetingLabel: t("widget.greetingLabel"),
            greetingPlaceholder: t("widget.greetingPlaceholder"),
            agentNameLabel: t("widget.agentNameLabel"),
            agentNamePlaceholder: t("widget.agentNamePlaceholder"),
            snippetLabel: t("widget.snippetLabel"),
            copyButton: t("widget.copyButton"),
            previewLabel: t("widget.previewLabel"),
          }}
        />
      </div>
    </div>
  );
}
