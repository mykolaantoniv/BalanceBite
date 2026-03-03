/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.zakaz.ua' },
      { protocol: 'https', hostname: '*.zakaz.global' },
    ],
  },
  output: 'standalone',
}

module.exports = nextConfig