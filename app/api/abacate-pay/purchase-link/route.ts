import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAbacatePayLink, AbacatePayLinkRequest } from '@/lib/abacate-pay'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Gerar link de compra diretamente via API do Abacate Pay
export async function POST(request: NextRequest) {
  try {
    const { 
      product_id, 
      user_id, 
      customer_email, 
      customer_name,
      success_url,
      cancel_url,
      expires_in 
    } = await request.json()

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar configuração do Abacate Pay
    const { data: configData, error: configError } = await supabase
      .from('payment_methods_config')
      .select('config_data')
      .eq('method_name', 'abacate_pay')
      .eq('is_enabled', true)
      .single()

    if (configError || !configData) {
      return NextResponse.json(
        { error: 'Abacate Pay não está configurado ou habilitado' },
        { status: 400 }
      )
    }

    // Buscar produto local
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('external_id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Gerar token único de rastreamento
    const trackingToken = `usr_${uuidv4().replace(/-/g, '').substring(0, 16)}`

    // Preparar dados para o Abacate Pay
    const linkRequest: AbacatePayLinkRequest = {
      product_id: product_id,
      customer_email: customer_email,
      customer_name: customer_name,
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      expires_in: expires_in || 3600, // 1 hora por padrão
      metadata: {
        tracking_token: trackingToken,
        user_id: user_id,
        product_name: product.name,
        generated_at: new Date().toISOString(),
        source: 'direct_api'
      }
    }

    // Criar link diretamente no Abacate Pay
    const abacatePayLink = await createAbacatePayLink(linkRequest)

    // Criar registro de transação pendente para rastreamento
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user_id || null,
        plan_id: product.id,
        amount: product.price,
        currency: 'BRL',
        payment_method: 'abacate_pay',
        payment_status: 'pending',
        abacate_pay_link: abacatePayLink.url,
        abacate_pay_tracking_token: trackingToken,
        abacate_pay_external_id: abacatePayLink.id,
        metadata: {
          product_name: product.name,
          generated_at: new Date().toISOString(),
          user_agent: request.headers.get('user-agent') || 'unknown',
          abacate_pay_link_id: abacatePayLink.id,
          expires_at: abacatePayLink.expires_at,
          customer_email: customer_email,
          customer_name: customer_name
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Erro ao criar transação:', transactionError)
      return NextResponse.json(
        { error: 'Erro ao registrar transação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        purchase_link: abacatePayLink.url,
        link_id: abacatePayLink.id,
        tracking_token: trackingToken,
        transaction_id: transaction.id,
        expires_at: abacatePayLink.expires_at,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          external_id: product.external_id
        }
      }
    })

  } catch (error) {
    console.error('Erro na API de purchase-link:', error)
    
    // Verificar se é erro específico do Abacate Pay
    if (error instanceof Error && error.message.includes('Erro ao criar link')) {
      return NextResponse.json(
        { error: `Abacate Pay: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Verificar status de um link de compra
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingToken = searchParams.get('tracking_token')

    if (!trackingToken) {
      return NextResponse.json(
        { error: 'tracking_token é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar transação pelo token de rastreamento
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        subscription_plans:plan_id (
          name,
          price,
          features
        )
      `)
      .eq('abacate_pay_tracking_token', trackingToken)
      .single()

    if (error || !transaction) {
      return NextResponse.json(
        { error: 'Link de compra não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transaction.id,
        status: transaction.payment_status,
        amount: transaction.amount,
        currency: transaction.currency,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
        product: transaction.subscription_plans,
        abacate_pay_id: transaction.abacate_pay_id,
        abacate_pay_external_id: transaction.abacate_pay_external_id
      }
    })

  } catch (error) {
    console.error('Erro na verificação do link:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}