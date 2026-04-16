import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Cliente Supabase com service role para acesso admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - Obter limites do usuário atual
export async function GET(request: NextRequest) {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verificar token e obter usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Chamar função RPC para obter estatísticas
    const { data: limitData, error: rpcError } = await supabaseAdmin
      .rpc('get_user_question_count', {
        p_user_id: userId
      })

    if (rpcError) {
      console.error('[API Limits] RPC Error:', rpcError)
      return NextResponse.json(
        { error: 'Failed to fetch limits', details: rpcError.message },
        { status: 500 }
      )
    }

    // Se não retornou dados, criar resposta padrão
    if (!limitData || limitData.length === 0) {
      return NextResponse.json({
        current_count: 0,
        max_allowed: 50,
        remaining: 50,
        can_ask: true,
        is_admin: false,
        reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    }

    const stats = limitData[0]

    return NextResponse.json({
      current_count: stats.current_count,
      max_allowed: stats.max_allowed,
      remaining: stats.remaining,
      can_ask: stats.can_ask,
      is_admin: stats.is_admin,
      reset_at: stats.reset_at
    })

  } catch (error) {
    console.error('[API Limits] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Verificar se pode perguntar (usado antes de enviar mensagem)
export async function POST(request: NextRequest) {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    
    // Verificar token e obter usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Verificar se pode perguntar
    const { data: canAsk, error: rpcError } = await supabaseAdmin
      .rpc('can_user_ask_question', {
        p_user_id: userId
      })

    if (rpcError) {
      console.error('[API Limits] RPC Error:', rpcError)
      return NextResponse.json(
        { error: 'Failed to check limit', details: rpcError.message },
        { status: 500 }
      )
    }

    // Se não pode perguntar, buscar estatísticas para mensagem
    if (!canAsk) {
      const { data: statsData } = await supabaseAdmin
        .rpc('get_user_question_count', {
          p_user_id: userId
        })
      
      const stats = statsData?.[0] || { remaining: 0, reset_at: null }
      
      return NextResponse.json({
        can_ask: false,
        remaining: 0,
        reset_at: stats.reset_at,
        message: 'Você atingiu o limite de 50 perguntas por dia. Faça uma doação para continuar ou aguarde até meia-noite.'
      }, { status: 429 }) // 429 Too Many Requests
    }

    return NextResponse.json({
      can_ask: true,
      message: 'OK'
    })

  } catch (error) {
    console.error('[API Limits] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
