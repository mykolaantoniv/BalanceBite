/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.zakaz.ua' },
      { protocol: 'https', hostname: '*.zakaz.global' },
    ],
  },
  // Required for Azure - skip prerendering auth pages
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig