const { withSentryConfig } = require("@sentry/nextjs");
const createNextIntlPlugin = require("next-intl/plugin");

// Points at the request-config module since it lives under src/i18n
// instead of next-intl's default ./i18n/request.ts location.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Baseline response headers applied to every route.
 *
 * The CSP is deliberately limited to directives that do not restrict script /
 * style / connect sources: Next.js inline bootstrap scripts, Sentry, PostHog
 * and Stripe.js need a nonce-based policy (via middleware) before
 * `script-src` can be tightened without breaking the app. These directives
 * already close clickjacking, `<base>` hijacking, plugin content and
 * cross-origin form posts.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    // Stripe Checkout is a full-page redirect, so `payment` stays disabled.
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Don't advertise the framework via `X-Powered-By`.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
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
