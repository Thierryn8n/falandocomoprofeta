import { NextRequest, NextResponse } from 'next/server'
import { loadAbacatePayConfig } from '@/lib/api-keys'

// Interface for PIX QRCode creation request
interface CreatePixQRCodeRequest {
  amount: number
  expiresIn?: number
  description?: string
  customer?: {
    name: string
    cellphone?: string
    email: string
    taxId?: string
  }
  metadata?: Record<string, any>
}

// Interface for Abacate Pay PIX QRCode response
interface AbacatePixQRCodeResponse {
  data: {
    id: string
    amount: number
    status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED'
    devMode: boolean
    method: string
    brCode: string
    brCodeBase64: string
    platformFee: number
    description?: string
    metadata?: Record<string, any>
    createdAt: string
    updatedAt: string
    expiresAt: string
  }
  error: null | string
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePixQRCodeRequest = await request.json()

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount is required and must be greater than 0' },
        { status: 400 }
      )
    }

    // Get Abacate Pay configuration
    const config = await loadAbacatePayConfig()
    
    if (!config.apiKey) {
      return NextResponse.json(
        { error: 'Abacate Pay API key not configured' },
        { status: 500 }
      )
    }

    // Prepare request data for Abacate Pay API
    const pixRequest: CreatePixQRCodeRequest = {
      amount: body.amount,
      expiresIn: body.expiresIn || 30 * 60, // Default 30 minutes
      description: body.description || 'Pagamento PIX',
      customer: body.customer,
      metadata: {
        ...body.metadata,
        source: 'falandocomoprofeta',
        timestamp: new Date().toISOString()
      }
    }

    // Call Abacate Pay PIX QRCode API
    const response = await fetch(`${config.apiUrl}/v1/pixQrCode/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pixRequest)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Abacate Pay PIX QRCode API error:', errorData)
      
      return NextResponse.json(
        { 
          error: errorData.error || `Abacate Pay API Error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      )
    }

    const result: AbacatePixQRCodeResponse = await response.json()
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Return the PIX QRCode data
    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Error creating PIX QRCode:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}