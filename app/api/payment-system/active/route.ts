import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Buscar configuração do sistema de pagamento
    const { data: paymentConfig, error: paymentError } = await getSupabaseAdmin()
      .from('payment_system_config')
      .select('*')
      .single()

    if (paymentError && paymentError.code !== 'PGRST116') {
      console.error('Erro ao buscar configuração do sistema de pagamento:', paymentError)
      return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
    }

    // Se não existe configuração, usar padrão (Abacate Pay)
    const activeSystem = paymentConfig?.active_system || 'abacate_pay'
    const abacatePayEnabled = paymentConfig?.abacate_pay_enabled ?? true
    const mercadoPagoEnabled = paymentConfig?.mercado_pago_enabled ?? false

    // Buscar configurações específicas do sistema ativo
    let systemConfig = null
    let plans = []

    if (activeSystem === 'abacate_pay' && abacatePayEnabled) {
      // Buscar configuração do Abacate Pay
      const { data: abacateConfig } = await getSupabaseAdmin()
        .from('abacate_pay_config')
        .select('*')
        .single()

      // Buscar planos do Abacate Pay
      if (abacateConfig?.use_external_system) {
        const { data: externalPlans } = await getSupabaseAdmin()
          .from('external_payment_links')
          .select('*')
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
        
        plans = externalPlans || []
      } else {
        const { data: internalPlans } = await getSupabaseAdmin()
          .from('abacate_pay_products')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        
        plans = internalPlans || []
      }

      systemConfig = {
        useExternalSystem: abacateConfig?.use_external_system || false,
        apiKey: abacateConfig?.api_key,
        environment: abacateConfig?.test_mode ? 'sandbox' : 'production'
      }
    } else if (activeSystem === 'mercado_pago' && mercadoPagoEnabled) {
      // Buscar configuração do Mercado Pago
      const { data: mpConfig } = await getSupabaseAdmin()
        .from('mercado_pago_config')
        .select('*')
        .single()

      // Buscar produtos do Mercado Pago
      const { data: mpProducts } = await getSupabaseAdmin()
        .from('mercado_pago_products')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      plans = mpProducts || []
      systemConfig = {
        publicKey: mpConfig?.public_key,
        environment: mpConfig?.test_mode ? 'sandbox' : 'production'
      }
    }

    return NextResponse.json({
      activeSystem,
      systemConfig,
      plans,
      abacatePayEnabled,
      mercadoPagoEnabled
    })
  } catch (error) {
    console.error('Erro ao buscar sistema de pagamento ativo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}