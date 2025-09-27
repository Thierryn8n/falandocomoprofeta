import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PUT - Atualizar apenas o toggle do sistema externo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { useExternalSystem } = body

    if (typeof useExternalSystem !== 'boolean') {
      return NextResponse.json(
        { error: 'useExternalSystem deve ser um valor booleano' },
        { status: 400 }
      )
    }

    // Verificar se existe configuração do Abacate Pay
    const { data: existingConfig } = await supabase
      .from('payment_methods_config')
      .select('*')
      .eq('method_name', 'abacate_pay')
      .single()

    let result
    if (existingConfig) {
      // Atualizar configuração existente
      const updatedConfigData = {
        ...existingConfig.config_data,
        use_external_system: useExternalSystem
      }

      result = await supabase
        .from('payment_methods_config')
        .update({
          config_data: updatedConfigData,
          updated_at: new Date().toISOString()
        })
        .eq('method_name', 'abacate_pay')
        .select()
        .single()
    } else {
      // Criar nova configuração com valores padrão
      const defaultConfig = {
        api_key: '',
        api_url: 'https://api.abacatepay.com',
        webhook_url: '',
        webhook_secret: '',
        test_mode: true,
        use_external_system: useExternalSystem
      }

      result = await supabase
        .from('payment_methods_config')
        .insert({
          method_name: 'abacate_pay',
          display_name: 'Abacate Pay',
          description: 'Pagamento via Abacate Pay',
          icon_name: 'heart',
          config_data: defaultConfig,
          is_enabled: false,
          sort_order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Erro ao atualizar toggle:', result.error)
      return NextResponse.json(
        { error: 'Erro ao atualizar configuração' },
        { status: 500 }
      )
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
      message: 'Toggle atualizado com sucesso',
      useExternalSystem
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}