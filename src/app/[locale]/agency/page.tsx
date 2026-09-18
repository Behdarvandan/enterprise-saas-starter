import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default async function AgencyIndexPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  redirect({ href: "/agency/tenants", locale: locale as Locale });
}
