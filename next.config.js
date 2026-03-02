/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.zakaz.ua' },
      { protocol: 'https', hostname: '*.zakaz.global' },
    ],
  },
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Trust Azure's reverse proxy - needed for NextAuth cookies to work correctly
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Forwarded-Proto', value: 'https' },
        ],
      },
    ]
  },
}

module.exports = nextConfig