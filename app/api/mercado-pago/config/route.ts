import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await getSupabaseAdmin()
      .from('mercado_pago_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar configuração do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Configuração padrão se não existir
    const defaultConfig = {
      access_token: '',
      public_key: '',
      client_id: '',
      client_secret: '',
      webhook_url: '',
      sandbox_mode: false, // Produção por padrão
      active: false
    }

    if (!data) {
      return NextResponse.json(defaultConfig)
    }

    // Mascarar dados sensíveis para o frontend
    return NextResponse.json({
      id: data.id,
      access_token: data.access_token ? '***' + data.access_token.slice(-8) : '',
      public_key: data.public_key,
      client_id: data.client_id,
      client_secret: data.client_secret ? '***' + data.client_secret.slice(-8) : '',
      webhook_url: data.webhook_url,
      sandbox_mode: data.test_mode || false,
      active: data.enabled || false
    })
  } catch (error) {
    console.error('Erro ao buscar configuração do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      access_token,
      public_key,
      client_id,
      client_secret,
      webhook_url,
      sandbox_mode,
      active
    } = body

    const supabase = createClient()

    // Validação básica
    if (!access_token || !public_key) {
      return NextResponse.json(
        { error: 'Access Token e Public Key são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato das credenciais
    if (!access_token.startsWith('APP_USR-')) {
      return NextResponse.json(
        { error: 'Formato do Access Token inválido' },
        { status: 400 }
      )
    }

    if (!public_key.startsWith('APP_USR-')) {
      return NextResponse.json(
        { error: 'Formato da Public Key inválido' },
        { status: 400 }
      )
    }

    // Verificar se já existe configuração
    const { data: existingConfig } = await getSupabaseAdmin()
      .from('mercado_pago_config')
      .select('id')
      .single()

    let result
    if (existingConfig) {
      // Atualizar configuração existente
      result = await getSupabaseAdmin()
        .from('mercado_pago_config')
        .update({
          access_token,
          public_key,
          client_id: client_id || null,
          client_secret: client_secret || null,
          webhook_url: webhook_url || null,
          test_mode: Boolean(sandbox_mode),
          enabled: Boolean(active),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
    } else {
      // Criar nova configuração
      result = await getSupabaseAdmin()
        .from('mercado_pago_config')
        .insert({
          access_token,
          public_key,
          client_id: client_id || null,
          client_secret: client_secret || null,
          webhook_url: webhook_url || null,
          test_mode: Boolean(sandbox_mode),
          enabled: Boolean(active)
        })
    }

    if (result.error) {
      console.error('Erro ao salvar configuração do Mercado Pago:', result.error)
      return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
    }

    // Atualizar tabela de configuração de sistemas de pagamento
    await getSupabaseAdmin()
      .from('payment_system_config')
      .upsert({
        system_name: 'mercado_pago',
        display_name: 'Mercado Pago',
        is_active: Boolean(active),
        config_data: {
          sandbox_mode: Boolean(sandbox_mode),
          has_credentials: true
        },
        updated_at: new Date().toISOString()
      })

    return NextResponse.json({
      message: 'Configuração salva com sucesso'
    })
  } catch (error) {
    console.error('Erro ao processar configuração do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}