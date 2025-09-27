import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface PaymentSystemConfig {
  activeSystem: 'abacate_pay' | 'mercado_pago'
  abacatePayEnabled: boolean
  mercadoPagoEnabled: boolean
  allowSystemSwitch: boolean
  lastUpdated: string
}

export async function GET() {
  try {
    const { data: config, error } = await supabase
      .from('payment_system_config')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar configuração do sistema de pagamento:', error)
      return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
    }

    // Se não há configuração, retorna valores padrão
    if (!config) {
      return NextResponse.json({
        activeSystem: 'abacate_pay',
        abacatePayEnabled: true,
        mercadoPagoEnabled: false,
        allowSystemSwitch: true,
        lastUpdated: new Date().toISOString()
      })
    }

    return NextResponse.json({
      activeSystem: config.active_system,
      abacatePayEnabled: config.abacate_pay_enabled,
      mercadoPagoEnabled: config.mercado_pago_enabled,
      allowSystemSwitch: config.allow_system_switch,
      lastUpdated: config.updated_at
    })
  } catch (error) {
    console.error('Erro ao buscar configuração do sistema de pagamento:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [PAYMENT CONFIG API] POST request received')
    
    const config: PaymentSystemConfig = await request.json()
    console.log('📥 [PAYMENT CONFIG API] Received config:', JSON.stringify(config, null, 2))

    // Validação básica
    if (!['abacate_pay', 'mercado_pago'].includes(config.activeSystem)) {
      console.error('❌ [PAYMENT CONFIG API] Invalid activeSystem:', config.activeSystem)
      return NextResponse.json(
        { error: 'Sistema ativo deve ser "abacate_pay" ou "mercado_pago"' },
        { status: 400 }
      )
    }

    const configData = {
      active_system: config.activeSystem,
      abacate_pay_enabled: config.abacatePayEnabled,
      mercado_pago_enabled: config.mercadoPagoEnabled,
      allow_system_switch: config.allowSystemSwitch,
      updated_at: new Date().toISOString()
    }
    
    console.log('💾 [PAYMENT CONFIG API] Prepared data for upsert:', JSON.stringify(configData, null, 2))

    // First, check if there's an existing record
    const { data: existingRecord } = await supabase
      .from('payment_system_config')
      .select('id')
      .limit(1)
      .single()

    let data, error

    if (existingRecord) {
      // Update existing record
      const result = await supabase
        .from('payment_system_config')
        .update(configData)
        .eq('id', existingRecord.id)
        .select()
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Insert new record
      const result = await supabase
        .from('payment_system_config')
        .insert(configData)
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('❌ [PAYMENT CONFIG API] Supabase error:', JSON.stringify(error, null, 2))
      console.error('❌ [PAYMENT CONFIG API] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ error: 'Erro ao salvar configuração', details: error }, { status: 500 })
    }

    console.log('✅ [PAYMENT CONFIG API] Success! Saved data:', JSON.stringify(data, null, 2))

    return NextResponse.json({
      activeSystem: data.active_system,
      abacatePayEnabled: data.abacate_pay_enabled,
      mercadoPagoEnabled: data.mercado_pago_enabled,
      allowSystemSwitch: data.allow_system_switch,
      lastUpdated: data.updated_at
    })
  } catch (error) {
    console.error('💥 [PAYMENT CONFIG API] Exception occurred:', error)
    console.error('💥 [PAYMENT CONFIG API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}