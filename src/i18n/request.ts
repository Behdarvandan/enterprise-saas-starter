import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  // Middleware already guarantees a valid locale segment; this fallback
  // only guards direct calls to getRequestConfig outside a routed request.
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  try {
    return {
      locale,
      messages: (await import(`../../messages/${locale}.json`)).default,
    };
  } catch (error) {
    // A broken/missing catalog must not 500 the page: fall back to the
    // default locale's copy (same language as the URL's routing default).
    console.error(`[i18n] failed to load messages for "${locale}", using default locale:`, error);
    return {
      locale: routing.defaultLocale,
      messages: (await import(`../../messages/${routing.defaultLocale}.json`)).default,
    };
  }
});
