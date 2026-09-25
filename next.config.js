const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require("next-intl/plugin");

// Points at the request-config module since it lives under src/i18n
// instead of next-intl's default ./i18n/request.ts location.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
  // /repair-shops was folded into /services as an industry example (Pasargad
  // rebrand, brief §4). Keep old links/bookmarks working instead of 404ing.
  // /saas and /services were later renamed to /product and /solutions as
  // part of the customer-benefit-language IA rewrite — same reasoning.
  async redirects() {
    return [
      { source: "/repair-shops", destination: "/solutions", permanent: true },
      {
        source: "/:locale(tr|de|fa)/repair-shops",
        destination: "/:locale/solutions",
        permanent: true,
      },
      { source: "/saas", destination: "/product", permanent: true },
      { source: "/:locale(tr|de|fa)/saas", destination: "/:locale/product", permanent: true },
      { source: "/services", destination: "/solutions", permanent: true },
      { source: "/:locale(tr|de|fa)/services", destination: "/:locale/solutions", permanent: true },
      { source: "/services/:path*", destination: "/solutions/:path*", permanent: true },
      {
        source: "/:locale(tr|de|fa)/services/:path*",
        destination: "/:locale/solutions/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  // Disable source map upload for now. To enable it, set SENTRY_ORG,
  // SENTRY_PROJECT, and SENTRY_AUTH_TOKEN and remove this `sourcemaps` block.
  sourcemaps: {
    disable: true,
  },
});
