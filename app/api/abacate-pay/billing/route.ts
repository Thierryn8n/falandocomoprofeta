import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface BillingProduct {
  externalId: string
  name: string
  description: string
  quantity: number
  price: number // Price in cents
}

interface BillingRequest {
  frequency: 'ONE_TIME' | 'MULTIPLE_PAYMENTS'
  methods: string[]
  products: BillingProduct[]
  returnUrl: string
  completionUrl: string
  customerId?: string
  customer?: {
    metadata: {
      name: string
      cellphone?: string
      taxId?: string
      email: string
    }
  }
  allowCoupons?: boolean
  coupons?: string[]
  externalId?: string
}

interface BillingResponse {
  data: {
    id: string
    url: string
    amount: number
    status: string
    devMode: boolean
    methods: string[]
    products: any[]
    frequency: string
    nextBilling: string | null
    customer: {
      id: string
      metadata: {
        name: string
        cellphone?: string
        email: string
        taxId?: string
      }
    }
    allowCoupons: boolean
    coupons: string[]
  }
  error: null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      frequency = 'ONE_TIME',
      methods = ['PIX'],
      products,
      returnUrl,
      completionUrl,
      customerId,
      customer,
      allowCoupons = false,
      coupons = [],
      externalId
    }: BillingRequest = body

    // Validate required fields
    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'Products are required' },
        { status: 400 }
      )
    }

    if (!returnUrl || !completionUrl) {
      return NextResponse.json(
        { error: 'Return URL and completion URL are required' },
        { status: 400 }
      )
    }

    // Get Abacate Pay configuration
    const { data: config, error: configError } = await supabase
      .from('payment_methods')
      .select('config')
      .eq('provider', 'abacate_pay')
      .eq('is_active', true)
      .single()

    if (configError || !config?.config) {
      return NextResponse.json(
        { error: 'Abacate Pay not configured' },
        { status: 500 }
      )
    }

    const { api_key, api_url } = config.config

    if (!api_key || !api_url) {
      return NextResponse.json(
        { error: 'Abacate Pay API key or URL not configured' },
        { status: 500 }
      )
    }

    // Prepare billing data
    const billingData: any = {
      frequency,
      methods,
      products,
      returnUrl,
      completionUrl,
      allowCoupons,
      coupons
    }

    // Add customer data
    if (customerId) {
      billingData.customerId = customerId
    } else if (customer) {
      billingData.customer = customer
    }

    // Add external ID if provided
    if (externalId) {
      billingData.externalId = externalId
    }

    // Make request to Abacate Pay API
    const response = await fetch(`${api_url}/v1/billing/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(billingData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Abacate Pay API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to create billing' },
        { status: response.status }
      )
    }

    const billingResponse: BillingResponse = await response.json()

    // Store billing information in database for tracking
    const { error: storeError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: null, // Will be updated when we know the user
        amount: billingResponse.data.amount / 100, // Convert from cents
        currency: 'BRL',
        payment_method: 'abacate_pay',
        payment_status: 'pending',
        metadata: {
          billing_id: billingResponse.data.id,
          billing_url: billingResponse.data.url,
          external_id: externalId,
          products: products
        }
      })

    if (storeError) {
      console.error('Error storing billing transaction:', storeError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json(billingResponse)

  } catch (error) {
    console.error('Error creating billing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get Abacate Pay configuration
    const { data: config, error: configError } = await supabase
      .from('payment_methods')
      .select('config')
      .eq('provider', 'abacate_pay')
      .eq('is_active', true)
      .single()

    if (configError || !config?.config) {
      return NextResponse.json(
        { error: 'Abacate Pay not configured' },
        { status: 500 }
      )
    }

    const { api_key, api_url } = config.config

    if (!api_key || !api_url) {
      return NextResponse.json(
        { error: 'Abacate Pay API key or URL not configured' },
        { status: 500 }
      )
    }

    // Make request to Abacate Pay API to list billings
    const response = await fetch(`${api_url}/v1/billing/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Abacate Pay API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to list billings' },
        { status: response.status }
      )
    }

    const billingList = await response.json()
    return NextResponse.json(billingList)

  } catch (error) {
    console.error('Error listing billings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}