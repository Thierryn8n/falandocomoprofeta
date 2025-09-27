import { loadAbacatePayConfig } from '@/lib/api-keys'

// Cache para instâncias do Abacate Pay
let abacatePayConfig: any | null = null

// Abacate Pay instance - inicializa dinamicamente
export const getAbacatePayConfig = async () => {
  if (abacatePayConfig) {
    return abacatePayConfig
  }

  const config = await loadAbacatePayConfig()
  
  if (!config.apiKey) {
    console.warn('Chave API do Abacate Pay não configurada')
    return null
  }

  abacatePayConfig = config
  return abacatePayConfig
}

export const clearAbacatePayCache = () => {
  abacatePayConfig = null
}

// Abacate Pay configuration
export const ABACATE_PAY_CONFIG = {
  currency: 'BRL',
  country: 'BR',
  locale: 'pt-BR'
}

// Subscription plans
export const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    description: 'Acesso completo por 1 mês',
    price: 29.90,
    interval: 'month',
    features: [
      'Acesso completo ao sistema',
      'Suporte prioritário',
      'Atualizações automáticas'
    ]
  },
  {
    id: 'yearly',
    name: 'Plano Anual',
    description: 'Acesso completo por 1 ano',
    price: 299.90,
    interval: 'year',
    features: [
      'Acesso completo ao sistema',
      'Suporte prioritário',
      'Atualizações automáticas',
      '2 meses grátis'
    ]
  }
]

// Format price utility
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}

// Abacate Pay API Integration
export interface AbacatePayProduct {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  metadata?: Record<string, any>
}

export interface AbacatePayPaymentLink {
  id: string
  url: string
  product_id: string
  expires_at?: string
  metadata?: Record<string, any>
}

export interface AbacatePayLinkRequest {
  product_id: string
  customer_email?: string
  customer_name?: string
  success_url?: string
  cancel_url?: string
  metadata?: Record<string, any>
  expires_in?: number // em segundos
}

// Criar produto no Abacate Pay
export const createAbacatePayProduct = async (product: AbacatePayProduct): Promise<any> => {
  const config = await getAbacatePayConfig()
  
  if (!config) {
    throw new Error('Configuração do Abacate Pay não encontrada')
  }

  const response = await fetch(`${config.apiUrl}/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      metadata: product.metadata
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao criar produto: ${error}`)
  }

  return await response.json()
}

// Criar link de pagamento no Abacate Pay
export const createAbacatePayLink = async (linkRequest: AbacatePayLinkRequest): Promise<AbacatePayPaymentLink> => {
  const config = await getAbacatePayConfig()
  
  if (!config) {
    throw new Error('Configuração do Abacate Pay não encontrada')
  }

  const response = await fetch(`${config.apiUrl}/payment-links`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: linkRequest.product_id,
      customer_email: linkRequest.customer_email,
      customer_name: linkRequest.customer_name,
      success_url: linkRequest.success_url,
      cancel_url: linkRequest.cancel_url,
      metadata: linkRequest.metadata,
      expires_in: linkRequest.expires_in || 3600 // 1 hora por padrão
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao criar link de pagamento: ${error}`)
  }

  return await response.json()
}

// Buscar link de pagamento existente
export const getAbacatePayLink = async (linkId: string): Promise<AbacatePayPaymentLink> => {
  const config = await getAbacatePayConfig()
  
  if (!config) {
    throw new Error('Configuração do Abacate Pay não encontrada')
  }

  const response = await fetch(`${config.apiUrl}/payment-links/${linkId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao buscar link: ${error}`)
  }

  return await response.json()
}

// Listar produtos do Abacate Pay
export const listAbacatePayProducts = async (): Promise<AbacatePayProduct[]> => {
  const config = await getAbacatePayConfig()
  
  if (!config) {
    throw new Error('Configuração do Abacate Pay não encontrada')
  }

  const response = await fetch(`${config.apiUrl}/products`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao listar produtos: ${error}`)
  }

  const data = await response.json()
  return data.products || []
}