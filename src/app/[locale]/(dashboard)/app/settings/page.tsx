import { getTranslations } from "next-intl/server";
import ApiKeysCard from "./ApiKeysCard";
import SystemPreferencesCard from "./SystemPreferencesCard";
import VectorEngineCard from "./VectorEngineCard";

interface MockSettingsState {
  apiKeySuffix: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  defaultLocale: string;
  timezone: string;
  emailNotifications: boolean;
  productUpdates: boolean;
}

const SETTINGS: MockSettingsState = {
  apiKeySuffix: "9f2a",
  embeddingModel: "gemini-embedding-001",
  chunkSize: 1000,
  chunkOverlap: 200,
  defaultLocale: "en",
  timezone: "UTC",
  emailNotifications: true,
  productUpdates: false,
};

export default async function AppSettingsPage() {
  const t = await getTranslations("dashboard.appSettings");

  return (
    <div className="flex flex-col gap-1 p-6">
      <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t("description")}</p>

      <div className="flex flex-col gap-6">
        <ApiKeysCard
          apiKeySuffix={SETTINGS.apiKeySuffix}
          copy={{
            title: t("apiKeys.title"),
            currentKeyLabel: t("apiKeys.currentKeyLabel"),
            generateButton: t("apiKeys.generateButton"),
            copyButton: t("apiKeys.copyButton"),
            revealButton: t("apiKeys.revealButton"),
            hideButton: t("apiKeys.hideButton"),
          }}
        />

        <VectorEngineCard
          embeddingModel={SETTINGS.embeddingModel}
          chunkSize={SETTINGS.chunkSize}
          chunkOverlap={SETTINGS.chunkOverlap}
          copy={{
            title: t("vectorEngine.title"),
            embeddingModelLabel: t("vectorEngine.embeddingModelLabel"),
            chunkSizeLabel: t("vectorEngine.chunkSizeLabel"),
            chunkOverlapLabel: t("vectorEngine.chunkOverlapLabel"),
            syncButton: t("vectorEngine.syncButton"),
          }}
        />

        <SystemPreferencesCard
          defaultLocale={SETTINGS.defaultLocale}
          timezone={SETTINGS.timezone}
          emailNotifications={SETTINGS.emailNotifications}
          productUpdates={SETTINGS.productUpdates}
          copy={{
            title: t("preferences.title"),
            defaultLocaleLabel: t("preferences.defaultLocaleLabel"),
            timezoneLabel: t("preferences.timezoneLabel"),
            emailNotificationsLabel: t("preferences.emailNotificationsLabel"),
            productUpdatesLabel: t("preferences.productUpdatesLabel"),
          }}
        />
      </div>
    </div>
  );
}
