import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Interface para estatísticas do Abacate Pay
interface AbacatePayStats {
  totalTransactions: number
  totalRevenue: number
  pendingTransactions: number
  paidTransactions: number
  cancelledTransactions: number
  todayTransactions: number
  todayRevenue: number
  monthlyRevenue: number
  averageTransactionValue: number
  topCustomers: Array<{
    email: string
    name?: string
    totalSpent: number
    transactionCount: number
  }>
  recentTransactions: Array<{
    id: string
    customer_email: string
    amount: number
    status: string
    created_at: string
  }>
}

// GET - Obter estatísticas do Abacate Pay
export async function GET() {
  try {
    // Data de hoje para filtros
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Data do início do mês
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthStartISO = monthStart.toISOString()

    // 1. Estatísticas gerais de transações
    const { data: allTransactions, error: allError } = await getSupabaseAdmin()
      .from('payment_transactions')
      .select('amount, payment_status, created_at')

    if (allError) {
      console.error('Error fetching all transactions:', allError)
    }

    // 2. Transações de hoje
    const { data: todayTransactions, error: todayError } = await getSupabaseAdmin()
      .from('payment_transactions')
      .select('amount, payment_status')
      .gte('created_at', todayISO)

    if (todayError) {
      console.error('Error fetching today transactions:', todayError)
    }

    // 3. Transações do mês
    const { data: monthTransactions, error: monthError } = await getSupabaseAdmin()
      .from('payment_transactions')
      .select('amount, payment_status')
      .gte('created_at', monthStartISO)

    if (monthError) {
      console.error('Error fetching month transactions:', monthError)
    }

    // 4. Top clientes (usando profiles para obter informações do usuário)
    const { data: topCustomersData, error: topCustomersError } = await getSupabaseAdmin()
      .from('payment_transactions')
      .select(`
        amount, 
        payment_status,
        user_id,
        profiles!inner(email, full_name)
      `)
      .eq('payment_status', 'completed')

    if (topCustomersError) {
      console.error('Error fetching top customers:', topCustomersError)
    }

    // 5. Transações recentes
    const { data: recentTransactions, error: recentError } = await getSupabaseAdmin()
      .from('payment_transactions')
      .select(`
        id, 
        amount, 
        payment_status, 
        created_at,
        user_id,
        profiles!inner(email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Error fetching recent transactions:', recentError)
    }

    // Processar dados para estatísticas
    const transactions = allTransactions || []
    const todayTxns = todayTransactions || []
    const monthTxns = monthTransactions || []
    const topCustomers = topCustomersData || []
    const recent = recentTransactions || []

    // Calcular estatísticas gerais
    const totalTransactions = transactions.length
    const totalRevenue = transactions
      .filter(t => t.payment_status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const pendingTransactions = transactions.filter(t => t.payment_status === 'pending').length
    const paidTransactions = transactions.filter(t => t.payment_status === 'completed').length
    const cancelledTransactions = transactions.filter(t => t.payment_status === 'failed').length

    // Estatísticas de hoje
    const todayTransactionCount = todayTxns.length
    const todayRevenue = todayTxns
      .filter(t => t.payment_status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    // Receita mensal
    const monthlyRevenue = monthTxns
      .filter(t => t.payment_status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    // Valor médio das transações
    const paidTransactionAmounts = transactions
      .filter(t => t.payment_status === 'completed')
      .map(t => t.amount || 0)
    const averageTransactionValue = paidTransactionAmounts.length > 0
      ? paidTransactionAmounts.reduce((sum, amount) => sum + amount, 0) / paidTransactionAmounts.length
      : 0

    // Processar top clientes
    const customerStats = new Map()
    topCustomers.forEach(transaction => {
      const email = transaction.profiles?.email || 'N/A'
      if (!customerStats.has(email)) {
        customerStats.set(email, {
          email,
          name: transaction.profiles?.full_name,
          totalSpent: 0,
          transactionCount: 0
        })
      }
      const customer = customerStats.get(email)
      customer.totalSpent += transaction.amount || 0
      customer.transactionCount += 1
    })

    const topCustomersList = Array.from(customerStats.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)

    // Formatar transações recentes
    const recentTransactionsList = recent.map(t => ({
      id: t.id,
      customer_email: t.profiles?.email || 'N/A',
      amount: t.amount,
      status: t.payment_status,
      created_at: t.created_at
    }))

    const stats: AbacatePayStats = {
      totalTransactions,
      totalRevenue,
      pendingTransactions,
      paidTransactions,
      cancelledTransactions,
      todayTransactions: todayTransactionCount,
      todayRevenue,
      monthlyRevenue,
      averageTransactionValue,
      topCustomers: topCustomersList,
      recentTransactions: recentTransactionsList
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error in GET /api/abacate-pay/stats:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}