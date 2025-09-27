import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role key para operações administrativas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Interface para configuração do Abacate Pay
interface AbacatePayConfig {
  apiKey: string
  apiUrl: string
  webhookUrl: string
  webhookSecret: string
  enabled: boolean
  testMode: boolean
  useExternalSystem: boolean
}

// GET - Buscar configurações do Abacate Pay
export async function GET() {
  try {
    // Buscar configuração do Abacate Pay no banco
    const { data: config, error } = await supabase
      .from('payment_methods_config')
      .select('config_data, is_enabled')
      .eq('method_name', 'abacate_pay')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Abacate Pay config:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar configurações' },
        { status: 500 }
      )
    }

    // Se não existe configuração, retornar valores padrão
    if (!config) {
      return NextResponse.json({
        apiKey: '',
        apiUrl: 'https://api.abacatepay.com',
        webhookUrl: '',
        webhookSecret: '',
        enabled: false,
        testMode: true,
        useExternalSystem: false
      })
    }

    // Retornar configuração existente
    const configData = config.config_data || {}
    return NextResponse.json({
      apiKey: configData.api_key || '',
      apiUrl: configData.api_url || 'https://api.abacatepay.com',
      webhookUrl: configData.webhook_url || '',
      webhookSecret: configData.webhook_secret || '',
      enabled: config.is_enabled || false,
      testMode: configData.test_mode !== false, // Default true
      useExternalSystem: configData.use_external_system || false
    })

  } catch (error) {
    console.error('Error in GET /api/abacate-pay/config:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Salvar configurações do Abacate Pay
export async function POST(request: NextRequest) {
  try {
    const body: AbacatePayConfig = await request.json()

    // Validar campos obrigatórios
    if (!body.apiKey || !body.apiUrl) {
      return NextResponse.json(
        { error: 'API Key e URL da API são obrigatórios' },
        { status: 400 }
      )
    }

    // Preparar dados para salvar
    const configData = {
      api_key: body.apiKey,
      api_url: body.apiUrl,
      webhook_url: body.webhookUrl || '',
      webhook_secret: body.webhookSecret || '',
      test_mode: body.testMode !== false, // Default true
      use_external_system: body.useExternalSystem || false
    }

    // Verificar se já existe configuração
    const { data: existingConfig } = await supabase
      .from('payment_methods_config')
      .select('id')
      .eq('method_name', 'abacate_pay')
      .single()

    if (existingConfig) {
      // Atualizar configuração existente
      const { error: updateError } = await supabase
        .from('payment_methods_config')
        .update({
          config_data: configData,
          is_enabled: body.enabled,
          updated_at: new Date().toISOString()
        })
        .eq('method_name', 'abacate_pay')

      if (updateError) {
        console.error('Error updating Abacate Pay config:', updateError)
        return NextResponse.json(
          { error: 'Erro ao atualizar configurações' },
          { status: 500 }
        )
      }
    } else {
      // Criar nova configuração
      const { error: insertError } = await supabase
        .from('payment_methods_config')
        .insert({
          method_name: 'abacate_pay',
          display_name: 'Abacate Pay',
          description: 'Pagamento via Abacate Pay',
          icon_name: 'heart',
          config_data: configData,
          is_enabled: body.enabled,
          sort_order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error creating Abacate Pay config:', insertError)
        return NextResponse.json(
          { error: 'Erro ao criar configurações' },
          { status: 500 }
        )
      }
    }

    // Limpar cache das chaves API
    try {
      const { clearApiKeysCache } = await import('@/lib/api-keys')
      clearApiKeysCache()
    } catch (error) {
      console.warn('Could not clear API keys cache:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })

  } catch (error) {
    console.error('Error in POST /api/abacate-pay/config:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}