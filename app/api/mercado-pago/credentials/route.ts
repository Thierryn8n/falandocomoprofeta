import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { encryptCredentials, decryptCredentials } from '@/lib/encryption'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Função para verificar se o usuário é admin
async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Erro ao verificar role do usuário:', error)
    return false
  }

  return data?.role === 'admin'
}

// Função para obter usuário do token JWT
async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return null
  }

  return user
}

// GET - Recuperar credenciais do Mercado Pago
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Token de autenticação inválido' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem acessar as credenciais.' }, { status: 403 })
    }

    // Buscar credenciais ativas de produção
    const { data: credentials, error } = await supabase
      .from('mercado_pago_credentials')
      .select('*')
      .eq('is_active', true)
      .eq('environment', 'production')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar credenciais:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    if (!credentials) {
      // Retornar credenciais vazias se não houver dados
      return NextResponse.json({
        publicKey: '',
        accessToken: '',
        clientId: '',
        clientSecret: ''
      })
    }

    // Descriptografar credenciais
    try {
      const decryptedCredentials = decryptCredentials({
        publicKey: credentials.public_key,
        accessToken: credentials.access_token,
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret
      })

      return NextResponse.json(decryptedCredentials)
    } catch (decryptError) {
      console.error('Erro ao descriptografar credenciais:', decryptError)
      return NextResponse.json({ error: 'Erro ao processar credenciais' }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro no endpoint GET:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Salvar novas credenciais
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Token de autenticação inválido' }, { status: 401 })
    }

    const isAdmin = await isUserAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem salvar credenciais.' }, { status: 403 })
    }

    const body = await request.json()
    const { publicKey, accessToken, clientId, clientSecret } = body

    // Validação básica
    if (!accessToken || !publicKey) {
      return NextResponse.json({ error: 'Access Token e Public Key são obrigatórios' }, { status: 400 })
    }

    // Criptografar credenciais sensíveis
    const encryptedCredentials = encryptCredentials({
      publicKey,
      accessToken,
      clientId,
      clientSecret
    })

    // Desativar credenciais existentes
    await supabase
      .from('mercado_pago_credentials')
      .update({ active: false })
      .eq('environment', 'production')

    // Inserir novas credenciais
    const { data, error } = await supabase
      .from('mercado_pago_credentials')
      .insert({
        public_key_encrypted: encryptedCredentials.publicKey,
        access_token_encrypted: encryptedCredentials.accessToken,
        client_id_encrypted: encryptedCredentials.clientId,
        client_secret_encrypted: encryptedCredentials.clientSecret,
        environment: 'production',
        active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar credenciais:', error)
      return NextResponse.json({ error: 'Erro ao salvar credenciais no banco de dados' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Credenciais salvas com sucesso',
      id: data.id 
    })

  } catch (error) {
    console.error('Erro no endpoint POST:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar credenciais existentes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { publicKey, accessToken, clientId, clientSecret } = body

    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário é admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Verificar se o usuário é admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem atualizar credenciais.' }, { status: 403 })
    }

    // Criptografar dados sensíveis antes de atualizar
    const encryptedCredentials = {
      public_key: publicKey ? encryptSensitiveData(publicKey) : null,
      access_token: accessToken ? encryptSensitiveData(accessToken) : null,
      client_id: clientId ? encryptSensitiveData(clientId) : null,
      client_secret: clientSecret ? encryptSensitiveData(clientSecret) : null,
    }

    // Atualizar credenciais ativas
    const { data, error } = await supabase
      .from('mercado_pago_credentials')
      .update(encryptedCredentials)
      .eq('environment', 'production')
      .eq('is_active', true)
      .select()

    if (error) {
      console.error('Erro ao atualizar credenciais:', error)
      return NextResponse.json({ error: 'Erro ao atualizar credenciais' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Credenciais atualizadas com sucesso'
    })

  } catch (error) {
    console.error('Erro no endpoint PUT:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}