import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkPixPaymentStatus } from '@/lib/pix'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { paymentId, userId } = await request.json()

    if (!paymentId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get transaction from database
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('payment_intent_id', paymentId)
      .eq('user_id', userId)
      .single()

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // If already processed, return current status
    if (transaction.status === 'completed' || transaction.status === 'failed') {
      return NextResponse.json({
        status: transaction.status,
        payment: {
          id: paymentId,
          status: transaction.status === 'completed' ? 'paid' : 'failed'
        }
      })
    }

    // Check payment status with PIX provider
    const pixPayment = await checkPixPaymentStatus(paymentId)

    if (!pixPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // If payment is completed, update transaction and add tokens/subscription
    if (pixPayment.status === 'paid') {
      // Update transaction status
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      if (updateError) {
        console.error('Error updating transaction:', updateError)
        return NextResponse.json(
          { error: 'Failed to update transaction' },
          { status: 500 }
        )
      }

      // Handle different plan types
      if (transaction.plan_type === 'custom') {
        // Add tokens for custom plans
        const { error: tokenError } = await supabase
          .rpc('add_user_tokens', {
            p_user_id: userId,
            p_amount: transaction.tokens_amount,
            p_reason: `PIX payment - ${transaction.tokens_amount} tokens`
          })

        if (tokenError) {
          console.error('Error adding tokens:', tokenError)
        }
      } else {
        // Handle subscription plans
        const planConfig = {
          monthly: { duration_months: 1, tokens: 1000 },
          yearly: { duration_months: 12, tokens: 15000 },
          lifetime: { duration_months: null, tokens: null }
        }

        const config = planConfig[transaction.plan_type as keyof typeof planConfig]
        
        if (config) {
          const endsAt = config.duration_months 
            ? new Date(Date.now() + config.duration_months * 30 * 24 * 60 * 60 * 1000)
            : null

          // Create or update subscription
          const { error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              plan_type: transaction.plan_type,
              status: 'active',
              starts_at: new Date().toISOString(),
              ends_at: endsAt?.toISOString(),
              payment_method: 'pix'
            })

          if (subscriptionError) {
            console.error('Error creating subscription:', subscriptionError)
          }

          // Add tokens if applicable
          if (config.tokens) {
            const { error: tokenError } = await supabase
              .rpc('add_user_tokens', {
                p_user_id: userId,
                p_amount: config.tokens,
                p_reason: `PIX subscription - ${transaction.plan_type}`
              })

            if (tokenError) {
              console.error('Error adding subscription tokens:', tokenError)
            }
          }
        }
      }
    }

    return NextResponse.json({
      status: pixPayment.status,
      payment: {
        id: paymentId,
        status: pixPayment.status,
        amount: pixPayment.amount,
        expiresAt: pixPayment.expiresAt
      }
    })

  } catch (error) {
    console.error('PIX payment check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}