const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require("next-intl/plugin");

// Points at the request-config module since it lives under src/i18n
// instead of next-intl's default ./i18n/request.ts location.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
};

module.exports = withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  // Disable source map upload for now. To enable it, set SENTRY_ORG,
  // SENTRY_PROJECT, and SENTRY_AUTH_TOKEN and remove this `sourcemaps` block.
  sourcemaps: {
    disable: true,
  },
});
