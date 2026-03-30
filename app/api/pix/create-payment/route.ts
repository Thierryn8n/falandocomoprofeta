import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPixPayment, validatePixAmount, calculateTokensFromPixAmount } from '@/lib/pix'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { amount, planType, userId, userEmail } = await request.json()

    // Validate required fields
    if (!amount || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (!validatePixAmount(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between R$ 1,00 and R$ 10.000,00' },
        { status: 400 }
      )
    }

    // Get user data
    const { data: user, error: userError } = await getSupabaseAdmin()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate tokens for custom plans
    const tokens = planType === 'custom' ? calculateTokensFromPixAmount(amount) : 0

    // Create PIX payment
    const pixPayment = await createPixPayment({
      amount,
      description: `Falando com o Profeta - ${planType === 'custom' ? `${tokens} tokens` : planType}`,
      userId,
      userEmail,
      planType
    })

    // Save transaction to database
    const { data: transaction, error: transactionError } = await getSupabaseAdmin()
      .from('payment_transactions')
      .insert({
        user_id: userId,
        amount,
        currency: 'BRL',
        payment_method: 'pix',
        payment_intent_id: pixPayment.id,
        status: 'pending',
        plan_type: planType,
        tokens_amount: tokens,
        metadata: {
          pix_key: pixPayment.pixKey,
          qr_code: pixPayment.qrCode,
          expires_at: pixPayment.expiresAt.toISOString()
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: pixPayment.id,
        amount: pixPayment.amount,
        qrCode: pixPayment.qrCode,
        qrCodeImage: pixPayment.qrCodeImage,
        pixKey: pixPayment.pixKey,
        expiresAt: pixPayment.expiresAt,
        tokens: tokens
      },
      transaction: transaction
    })

  } catch (error) {
    console.error('PIX payment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}