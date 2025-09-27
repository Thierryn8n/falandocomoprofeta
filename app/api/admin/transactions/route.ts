import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get recent transactions with user email
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        amount,
        status,
        plan_type,
        created_at,
        profiles!inner(email)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    // Format the response to include user_email directly
    const formattedTransactions = transactions?.map(transaction => ({
      id: transaction.id,
      user_email: transaction.profiles.email,
      amount: transaction.amount,
      status: transaction.status,
      plan_type: transaction.plan_type,
      created_at: transaction.created_at
    })) || []

    return NextResponse.json(formattedTransactions)
  } catch (error) {
    console.error('Error fetching admin transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin transactions' },
      { status: 500 }
    )
  }
}