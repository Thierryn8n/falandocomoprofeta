import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role key para operações administrativas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Interface para transação do Abacate Pay
interface AbacatePayTransaction {
  id: string
  customer_id: string
  customer_email: string
  customer_name?: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'cancelled' | 'expired'
  payment_method: string
  description?: string
  external_id?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

// GET - Listar transações do Abacate Pay
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit

    // Construir query base
    let query = supabase
      .from('payment_transactions')
      .select(`
        id,
        amount,
        currency,
        payment_method,
        payment_status,
        created_at,
        updated_at,
        user_id,
        profiles!inner(email, full_name)
      `)

    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('payment_status', status)
    }

    if (search) {
      // Buscar por email do usuário ou ID da transação
      query = query.or(`id.ilike.%${search}%,profiles.email.ilike.%${search}%`)
    }

    // Aplicar paginação e ordenação
    const { data: transactions, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching Abacate Pay transactions:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar transações' },
        { status: 500 }
      )
    }

    // Calcular informações de paginação
    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json({
      transactions: transactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error in GET /api/abacate-pay/transactions:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova transação (webhook ou manual)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      plan_id,
      amount,
      currency = 'BRL',
      payment_method = 'abacate_pay',
      payment_status = 'pending',
      stripe_payment_intent_id,
      pix_qr_code,
      pix_qr_code_expires_at,
      tokens_granted = 0,
      metadata = {}
    } = body

    // Validar dados obrigatórios
    if (!user_id || !amount) {
      return NextResponse.json(
        { error: 'ID do usuário e valor são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar valor
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Valor deve ser um número positivo' },
        { status: 400 }
      )
    }

    // Criar transação no banco
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .insert({
        user_id,
        plan_id,
        amount,
        currency,
        payment_method,
        payment_status,
        stripe_payment_intent_id,
        pix_qr_code,
        pix_qr_code_expires_at,
        tokens_granted,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating Abacate Pay transaction:', error)
      return NextResponse.json(
        { error: 'Erro ao criar transação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Transação criada com sucesso',
      transaction
    })

  } catch (error) {
    console.error('Error in POST /api/abacate-pay/transactions:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}