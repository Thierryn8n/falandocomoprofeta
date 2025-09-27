import { NextRequest, NextResponse } from 'next/server'

// POST - Testar webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhook_url } = body

    if (!webhook_url) {
      return NextResponse.json(
        { error: 'URL do webhook é obrigatória' },
        { status: 400 }
      )
    }

    // Validar URL
    try {
      new URL(webhook_url)
    } catch {
      return NextResponse.json(
        { error: 'URL do webhook deve ser válida' },
        { status: 400 }
      )
    }

    // Simular teste do webhook
    const testPayload = {
      event: 'payment.completed',
      data: {
        id: 'test_payment_123',
        amount: 29.90,
        currency: 'BRL',
        status: 'completed',
        customer: {
          email: 'test@example.com',
          name: 'Cliente Teste'
        },
        created_at: new Date().toISOString()
      }
    }

    try {
      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Abacate-Pay-Webhook-Test/1.0'
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000) // 10 segundos timeout
      })

      const responseText = await response.text()

      return NextResponse.json({
        success: true,
        message: 'Webhook testado com sucesso',
        webhook_response: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText
        }
      })

    } catch (error: any) {
      console.error('Erro ao testar webhook:', error)
      
      return NextResponse.json({
        success: false,
        message: 'Erro ao testar webhook',
        error: error.message || 'Erro desconhecido'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}