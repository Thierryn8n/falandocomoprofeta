/**
 * Configuração CORS restrita para API Routes
 * Use em todas as rotas da API para proteção adicional
 */

import { NextResponse } from 'next/server'

// Lista de origens permitidas (whitelist) - deve coincidir com middleware.ts
const ALLOWED_ORIGINS = [
  'https://falandocomoprofeta.com.br',
  'https://www.falandocomoprofeta.com.br',
  'https://falandocomoprofeta.vercel.app',
  'https://falandocomoprofeta-git-app-com-supabase-thierryn8n.vercel.app',
]

// Origens de desenvolvimento
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3007',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3007',
]

/**
 * Verifica se uma origem está permitida
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  
  const isDevelopment = process.env.NODE_ENV === 'development'
  const allowedOrigins = isDevelopment 
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
    : ALLOWED_ORIGINS
    
  return allowedOrigins.some(allowed => 
    origin === allowed || origin.startsWith(allowed)
  )
}

/**
 * Retorna a lista de origens permitidas como string (para headers)
 */
export function getAllowedOrigins(): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const allowedOrigins = isDevelopment 
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
    : ALLOWED_ORIGINS
  
  return allowedOrigins.join(', ')
}

/**
 * Cria uma resposta CORS bloqueada (403 Forbidden)
 */
export function createCorsBlockedResponse(origin: string) {
  console.warn(`🚫 API CORS blocked: ${origin}`)
  
  return NextResponse.json(
    { 
      error: 'CORS Error',
      message: 'Origin not authorized',
      code: 'CORS_FORBIDDEN'
    },
    { 
      status: 403,
      headers: {
        'Access-Control-Allow-Origin': 'null',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    }
  )
}

/**
 * Adiciona headers CORS a uma resposta existente
 */
export function addCorsHeaders(
  response: NextResponse, 
  origin: string | null
): NextResponse {
  const isAllowed = isOriginAllowed(origin)
  
  if (isAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else {
    response.headers.set('Access-Control-Allow-Origin', 'null')
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept'
  )
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Vary', 'Origin')
  
  // Headers de segurança
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  
  return response
}

/**
 * Wrapper para handlers de API com proteção CORS
 * Use assim:
 * 
 * export async function POST(request: NextRequest) {
 *   return withCorsProtection(request, async () => {
 *     // seu código aqui
 *     return NextResponse.json({ data })
 *   })
 * }
 */
export async function withCorsProtection(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const origin = request.headers.get('origin')
  
  // Verificar origem
  if (!isOriginAllowed(origin)) {
    return createCorsBlockedResponse(origin || 'unknown')
  }
  
  // Executar handler
  const response = await handler()
  
  // Adicionar headers CORS
  return addCorsHeaders(response, origin)
}

import type { NextRequest } from 'next/server'
