import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Inter } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { routing, type Locale } from "@/i18n/routing";
import "../globals.css";

// Inter carries body/UI copy; Fraunces is reserved for headings and display
// text only — see CLAUDE.md §1.2. Geist Mono stays for code/mono contexts.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "common.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: "/favicon.svg",
    },
  };
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
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-canvas font-sans text-ink-primary antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
