// PIX Integration Library - Abacate Pay PIX QRCode API
// Integrates with Abacate Pay PIX QRCode API for real PIX payments

import { loadAbacatePayConfig } from './api-keys'

// Abacate Pay PIX QRCode response structure
export interface AbacatePixQRCodeData {
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

// Our internal PIX payment data structure
export interface PixPaymentData {
  id: string
  amount: number
  description: string
  pixKey: string
  qrCode: string
  qrCodeImage: string
  expiresAt: Date
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
}

export interface CreatePixPaymentRequest {
  amount: number
  description: string
  userId: string
  userEmail: string
  planType: string
}

// Create PIX QRCode request for Abacate Pay API
interface CreateAbacatePixRequest {
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

// Create a PIX payment using Abacate Pay PIX QRCode API
export async function createPixPayment(request: CreatePixPaymentRequest): Promise<PixPaymentData> {
  try {
    // Get Abacate Pay configuration
    const config = await loadAbacatePayConfig()
    
    if (!config.apiKey) {
      throw new Error('Abacate Pay API key not configured')
    }

    // Prepare request data for Abacate Pay
    const abacateRequest: CreateAbacatePixRequest = {
      amount: request.amount, // Amount in cents
      expiresIn: 30 * 60, // 30 minutes in seconds
      description: request.description || `Pagamento PIX - ${request.planType}`,
      customer: {
        name: request.userEmail.split('@')[0], // Use email prefix as name fallback
        email: request.userEmail
      },
      metadata: {
        userId: request.userId,
        planType: request.planType,
        source: 'falandocomoprofeta'
      }
    }

    // Call Abacate Pay PIX QRCode API
    const response = await fetch(`${config.apiUrl}/v1/pixQrCode/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(abacateRequest)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Abacate Pay PIX QRCode API error:', errorData)
      throw new Error(errorData.error || `API Error: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error)
    }

    const abacateData: AbacatePixQRCodeData = result.data

    // Convert Abacate Pay response to our internal format
    const pixPayment: PixPaymentData = {
      id: abacateData.id,
      amount: abacateData.amount,
      description: abacateData.description || request.description,
      pixKey: abacateData.brCode, // Use brCode as the PIX key
      qrCode: abacateData.brCode,
      qrCodeImage: abacateData.brCodeBase64, // Base64 QR code image
      expiresAt: new Date(abacateData.expiresAt),
      status: mapAbacateStatusToInternal(abacateData.status)
    }

    return pixPayment

  } catch (error) {
    console.error('Error creating PIX payment with Abacate Pay:', error)
    throw error
  }
}

// Check PIX payment status using Abacate Pay PIX QRCode API
export async function checkPixPaymentStatus(paymentId: string): Promise<PixPaymentData | null> {
  try {
    // Get Abacate Pay configuration
    const config = await loadAbacatePayConfig()
    
    if (!config.apiKey) {
      throw new Error('Abacate Pay API key not configured')
    }

    // Call Abacate Pay PIX QRCode check API
    const response = await fetch(`${config.apiUrl}/v1/pixQrCode/check?id=${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Abacate Pay PIX QRCode check API error:', errorData)
      return null
    }

    const result = await response.json()
    
    if (result.error) {
      console.error('Abacate Pay API returned error:', result.error)
      return null
    }

    const statusData = result.data

    // Return simplified status data
    return {
      id: paymentId,
      amount: 0, // Status check doesn't return amount
      description: '',
      pixKey: '',
      qrCode: '',
      qrCodeImage: '',
      expiresAt: new Date(statusData.expiresAt),
      status: mapAbacateStatusToInternal(statusData.status)
    }

  } catch (error) {
    console.error('Error checking PIX payment status with Abacate Pay:', error)
    return null
  }
}

// Map Abacate Pay status to our internal status
function mapAbacateStatusToInternal(abacateStatus: string): 'pending' | 'paid' | 'expired' | 'cancelled' {
  switch (abacateStatus) {
    case 'PAID':
      return 'paid'
    case 'EXPIRED':
      return 'expired'
    case 'CANCELLED':
      return 'cancelled'
    case 'PENDING':
    default:
      return 'pending'
  }
}

// Format amount for display
export function formatPixAmount(amountInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountInCents / 100)
}

// Calculate tokens from PIX payment amount
export function calculateTokensFromPixAmount(amountInCents: number): number {
  // R$ 1,00 = 10 tokens
  // Minimum of 10 tokens for any payment
  return Math.max(10, Math.floor(amountInCents / 10))
}

// Validate PIX payment amount
export function validatePixAmount(amountInCents: number): boolean {
  // Minimum R$ 1,00, maximum R$ 10,000,00
  return amountInCents >= 100 && amountInCents <= 1000000
}