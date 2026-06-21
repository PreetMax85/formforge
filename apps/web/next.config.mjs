import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages are raw TypeScript — tell Next/Turbopack to transpile them.
  transpilePackages: [
    '@repo/shared',
    '@repo/db',
    '@repo/trpc',
    '@repo/email',
    '@repo/ui',
  ],
};

export default withSentryConfig(nextConfig, {
  // Only manifest + source map upload in production builds.
  silent: true,
  // Hide source maps from being served publicly.
  hideSourceMaps: true,
  // Upload broader client files for better stack traces.
  widenClientFileUpload: true,
  // Disable build-time telemetry noise.
  disableLogger: true,
});


