import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_amount, description, external_reference, expiration_minutes = 30 } = body

    // Validação dos dados
    if (!transaction_amount || transaction_amount <= 0) {
      return NextResponse.json(
        { error: 'Valor da transação é obrigatório e deve ser maior que zero' },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Descrição é obrigatória' },
        { status: 400 }
      )
    }

    // Buscar configurações do Mercado Pago
    const { data: config, error: configError } = await supabase
      .from('mercado_pago_settings')
      .select('*')
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'Configurações do Mercado Pago não encontradas' },
        { status: 404 }
      )
    }

    if (!config.access_token) {
      return NextResponse.json(
        { error: 'Access Token do Mercado Pago não configurado' },
        { status: 400 }
      )
    }

    // Calcular data de expiração
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + expiration_minutes)

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: parseFloat(transaction_amount.toString()),
      description: description,
      payment_method_id: 'pix',
      external_reference: external_reference || `pix_${Date.now()}`,
      date_of_expiration: expirationDate.toISOString(),
      payer: {
        email: 'test@test.com' // Email padrão para teste
      }
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `${Date.now()}-${Math.random()}`
      },
      body: JSON.stringify(paymentData)
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json()
      console.error('Erro do Mercado Pago:', errorData)
      return NextResponse.json(
        { error: 'Falha ao criar pagamento no Mercado Pago', details: errorData },
        { status: 400 }
      )
    }

    const paymentResult = await mpResponse.json()

    // Salvar no banco de dados
    const { data: savedPayment, error: saveError } = await supabase
      .from('mercado_pago_pix_payments')
      .insert({
        payment_id: paymentResult.id.toString(),
        transaction_amount: paymentResult.transaction_amount,
        description: paymentResult.description,
        status: paymentResult.status,
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code || '',
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64 || '',
        external_reference: paymentResult.external_reference,
        date_created: paymentResult.date_created,
        date_of_expiration: paymentResult.date_of_expiration,
        mercado_pago_data: paymentResult
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar no banco:', saveError)
      // Mesmo com erro no banco, retornamos o pagamento criado
    }

    // Retornar dados do QR Code
    return NextResponse.json({
      id: paymentResult.id.toString(),
      status: paymentResult.status,
      transaction_amount: paymentResult.transaction_amount,
      description: paymentResult.description,
      qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code || '',
      qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      external_reference: paymentResult.external_reference,
      date_created: paymentResult.date_created,
      date_of_expiration: paymentResult.date_of_expiration
    })

  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}