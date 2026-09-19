import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Inter, Vazirmatn } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, unstable_rethrow } from "next/navigation";
import type { CSSProperties } from "react";
import { AgencyBrandingProvider } from "@/components/providers/agency-branding-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { isRtlLocale, routing, type Locale } from "@/i18n/routing";
import { getBrandingCssVars } from "@/lib/agency/branding";
import { getAgencyContext } from "@/lib/agency/context";
import "../globals.css";

// Inter carries body/UI copy; Fraunces is reserved for the marketing site's
// display headings. Geist Mono carries metrics/code. Vazirmatn supplies the
// Persian glyphs Inter lacks (per-glyph fallback via unicode-range, so the
// file is only fetched when Persian text actually renders).
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  preload: false,
});
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// Shown only when the metadata translations can't be loaded.
const FALLBACK_TITLE = "Pasargad";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const agency = await getAgencyContext();

  try {
    const t = await getTranslations({ locale: locale as Locale, namespace: "common.metadata" });

    return {
      // White-label: an agency's custom domain shows the agency's own title.
      title: agency?.branding.title ?? t("title"),
      description: t("description"),
      icons: {
        icon: "/favicon.svg",
      },
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[layout] metadata translations failed, using static fallback:", error);
    return {
      title: agency?.branding.title ?? FALLBACK_TITLE,
      icons: { icon: "/favicon.svg" },
    };
  }
}

// The catalog is already guarded in i18n/request.ts; this is the last line
// of defence so an i18n failure renders untranslated keys instead of a 500.
async function loadMessagesSafely() {
  try {
    return await getMessages();
  } catch (error) {
    unstable_rethrow(error);
    console.error("[layout] getMessages failed, rendering without translations:", error);
    return {};
  }
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Enables static rendering for this locale (next-intl requirement).
  setRequestLocale(locale);
  const messages = await loadMessagesSafely();
  const agency = await getAgencyContext();

  return (
    <html
      lang={locale}
      dir={isRtlLocale(locale) ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${inter.variable} ${vazirmatn.variable} ${fraunces.variable} ${geistMono.variable}`}
      // Agency palette as CSS variables on <html>, so the very first paint
      // (and portaled dialogs under <body>) already use it.
      style={agency ? (getBrandingCssVars(agency.branding) as CSSProperties) : undefined}
    >
      <body className="min-h-screen bg-canvas font-sans text-ink-primary antialiased">
        <NextIntlClientProvider messages={messages}>
          <AgencyBrandingProvider agency={agency}>
            <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
              {children}
            </ThemeProvider>
          </AgencyBrandingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
