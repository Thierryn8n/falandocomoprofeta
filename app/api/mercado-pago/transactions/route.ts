import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: transactions, error } = await supabase
      .from('mercado_pago_transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar transações do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 })
    }

    return NextResponse.json(transactions || [])
  } catch (error) {
    console.error('Erro ao buscar transações do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const transaction = await request.json()
    const supabase = createClient()

    // Validação básica
    if (!transaction.payment_id || !transaction.status) {
      return NextResponse.json(
        { error: 'ID do pagamento e status são obrigatórios' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('mercado_pago_transactions')
      .insert({
        mp_payment_id: transaction.payment_id,
        preference_id: transaction.preference_id || '',
        status: transaction.status,
        status_detail: transaction.status_detail || '',
        payment_method: transaction.payment_method || '',
        payment_type: transaction.payment_type || '',
        amount: transaction.amount || 0,
        currency: transaction.currency || 'BRL',
        payer_email: transaction.payer_email || '',
        payer_identification: transaction.payer_identification || {},
        external_reference: transaction.external_reference || '',
        description: transaction.description || '',
        metadata: transaction.metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar transação do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao processar transação do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const transaction = await request.json()
    const supabase = createClient()

    if (!transaction.id) {
      return NextResponse.json(
        { error: 'ID da transação é obrigatório' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('mercado_pago_transactions')
      .update({
        status: transaction.status,
        status_detail: transaction.status_detail || '',
        payment_method: transaction.payment_method || '',
        payment_type: transaction.payment_type || '',
        amount: transaction.amount || 0,
        currency: transaction.currency || 'BRL',
        payer_email: transaction.payer_email || '',
        payer_identification: transaction.payer_identification || {},
        external_reference: transaction.external_reference || '',
        description: transaction.description || '',
        metadata: transaction.metadata || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar transação do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao atualizar transação' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao processar atualização da transação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}