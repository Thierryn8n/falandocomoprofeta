import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id

    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
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

    // Consultar status no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json()
      console.error('Erro do Mercado Pago:', errorData)
      return NextResponse.json(
        { error: 'Falha ao consultar pagamento no Mercado Pago', details: errorData },
        { status: 400 }
      )
    }

    const paymentResult = await mpResponse.json()

    // Atualizar status no banco de dados
    const { error: updateError } = await supabase
      .from('mercado_pago_pix_payments')
      .update({
        status: paymentResult.status,
        status_detail: paymentResult.status_detail,
        mercado_pago_data: paymentResult,
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId)

    if (updateError) {
      console.error('Erro ao atualizar status no banco:', updateError)
    }

    // Retornar status atualizado
    return NextResponse.json({
      id: paymentResult.id.toString(),
      status: paymentResult.status,
      status_detail: paymentResult.status_detail,
      transaction_amount: paymentResult.transaction_amount,
      description: paymentResult.description,
      external_reference: paymentResult.external_reference,
      date_created: paymentResult.date_created,
      date_of_expiration: paymentResult.date_of_expiration,
      date_approved: paymentResult.date_approved,
      payment_method: paymentResult.payment_method_id,
      payment_type: paymentResult.payment_type_id
    })

  } catch (error) {
    console.error('Erro ao consultar status do pagamento PIX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}