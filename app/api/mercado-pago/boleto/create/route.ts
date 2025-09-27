import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      transaction_amount, 
      description, 
      payer,
      external_reference,
      date_of_expiration
    } = body

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

    if (!payer || !payer.email) {
      return NextResponse.json(
        { error: 'Email do pagador é obrigatório' },
        { status: 400 }
      )
    }

    if (!payer.identification || !payer.identification.type || !payer.identification.number) {
      return NextResponse.json(
        { error: 'Identificação do pagador (CPF/CNPJ) é obrigatória para boleto' },
        { status: 400 }
      )
    }

    if (!payer.first_name || !payer.last_name) {
      return NextResponse.json(
        { error: 'Nome completo do pagador é obrigatório para boleto' },
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

    // Calcular data de vencimento (padrão: 3 dias)
    let expirationDate = date_of_expiration
    if (!expirationDate) {
      const defaultExpiration = new Date()
      defaultExpiration.setDate(defaultExpiration.getDate() + 3)
      expirationDate = defaultExpiration.toISOString()
    }

    // Criar pagamento com boleto no Mercado Pago
    const paymentData = {
      transaction_amount: parseFloat(transaction_amount.toString()),
      description: description,
      payment_method_id: 'bolbradesco', // Boleto Bradesco como padrão
      payer: {
        email: payer.email,
        first_name: payer.first_name,
        last_name: payer.last_name,
        identification: {
          type: payer.identification.type, // CPF ou CNPJ
          number: payer.identification.number
        },
        address: payer.address || undefined
      },
      external_reference: external_reference || `boleto_${Date.now()}`,
      date_of_expiration: expirationDate,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercado-pago/webhook`
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
      .from('mercado_pago_boleto_payments')
      .insert({
        payment_id: paymentResult.id.toString(),
        transaction_amount: paymentResult.transaction_amount,
        description: paymentResult.description,
        status: paymentResult.status,
        status_detail: paymentResult.status_detail,
        payment_method_id: paymentResult.payment_method_id,
        barcode: paymentResult.barcode || '',
        external_resource_url: paymentResult.transaction_details?.external_resource_url || '',
        payer_email: paymentResult.payer.email,
        payer_identification: paymentResult.payer.identification.number,
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

    // Retornar dados do boleto
    return NextResponse.json({
      id: paymentResult.id.toString(),
      status: paymentResult.status,
      status_detail: paymentResult.status_detail,
      transaction_amount: paymentResult.transaction_amount,
      description: paymentResult.description,
      payment_method_id: paymentResult.payment_method_id,
      barcode: paymentResult.barcode || '',
      external_resource_url: paymentResult.transaction_details?.external_resource_url || '',
      external_reference: paymentResult.external_reference,
      date_created: paymentResult.date_created,
      date_of_expiration: paymentResult.date_of_expiration
    })

  } catch (error) {
    console.error('Erro ao criar pagamento com boleto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}