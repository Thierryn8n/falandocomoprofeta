import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// POST - Criar nova doação com Mercado Pago
export async function POST(request: NextRequest) {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verificar token e obter usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { packageId, paymentMethod } = body

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    // Buscar pacote
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from('donation_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json(
        { error: 'Package not found or inactive' },
        { status: 404 }
      )
    }

    // Criar doação no banco usando a função RPC
    const { data: donationId, error: donationError } = await supabaseAdmin
      .rpc('create_donation', {
        p_user_id: user.id,
        p_donation_package_id: packageId,
        p_payment_method: paymentMethod || 'pix',
        p_payment_provider: 'mercado_pago'
      })

    if (donationError) {
      console.error('[API Donations Create] Error creating donation:', donationError)
      return NextResponse.json(
        { error: 'Failed to create donation', details: donationError.message },
        { status: 500 }
      )
    }

    // Buscar credenciais do Mercado Pago
    const { data: credentials, error: credError } = await supabaseAdmin
      .from('mercado_pago_credentials')
      .select('access_token, public_key')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (credError || !credentials?.access_token) {
      console.error('[API Donations Create] Mercado Pago credentials not found')
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    // Configurar Mercado Pago
    const client = new MercadoPagoConfig({ 
      accessToken: credentials.access_token,
      options: { timeout: 5000 }
    })

    // Criar preferência de pagamento
    const preference = new Preference(client)
    
    const preferenceBody = {
      items: [
        {
          id: packageData.id,
          title: packageData.name,
          description: packageData.description || `${packageData.questions_added} perguntas extras`,
          quantity: 1,
          unit_price: packageData.price,
          currency_id: 'BRL'
        }
      ],
      payer: {
        email: user.email || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
      },
      external_reference: donationId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercado-pago/webhook`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/donate/success?donation=${donationId}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/donate/failure?donation=${donationId}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/donate/pending?donation=${donationId}`
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_types: paymentMethod === 'pix' 
          ? [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }]
          : paymentMethod === 'credit_card'
            ? [{ id: 'pix' }, { id: 'ticket' }]
            : []
      }
    }

    const preferenceResponse = await preference.create({ body: preferenceBody })

    // Atualizar doação com IDs do Mercado Pago
    await supabaseAdmin
      .from('user_donations')
      .update({
        mercado_pago_preference_id: preferenceResponse.id,
        mercado_pago_external_reference: donationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', donationId)

    return NextResponse.json({
      donationId,
      preferenceId: preferenceResponse.id,
      initPoint: preferenceResponse.init_point,
      sandboxInitPoint: preferenceResponse.sandbox_init_point,
      questionsAdded: packageData.questions_added,
      packageName: packageData.name,
      price: packageData.price
    })

  } catch (error) {
    console.error('[API Donations Create] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
