import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()

    // Buscar todas as transações do Mercado Pago
    const { data: transactions, error: transactionsError } = await getSupabaseAdmin()
      .from('mercado_pago_transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Erro ao buscar transações:', transactionsError)
      return NextResponse.json({ error: 'Erro ao buscar transações' }, { status: 500 })
    }

    const allTransactions = transactions || []

    // Calcular estatísticas
    const totalTransactions = allTransactions.length
    const approvedTransactions = allTransactions.filter(t => t.status === 'approved').length
    const pendingTransactions = allTransactions.filter(t => t.status === 'pending').length
    const rejectedTransactions = allTransactions.filter(t => t.status === 'rejected').length

    const totalRevenue = allTransactions
      .filter(t => t.status === 'approved')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const averageTicket = approvedTransactions > 0 ? totalRevenue / approvedTransactions : 0
    const conversionRate = totalTransactions > 0 ? (approvedTransactions / totalTransactions) * 100 : 0

    // Transações recentes (últimas 10)
    const recentTransactions = allTransactions.slice(0, 10)

    // Métodos de pagamento mais usados
    const paymentMethodCounts = allTransactions.reduce((acc, transaction) => {
      const method = transaction.payment_method || 'Desconhecido'
      acc[method] = (acc[method] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topPaymentMethods = Object.entries(paymentMethodCounts)
      .map(([method, count]) => ({
        method,
        count,
        percentage: totalTransactions > 0 ? (count / totalTransactions) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const stats = {
      totalRevenue,
      totalTransactions,
      approvedTransactions,
      pendingTransactions,
      rejectedTransactions,
      conversionRate,
      averageTicket,
      recentTransactions,
      topPaymentMethods
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Erro ao calcular estatísticas do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}