import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// POST - Webhook do Abacate Pay
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-abacate-signature')

    // Buscar configuração do webhook
    const { data: configData, error: configError } = await getSupabaseAdmin()
      .from('payment_methods_config')
      .select('config_data')
      .eq('method_name', 'abacate_pay')
      .eq('is_enabled', true)
      .single()

    if (configError || !configData) {
      console.error('Configuração do Abacate Pay não encontrada')
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 400 })
    }

    const config = configData.config_data as any

    // Verificar assinatura do webhook (se configurada)
    if (config.webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', config.webhookSecret)
        .update(body)
        .digest('hex')

      if (signature !== `sha256=${expectedSignature}`) {
        console.error('Assinatura do webhook inválida')
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
      }
    }

    const webhookData = JSON.parse(body)
    console.log('Webhook recebido:', webhookData)

    // Extrair dados do webhook
    const {
      id: abacatePayId,
      external_id: abacatePayExternalId,
      status,
      amount,
      currency,
      payment_method,
      tracking_token,
      metadata
    } = webhookData

    if (!abacatePayId) {
      console.error('ID do Abacate Pay não fornecido no webhook')
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    // Buscar transação existente
    let transaction = null
    let transactionError = null

    // Primeiro, tentar encontrar por tracking_token se fornecido
    if (tracking_token) {
      const { data, error } = await getSupabaseAdmin()
        .from('payment_transactions')
        .select('*')
        .eq('abacate_pay_tracking_token', tracking_token)
        .single()
      
      transaction = data
      transactionError = error
    }

    // Se não encontrou por tracking_token, tentar por abacate_pay_id
    if (!transaction && abacatePayId) {
      const { data, error } = await getSupabaseAdmin()
        .from('payment_transactions')
        .select('*')
        .eq('abacate_pay_id', abacatePayId)
        .single()
      
      transaction = data
      transactionError = error
    }

    // Se não encontrou por abacate_pay_id, tentar por external_id
    if (!transaction && abacatePayExternalId) {
      const { data, error } = await getSupabaseAdmin()
        .from('payment_transactions')
        .select('*')
        .eq('abacate_pay_external_id', abacatePayExternalId)
        .single()
      
      transaction = data
      transactionError = error
    }

    // Mapear status do Abacate Pay para nosso sistema
    const statusMapping: { [key: string]: string } = {
      'pending': 'pending',
      'paid': 'completed',
      'expired': 'expired',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'failed': 'failed'
    }

    const mappedStatus = statusMapping[status] || 'pending'

    if (transaction) {
      // Atualizar transação existente
      const updateData: any = {
        payment_status: mappedStatus,
        abacate_pay_id: abacatePayId,
        updated_at: new Date().toISOString()
      }

      if (abacatePayExternalId) {
        updateData.abacate_pay_external_id = abacatePayExternalId
      }

      if (metadata) {
        updateData.metadata = {
          ...transaction.metadata,
          ...metadata,
          webhook_received_at: new Date().toISOString()
        }
      }

      const { error: updateError } = await getSupabaseAdmin()
        .from('payment_transactions')
        .update(updateData)
        .eq('id', transaction.id)

      if (updateError) {
        console.error('Erro ao atualizar transação:', updateError)
        return NextResponse.json({ error: 'Erro ao atualizar transação' }, { status: 500 })
      }

      // Se o pagamento foi confirmado, processar ações adicionais
      if (mappedStatus === 'completed' && transaction.user_id) {
        await processPaymentSuccess(transaction.user_id, transaction.plan_id, transaction.id)
      }

      console.log(`Transação ${transaction.id} atualizada para status: ${mappedStatus}`)

    } else {
      // Criar nova transação se não existir (caso o webhook chegue antes do link ser gerado)
      console.log('Transação não encontrada, criando nova...')

      const newTransactionData: any = {
        amount: amount || 0,
        currency: currency || 'BRL',
        payment_method: 'abacate_pay',
        payment_status: mappedStatus,
        abacate_pay_id: abacatePayId,
        abacate_pay_external_id: abacatePayExternalId,
        abacate_pay_tracking_token: tracking_token,
        metadata: {
          ...metadata,
          webhook_received_at: new Date().toISOString(),
          created_from_webhook: true
        }
      }

      const { data: newTransaction, error: createError } = await getSupabaseAdmin()
        .from('payment_transactions')
        .insert(newTransactionData)
        .select()
        .single()

      if (createError) {
        console.error('Erro ao criar nova transação:', createError)
        return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 500 })
      }

      console.log(`Nova transação criada: ${newTransaction.id}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processado com sucesso' 
    })

  } catch (error) {
    console.error('Erro no webhook do Abacate Pay:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para processar pagamento bem-sucedido
async function processPaymentSuccess(userId: string, planId: string, transactionId: string) {
  try {
    // Buscar detalhes do plano
    const { data: plan, error: planError } = await getSupabaseAdmin()
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('Plano não encontrado:', planError)
      return
    }

    // Verificar se o usuário já tem uma assinatura ativa
    const { data: existingSubscription } = await getSupabaseAdmin()
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      // Atualizar assinatura existente
      const newEndDate = new Date()
      newEndDate.setDate(newEndDate.getDate() + (plan.duration_days || 30))

      await getSupabaseAdmin()
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)

    } else {
      // Criar nova assinatura
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + (plan.duration_days || 30))

      await getSupabaseAdmin()
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_transaction_id: transactionId
        })
    }

    // Adicionar tokens se o plano incluir
    if (plan.tokens_included && plan.tokens_included > 0) {
      await getSupabaseAdmin()
        .from('user_tokens')
        .upsert({
          user_id: userId,
          tokens: plan.tokens_included,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    }

    console.log(`Pagamento processado com sucesso para usuário ${userId}`)

  } catch (error) {
    console.error('Erro ao processar pagamento bem-sucedido:', error)
  }
}