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

export default nextConfig;


