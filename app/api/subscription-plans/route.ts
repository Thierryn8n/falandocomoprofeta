import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usando service role key para operações administrativas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wlwwgnimfuvoxjecdnza.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTQxNTUsImV4cCI6MjA2ODYzMDE1NX0.cbPMldu0By33z3ntjC7jKQA08S6LcNHQseHR7-QYLmc"

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching subscription plans:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscription plans' },
        { status: 500 }
      )
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { planType, price } = await request.json()
    
    console.log('PUT Request received:', { planType, price })
    
    // Verificar se o plano existe antes de atualizar
    const { data: existingPlan, error: checkError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', planType)
      .single()
    
    if (checkError) {
      console.error('Error checking existing plan:', checkError)
      return NextResponse.json(
        { error: 'Plan not found', details: checkError.message },
        { status: 404 }
      )
    }
    
    console.log('Existing plan found:', existingPlan)

    const { data, error } = await supabase
      .from('subscription_plans')
      .update({ 
        price: parseFloat(price)
        // Removendo updated_at manual pois o trigger deve cuidar disso
      })
      .eq('plan_type', planType)
      .select('*') // Garantindo que todos os campos sejam retornados

    if (error) {
      console.error('Error updating subscription plan:', error)
      return NextResponse.json(
        { error: 'Failed to update subscription plan', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('Plan updated successfully:', data)

    if (!data || data.length === 0) {
      console.error('No data returned from update operation')
      return NextResponse.json(
        { error: 'Update operation completed but no data returned' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      plan: data[0],
      message: 'Plan updated successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}