import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { checkPixPaymentStatus } from '@/lib/pix'

export async function POST(request: NextRequest) {
  try {
    const { paymentId, status, transactionId } = await request.json()

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('PIX webhook received:', { paymentId, status, transactionId })

    // Find the transaction in our database
    const { data: transaction, error: fetchError } = await getSupabaseAdmin()
      .from('payment_transactions')
      .select('*')
      .eq('payment_id', paymentId)
      .single()

    if (fetchError || !transaction) {
      console.error('Transaction not found:', paymentId)
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Update transaction status
    const { error: updateError } = await getSupabaseAdmin()
      .from('payment_transactions')
      .update({
        status: status === 'approved' ? 'completed' : 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    // If payment was approved, process the payment
    if (status === 'approved') {
      if (transaction.plan_type === 'custom') {
        // Add tokens for custom payment
        const tokensToAdd = Math.floor(transaction.amount / 1) // 1 token per R$1
        
        const { error: tokenError } = await getSupabaseAdmin()
          .from('profiles')
          .update({
            tokens: supabase.raw(`tokens + ${tokensToAdd}`),
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.user_id)

        if (tokenError) {
          console.error('Error adding tokens:', tokenError)
        }
      } else {
        // Create or update subscription
        const subscriptionData = {
          user_id: transaction.user_id,
          plan_type: transaction.plan_type,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: calculateEndDate(transaction.plan_type),
          updated_at: new Date().toISOString()
        }

        const { error: subscriptionError } = await getSupabaseAdmin()
          .from('user_subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'user_id'
          })

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PIX webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateEndDate(planType: string): string {
  const now = new Date()
  
  switch (planType) {
    case 'monthly':
      now.setMonth(now.getMonth() + 1)
      break
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1)
      break
    case 'lifetime':
      now.setFullYear(now.getFullYear() + 100) // 100 years for lifetime
      break
    default:
      now.setMonth(now.getMonth() + 1) // Default to monthly
  }
  
  return now.toISOString()
}