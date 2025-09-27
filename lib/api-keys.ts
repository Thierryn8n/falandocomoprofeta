import { supabase } from '@/lib/supabase'

// Cache para as chaves API para evitar múltiplas consultas
const apiKeysCache = new Map<string, { value: string; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Interface para configurações do Abacate Pay
export interface AbacatePayConfig {
  apiKey: string
  apiUrl: string
  webhookUrl: string
}

/**
 * Carrega uma chave API específica do banco de dados
 */
async function loadApiKey(provider: string, keyName?: string): Promise<string | null> {
  const cacheKey = `${provider}_${keyName || 'default'}`
  const cached = apiKeysCache.get(cacheKey)
  
  // Verificar cache
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.value
  }

  try {
    let query = supabase
      .from('payment_methods_config')
      .select('config_data')
      .eq('method_name', provider)
      .eq('is_enabled', true)
      .single()

    const { data, error } = await query

    if (error || !data) {
      console.warn(`Chave API não encontrada para ${provider}:${keyName}`)
      return null
    }

    const configData = data.config_data || {}
    let keyValue: string | null = null

    // Extrair a chave específica baseada no provider
    switch (provider) {
      case 'abacate_pay':
        if (keyName === 'api_key') keyValue = configData.api_key
        else if (keyName === 'api_url') keyValue = configData.api_url
        else if (keyName === 'webhook_url') keyValue = configData.webhook_url
        break
    }

    if (keyValue) {
      // Atualizar cache
      apiKeysCache.set(cacheKey, { value: keyValue, timestamp: Date.now() })
    }

    return keyValue
  } catch (error) {
    console.error(`Erro ao carregar chave API ${provider}:${keyName}:`, error)
    return null
  }
}

/**
 * Carrega todas as configurações do Abacate Pay
 */
export async function loadAbacatePayConfig(): Promise<AbacatePayConfig> {
  const [apiKey, apiUrl, webhookUrl] = await Promise.all([
    loadApiKey('abacate_pay', 'api_key'),
    loadApiKey('abacate_pay', 'api_url'),
    loadApiKey('abacate_pay', 'webhook_url')
  ])

  return {
    apiKey: apiKey || '',
    apiUrl: apiUrl || 'https://api.abacatepay.com',
    webhookUrl: webhookUrl || ''
  }
}

/**
 * Limpa o cache de chaves API (útil após atualizações)
 */
export function clearApiKeysCache(): void {
  apiKeysCache.clear()
}