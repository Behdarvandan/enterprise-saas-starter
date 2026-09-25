import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/** Legacy route — /app/billing is canonical. Keeps stale links/bookmarks from 404ing. */
export default async function LegacySettingsBillingPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  redirect({ href: "/app/billing", locale: locale as Locale });
}
