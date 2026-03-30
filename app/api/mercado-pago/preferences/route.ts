import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: preferences, error } = await getSupabaseAdmin()
      .from('mercado_pago_preferences')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar preferências do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao buscar preferências' }, { status: 500 })
    }

    return NextResponse.json(preferences || [])
  } catch (error) {
    console.error('Erro ao buscar preferências do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const preference = await request.json()
    const supabase = createClient()

    // Validação básica
    if (!preference.title || !preference.price) {
      return NextResponse.json(
        { error: 'Título e preço são obrigatórios' },
        { status: 400 }
      )
    }

    if (preference.price <= 0) {
      return NextResponse.json(
        { error: 'Preço deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Buscar configuração do Mercado Pago
    const { data: config } = await getSupabaseAdmin()
      .from('mercado_pago_config')
      .select('access_token, test_mode')
      .single()

    if (!config?.access_token) {
      return NextResponse.json(
        { error: 'Configuração do Mercado Pago não encontrada' },
        { status: 400 }
      )
    }

    // Criar preferência no Mercado Pago
    const preferenceData = {
      items: [{
        title: preference.title,
        description: preference.description || '',
        quantity: 1,
        currency_id: preference.currency || 'BRL',
        unit_price: preference.price
      }],
      payment_methods: {
        excluded_payment_methods: preference.excludedPaymentMethods || [],
        excluded_payment_types: preference.excludedPaymentTypes || [],
        installments: preference.installments || 12
      },
      external_reference: preference.external_reference || `pref_${Date.now()}`,
      notification_url: preference.notification_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/mercado-pago/webhook`,
      back_urls: {
        success: preference.success_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        failure: preference.failure_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
        pending: preference.pending_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`
      },
      auto_return: 'approved'
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json().catch(() => ({}))
      console.error('Erro na API do Mercado Pago:', errorData)
      return NextResponse.json(
        { error: `Erro na API do Mercado Pago: ${errorData.message || mpResponse.statusText}` },
        { status: 400 }
      )
    }

    const mpPreference = await mpResponse.json()

    // Salvar no banco de dados
    const { data, error } = await getSupabaseAdmin()
      .from('mercado_pago_preferences')
      .insert({
        mp_preference_id: mpPreference.id,
        title: preference.title,
        description: preference.description || '',
        price: preference.price,
        currency: preference.currency || 'BRL',
        payment_methods: {
          excluded_payment_methods: preference.excludedPaymentMethods || [],
          excluded_payment_types: preference.excludedPaymentTypes || [],
          installments: preference.installments || 12
        },
        external_reference: preferenceData.external_reference,
        notification_url: preferenceData.notification_url,
        back_urls: preferenceData.back_urls,
        init_point: mpPreference.init_point,
        sandbox_init_point: mpPreference.sandbox_init_point,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar preferência no banco:', error)
      return NextResponse.json({ error: 'Erro ao salvar preferência' }, { status: 500 })
    }

    return NextResponse.json({
      ...data,
      mp_preference: mpPreference
    })
  } catch (error) {
    console.error('Erro ao processar preferência do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const preference = await request.json()
    const supabase = createClient()

    if (!preference.id) {
      return NextResponse.json(
        { error: 'ID da preferência é obrigatório' },
        { status: 400 }
      )
    }

    // Validação básica
    if (!preference.title || !preference.price) {
      return NextResponse.json(
        { error: 'Título e preço são obrigatórios' },
        { status: 400 }
      )
    }

    if (preference.price <= 0) {
      return NextResponse.json(
        { error: 'Preço deve ser maior que zero' },
        { status: 400 }
      )
    }

    const { data, error } = await getSupabaseAdmin()
      .from('mercado_pago_preferences')
      .update({
        title: preference.title,
        description: preference.description || '',
        price: preference.price,
        currency: preference.currency || 'BRL',
        payment_methods: {
          excluded_payment_methods: preference.excludedPaymentMethods || [],
          excluded_payment_types: preference.excludedPaymentTypes || [],
          installments: preference.installments || 12
        },
        external_reference: preference.external_reference,
        status: preference.status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', preference.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar preferência do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao atualizar preferência' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao processar atualização da preferência:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const preferenceId = searchParams.get('id')

    if (!preferenceId) {
      return NextResponse.json(
        { error: 'ID da preferência é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { error } = await getSupabaseAdmin()
      .from('mercado_pago_preferences')
      .delete()
      .eq('id', preferenceId)

    if (error) {
      console.error('Erro ao deletar preferência do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao deletar preferência' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao processar deleção da preferência:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}