import { NextRequest, NextResponse } from 'next/server'
import { loadAbacatePayConfig } from '@/lib/api-keys'

// Interface for Abacate Pay PIX QRCode status response
interface AbacatePixStatusResponse {
  data: {
    status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED'
    expiresAt: string
  }
  error: null | string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pixId = searchParams.get('id')

    // Validate required fields
    if (!pixId) {
      return NextResponse.json(
        { error: 'PIX ID is required' },
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

    // Call Abacate Pay PIX QRCode check API
    const response = await fetch(`${config.apiUrl}/v1/pixQrCode/check?id=${pixId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Abacate Pay PIX QRCode check API error:', errorData)
      
      return NextResponse.json(
        { 
          error: errorData.error || `Abacate Pay API Error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      )
    }

    const result: AbacatePixStatusResponse = await response.json()
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Return the PIX status data
    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Error checking PIX QRCode status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id: pixId } = body

    // Validate required fields
    if (!pixId) {
      return NextResponse.json(
        { error: 'PIX ID is required' },
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

    // Call Abacate Pay PIX QRCode check API
    const response = await fetch(`${config.apiUrl}/v1/pixQrCode/check?id=${pixId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Abacate Pay PIX QRCode check API error:', errorData)
      
      return NextResponse.json(
        { 
          error: errorData.error || `Abacate Pay API Error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      )
    }

    const result: AbacatePixStatusResponse = await response.json()
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // Return the PIX status data
    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Error checking PIX QRCode status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}