// Lista de origens permitidas (whitelist)
const ALLOWED_ORIGINS = [
  'https://falandocomoprofeta.com.br',
  'https://www.falandocomoprofeta.com.br',
  'https://falandocomoprofeta.vercel.app',
  'https://falandocomoprofeta-git-app-com-supabase-thierryn8n.vercel.app',
]

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/bible-study',
        destination: '/bible-study-miro',
        permanent: true,
      },
    ]
  },
  
  // Configuração CORS restrita via headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const allowedOrigins = isDevelopment 
      ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
      : ALLOWED_ORIGINS
    
    return [
      {
        // Aplicar a todas as rotas
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, Accept, X-Api-Key',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
          // Headers de segurança
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // CSP restritivo
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.supabase.co https://*.vercel.app; font-src 'self'; connect-src 'self' https://*.supabase.co https://*.vercel.app https://*.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
          },
        ],
      },
      // Headers específicos para APIs
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Vary',
            value: 'Origin',
          },
        ],
      },
    ]
  },
  
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
}

module.exports = nextConfig