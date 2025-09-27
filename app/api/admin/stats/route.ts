import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get active subscriptions count
    const { count: activeSubscriptions } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get total revenue from completed transactions
    const { data: revenueData } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'completed')

    const totalRevenue = revenueData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0

    // Get pending payments count
    const { count: pendingPayments } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      totalRevenue: totalRevenue,
      pendingPayments: pendingPayments || 0
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}