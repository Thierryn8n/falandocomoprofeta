import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lista de origens permitidas (whitelist)
const ALLOWED_ORIGINS = [
  'https://falandocomoprofeta.com.br',
  'https://www.falandocomoprofeta.com.br',
  'https://falandocomoprofeta.vercel.app',
  'https://falandocomoprofeta-git-app-com-supabase-thierryn8n.vercel.app',
  // Adicione mais domínios de produção aqui
]

// Origens de desenvolvimento (apenas em development)
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3007',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3007',
  'http://192.168.18.112:3000', // IP local do desenvolvedor
  'http://192.168.1.112:3000',  // IP alternativo
]

export function middleware(request: NextRequest) {
  // Verificar a origem da requisição
  const origin = request.headers.get('origin')
  const host = request.headers.get('host') || ''
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Verificar se a origem está permitida
  const allowedOrigins = isDevelopment 
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
    : ALLOWED_ORIGINS
    
  // Permitir se:
  // 1. Origem está na whitelist
  // 2. Sem origem (requisição same-origin)
  // 3. Em desenvolvimento e host é localhost
  // 4. Em desenvolvimento e origem é IP local (192.168.x.x ou 10.x.x.x)
  const isAllowedOrigin = allowedOrigins.some(allowed => 
    origin === allowed || (origin && origin.startsWith(allowed))
  ) || !origin || (isDevelopment && (
    host.includes('localhost') || host.includes('127.0.0.1')
  )) || (isDevelopment && origin && (
    origin.startsWith('http://192.168.') || 
    origin.startsWith('http://10.') ||
    origin.startsWith('https://192.168.') ||
    origin.startsWith('https://10.')
  ))

  // Resposta padrão
  const response = NextResponse.next()

  // Configurar headers CORS
  if (isAllowedOrigin && origin) {
    // Origem permitida - incluir no header
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (!origin && isAllowedOrigin) {
    // Requisição same-origin, não precisa de header CORS
    // Mas vamos definir para o host atual para compatibilidade
    const currentOrigin = isDevelopment ? `http://${host}` : `https://${host}`
    response.headers.set('Access-Control-Allow-Origin', currentOrigin)
  } else {
    // Origem não permitida - definir para 'null' para bloquear
    response.headers.set('Access-Control-Allow-Origin', 'null')
  }

  // Headers CORS restritos
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-Token, X-Api-Key'
  )
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400') // 24 horas
  
  // Headers de segurança adicionais
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // HSTS - Força HTTPS sempre (2 anos)
  response.headers.set('Strict-Transport-Security', 
    'max-age=63072000; includeSubDomains; preload'
  )
  
  // Política de permissões restritiva
  response.headers.set('Permissions-Policy', 
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  )

  // CSP (Content Security Policy) restritivo
  response.headers.set('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app https://*.supabase.co; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' blob: data: https://*.supabase.co https://*.vercel.app; " +
    "font-src 'self'; " +
    "media-src 'self' blob: data:; " +
    "connect-src 'self' https://*.supabase.co https://*.vercel.app https://*.googleapis.com; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  )

  // Responder imediatamente a requisições OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    if (!isAllowedOrigin) {
      // Bloquear preflight de origens não permitidas
      return new NextResponse(null, {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    })
  }

  // Log de requisições de origens não permitidas (para monitoramento)
  if (!isAllowedOrigin && origin) {
    console.warn(`🚫 CORS blocked request from unauthorized origin: ${origin}`)
    console.warn(`   Path: ${request.nextUrl.pathname}`)
    console.warn(`   Method: ${request.method}`)
    
    // Em produção, você pode querer retornar 403 para APIs
    // Mas para páginas normais, deixe passar com CORS bloqueado
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'CORS error: Origin not allowed',
          message: 'This origin is not authorized to access the API'
        }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'null',
          },
        }
      )
    }
  }

  return response
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    // Aplicar a todas as rotas exceto arquivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)$).*)',
  ],
}
