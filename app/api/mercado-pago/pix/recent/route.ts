import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Buscar pagamentos PIX recentes do banco de dados
    const { data: payments, error } = await supabase
      .from('mercado_pago_pix_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Erro ao buscar pagamentos PIX:', error)
      return NextResponse.json(
        { error: 'Falha ao buscar pagamentos PIX' },
        { status: 500 }
      )
    }

    // Formatar dados para o frontend
    const formattedPayments = (payments || []).map(payment => ({
      id: payment.payment_id,
      status: payment.status,
      transaction_amount: payment.transaction_amount,
      description: payment.description,
      qr_code: payment.qr_code,
      qr_code_base64: payment.qr_code_base64,
      external_reference: payment.external_reference,
      date_created: payment.date_created,
      date_of_expiration: payment.date_of_expiration
    }))

    return NextResponse.json(formattedPayments)

  } catch (error) {
    console.error('Erro ao listar pagamentos PIX recentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}