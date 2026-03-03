/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.zakaz.ua' },
      { protocol: 'https', hostname: '*.zakaz.global' },
    ],
  },
  output: 'standalone',
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_TRUST_HOST: 'true',
  },
}

module.exports = nextConfig