import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, testMode } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access Token é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do token
    const expectedPrefix = testMode ? 'TEST-' : 'APP_USR-'
    if (!accessToken.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Token deve começar com ${expectedPrefix} para ${testMode ? 'modo teste' : 'modo produção'}` 
        },
        { status: 400 }
      )
    }

    // Testar conexão com a API do Mercado Pago
    const baseUrl = testMode 
      ? 'https://api.mercadopago.com' 
      : 'https://api.mercadopago.com'

    const response = await fetch(`${baseUrl}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro na API do Mercado Pago: ${errorData.message || response.statusText}` 
        },
        { status: 400 }
      )
    }

    const userData = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Conexão estabelecida com sucesso!',
      user: {
        id: userData.id,
        email: userData.email,
        nickname: userData.nickname,
        country_id: userData.country_id,
        site_status: userData.site_status
      }
    })

  } catch (error) {
    console.error('Erro ao testar conexão com Mercado Pago:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}