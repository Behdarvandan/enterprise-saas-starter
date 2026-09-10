const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  // Disable source map upload for now. To enable it, set SENTRY_ORG,
  // SENTRY_PROJECT, and SENTRY_AUTH_TOKEN and remove this `sourcemaps` block.
  sourcemaps: {
    disable: true,
  },
});
