/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
