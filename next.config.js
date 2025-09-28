const withPWA = require('next-pwa')({
  dest: 'public',
  register: false, // Vamos registrar manualmente
  skipWaiting: true,
  disable: false, // Habilitando PWA para testes
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Disable webpack cache for production builds
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
}

module.exports = withPWA(nextConfig)