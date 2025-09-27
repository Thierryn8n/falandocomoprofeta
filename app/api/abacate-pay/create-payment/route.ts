import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role key para operações administrativas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { amount, planType, userId, userEmail, apiKey } = await request.json()

    if (!amount || !planType || !userId || !userEmail || !apiKey) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe e obter informações completas
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Criar ou buscar cliente no Abacate Pay
    const customerResult = await createOrGetAbacatePayCustomer({
      email: userEmail,
      name: user.name || undefined,
      apiKey
    })

    if (!customerResult.success) {
      return NextResponse.json(
        { error: customerResult.error || 'Erro ao gerenciar cliente no Abacate Pay' },
        { status: 400 }
      )
    }

    // Criar billing usando o novo endpoint
    const billingResult = await createAbacatePayBilling({
      amount,
      planType,
      customerId: customerResult.customer.id,
      userEmail,
      userName: user.name
    })

    if (!billingResult.success) {
      return NextResponse.json(
        { error: billingResult.error || 'Erro ao criar cobrança' },
        { status: 400 }
      )
    }

    // Salvar transação no banco de dados com status pending
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        currency: 'BRL',
        payment_method: 'abacate_pay',
        payment_status: 'pending',
        metadata: {
          billing_id: billingResult.billing.id,
          billing_url: billingResult.billing.url,
          plan_type: planType
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error saving transaction:', transactionError)
      return NextResponse.json(
        { error: 'Erro ao salvar transação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cobrança criada com sucesso',
      billingId: billingResult.billing.id,
      billingUrl: billingResult.billing.url,
      transactionId: transaction.id
    })

  } catch (error) {
    console.error('Abacate Pay billing error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para criar billing via Abacate Pay API
async function createAbacatePayBilling({
  amount,
  planType,
  customerId,
  userEmail,
  userName
}: {
  amount: number
  planType: string
  customerId: string
  userEmail: string
  userName?: string
}) {
  try {
    // Buscar informações do produto no banco de dados
    const { data: productData, error: productError } = await supabase
      .from('abacate_pay_products')
      .select('*')
      .eq('plan_type', planType)
      .eq('is_active', true)
      .single()

    if (productError || !productData) {
      throw new Error(`Produto não encontrado para o plano: ${planType}`)
    }

    // Fazer requisição para o nosso endpoint de billing
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/abacate-pay/billing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        frequency: "ONE_TIME",
        methods: ["PIX"],
        products: [
          {
            externalId: productData.external_id,
            name: productData.name,
            description: productData.description,
            quantity: 1,
            price: productData.price // Já está em centavos no banco
          }
        ],
        returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade`,
        completionUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?success=true`,
        customerId: customerId,
        externalId: `USER-${Date.now()}-${planType}`
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `Erro ao criar cobrança: ${response.status}`
      }
    }

    const billingData = await response.json()
    
    if (billingData.error) {
      return {
        success: false,
        error: billingData.error
      }
    }

    return {
      success: true,
      billing: billingData.data
    }

  } catch (error) {
    console.error('Error creating billing:', error)
    return {
      success: false,
      error: 'Erro na comunicação com o serviço de cobrança'
    }
  }
}

// Função para criar ou buscar cliente no Abacate Pay
async function createOrGetAbacatePayCustomer({
  email,
  name,
  apiKey
}: {
  email: string
  name?: string
  apiKey: string
}) {
  try {
    // Fazer requisição para o nosso endpoint de clientes
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/abacate-pay/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        name,
        apiKey
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || 'Erro ao gerenciar cliente'
      }
    }

    const customerData = await response.json()
    
    if (!customerData.success) {
      return {
        success: false,
        error: customerData.error || 'Erro ao gerenciar cliente'
      }
    }

    return {
      success: true,
      customer: customerData.customer,
      isExisting: customerData.isExisting
    }

  } catch (error) {
    console.error('Error managing Abacate Pay customer:', error)
    return {
      success: false,
      error: 'Erro na comunicação com o serviço de clientes'
    }
  }
}