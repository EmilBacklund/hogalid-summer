import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We run ESLint as a dedicated CI/pre-commit step (flat config), so skip the
  // duplicate lint pass during `next build`.
  eslint: { ignoreDuringBuilds: true },
};

// Sentry build-time wrapping. Source-map upload only runs when SENTRY_AUTH_TOKEN
// is present (CI/prod); locally and without a DSN this is inert.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
