import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// One fixed zone for every render: the server and the browser must format
// dates identically or client components hydrate with mismatched markup. UTC
// also matches the booking engine, which anchors appointments to UTC.
const TIME_ZONE = "UTC";

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
      timeZone: TIME_ZONE,
      messages: (await import(`../../messages/${locale}.json`)).default,
    };
  } catch (error) {
    // A broken/missing catalog must not 500 the page: fall back to the
    // default locale's copy (same language as the URL's routing default).
    console.error(`[i18n] failed to load messages for "${locale}", using default locale:`, error);
    return {
      locale: routing.defaultLocale,
      timeZone: TIME_ZONE,
      messages: (await import(`../../messages/${routing.defaultLocale}.json`)).default,
    };
  }
});
