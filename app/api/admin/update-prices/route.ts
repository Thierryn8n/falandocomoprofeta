import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { monthly, yearly, lifetime } = await request.json()

    console.log('Received prices:', { monthly, yearly, lifetime })

    // Validate input
    if (!monthly || !yearly || !lifetime) {
      return NextResponse.json(
        { error: 'All plan prices are required' },
        { status: 400 }
      )
    }

    // Convert to numbers and validate
    const monthlyPrice = parseFloat(monthly.replace(',', '.'))
    const yearlyPrice = parseFloat(yearly.replace(',', '.'))
    const lifetimePrice = parseFloat(lifetime.replace(',', '.'))

    console.log('Parsed prices:', { monthlyPrice, yearlyPrice, lifetimePrice })

    if (isNaN(monthlyPrice) || isNaN(yearlyPrice) || isNaN(lifetimePrice)) {
      return NextResponse.json(
        { error: 'Invalid price format' },
        { status: 400 }
      )
    }

    // Update or insert plan prices in the database
    const planUpdates = [
      { plan_type: 'monthly', price: monthlyPrice },
      { plan_type: 'yearly', price: yearlyPrice },
      { plan_type: 'lifetime', price: lifetimePrice }
    ]

    console.log('Plan updates:', planUpdates)

    for (const plan of planUpdates) {
      console.log(`Updating plan: ${plan.plan_type} with price: ${plan.price}`)
      
      const { data, error } = await getSupabaseAdmin()
        .from('subscription_plans')
        .upsert({
          plan_type: plan.plan_type,
          price: plan.price,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'plan_type'
        })
        .select()

      if (error) {
        console.error(`Error updating ${plan.plan_type}:`, error)
        throw error
      }
      
      console.log(`Successfully updated ${plan.plan_type}:`, data)
    }

    console.log('All plans updated successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating plan prices:', error)
    return NextResponse.json(
      { error: 'Failed to update plan prices', details: error.message },
      { status: 500 }
    )
  }
}