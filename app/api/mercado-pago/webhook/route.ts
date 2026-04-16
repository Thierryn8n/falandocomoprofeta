import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createClient()

    console.log('Webhook Mercado Pago recebido:', body)

    // Verificar se é uma notificação de pagamento
    if (body.type !== 'payment') {
      console.log('Tipo de notificação não é pagamento:', body.type)
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      console.log('ID do pagamento não encontrado no webhook')
      return NextResponse.json({ error: 'ID do pagamento não encontrado' }, { status: 400 })
    }

    // Buscar configuração do Mercado Pago
    const { data: config } = await getSupabaseAdmin()
      .from('mercado_pago_config')
      .select('access_token')
      .single()

    if (!config?.access_token) {
      console.error('Configuração do Mercado Pago não encontrada')
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 500 })
    }

    // Buscar detalhes do pagamento na API do Mercado Pago
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!paymentResponse.ok) {
      console.error('Erro ao buscar pagamento na API do Mercado Pago:', paymentResponse.statusText)
      return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 })
    }

    const paymentData = await paymentResponse.json()

    // Verificar se a transação já existe
    const { data: existingTransaction } = await getSupabaseAdmin()
      .from('mercado_pago_transactions')
      .select('id')
      .eq('mp_payment_id', paymentId.toString())
      .single()

    const transactionData = {
      mp_payment_id: paymentId.toString(),
      preference_id: paymentData.additional_info?.preference_id || '',
      status: paymentData.status,
      status_detail: paymentData.status_detail,
      payment_method: paymentData.payment_method_id,
      payment_type: paymentData.payment_type_id,
      amount: paymentData.transaction_amount,
      currency: paymentData.currency_id,
      payer_email: paymentData.payer?.email || '',
      payer_identification: {
        type: paymentData.payer?.identification?.type || '',
        number: paymentData.payer?.identification?.number || ''
      },
      external_reference: paymentData.external_reference || '',
      description: paymentData.description || '',
      metadata: {
        collector_id: paymentData.collector_id,
        operation_type: paymentData.operation_type,
        date_created: paymentData.date_created,
        date_approved: paymentData.date_approved,
        money_release_date: paymentData.money_release_date,
        installments: paymentData.installments,
        fee_details: paymentData.fee_details
      }
    }

    let result
    if (existingTransaction) {
      // Atualizar transação existente
      result = await getSupabaseAdmin()
        .from('mercado_pago_transactions')
        .update({
          ...transactionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTransaction.id)
        .select()
        .single()
    } else {
      // Criar nova transação
      result = await getSupabaseAdmin()
        .from('mercado_pago_transactions')
        .insert(transactionData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Erro ao salvar transação:', result.error)
      return NextResponse.json({ error: 'Erro ao salvar transação' }, { status: 500 })
    }

    console.log('Transação processada com sucesso:', result.data)

    // Aqui você pode adicionar lógica adicional baseada no status do pagamento
    if (paymentData.status === 'approved') {
      // Pagamento aprovado - ativar serviços, enviar emails, etc.
      console.log('Pagamento aprovado:', paymentId)
      
      // ==========================================
      // PROCESSAR DOAÇÃO SE FOR UMA DOAÇÃO
      // ==========================================
      try {
        // Verificar se é uma doação (usando external_reference)
        if (paymentData.external_reference) {
          const { data: donation, error: donationError } = await getSupabaseAdmin()
            .from('user_donations')
            .select('id, payment_status')
            .eq('mercado_pago_external_reference', paymentData.external_reference)
            .single()
          
          if (!donationError && donation) {
            // Atualizar status da doação para completed
            await getSupabaseAdmin()
              .from('user_donations')
              .update({
                payment_status: 'completed',
                payment_transaction_id: paymentId,
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', donation.id)
            
            // Processar doação (adicionar perguntas bonus)
            await getSupabaseAdmin()
              .rpc('process_completed_donation', {
                p_donation_id: donation.id
              })
            
            console.log('[Webhook] Doação processada:', donation.id)
          }
        }
      } catch (donationProcessError) {
        console.error('[Webhook] Erro ao processar doação:', donationProcessError)
        // Não falhar o webhook se o processamento de doação falhar
      }
      
    } else if (paymentData.status === 'rejected') {
      // Pagamento rejeitado - notificar usuário, etc.
      console.log('Pagamento rejeitado:', paymentId)
      
      // Atualizar doação para falha se existir
      try {
        if (paymentData.external_reference) {
          await getSupabaseAdmin()
            .from('user_donations')
            .update({
              payment_status: 'failed',
              payment_transaction_id: paymentId,
              updated_at: new Date().toISOString()
            })
            .eq('mercado_pago_external_reference', paymentData.external_reference)
        }
      } catch (e) {
        console.error('[Webhook] Erro ao atualizar doação rejeitada:', e)
      }
    }

    return NextResponse.json({ 
      received: true, 
      transaction_id: result.data.id,
      status: paymentData.status 
    })

  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Método GET para verificação de saúde do webhook
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook do Mercado Pago está funcionando',
    timestamp: new Date().toISOString()
  })
}