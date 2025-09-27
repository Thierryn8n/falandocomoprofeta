const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Ler variáveis de ambiente do arquivo .env.local
let supabaseUrl, supabaseKey, supabaseAnonKey

try {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const envLines = envContent.split('\n')
  
  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim()
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim()
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim()
    }
  })
} catch (error) {
  console.error('❌ Erro ao ler .env.local:', error.message)
}

if (!supabaseUrl || !supabaseKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

async function testHeresyRLS() {
  console.log('🔍 Testando políticas RLS da tabela heresy_logs...\n')

  try {
    // 1. Testar com service role (deve funcionar)
    console.log('1. Testando com Service Role Key (admin)...')
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('heresy_logs')
      .select('*')
      .limit(3)

    if (adminError) {
      console.error('❌ Erro com service role:', adminError)
    } else {
      console.log(`✅ Service role: ${adminData?.length || 0} registros encontrados`)
    }

    // 2. Testar com anon key (não deve funcionar)
    console.log('\n2. Testando com Anon Key (usuário não autenticado)...')
    const { data: anonData, error: anonError } = await supabaseClient
      .from('heresy_logs')
      .select('*')
      .limit(3)

    if (anonError) {
      console.log('✅ Anon key bloqueada (esperado):', anonError.message)
    } else {
      console.log(`⚠️  Anon key funcionou: ${anonData?.length || 0} registros`)
    }

    // 3. Verificar se existe usuário admin
    console.log('\n3. Verificando usuários admin...')
    const { data: adminUsers, error: adminUsersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, role')
      .eq('role', 'admin')

    if (adminUsersError) {
      console.error('❌ Erro ao buscar admins:', adminUsersError)
    } else {
      console.log(`👥 Usuários admin encontrados: ${adminUsers?.length || 0}`)
      if (adminUsers && adminUsers.length > 0) {
        adminUsers.forEach(admin => {
          console.log(`   - ${admin.email} (${admin.name || 'Sem nome'}) - ID: ${admin.id}`)
        })
      }
    }

    // 4. Testar consulta com JOIN como no componente
    console.log('\n4. Testando consulta com JOINs (service role)...')
    const { data: joinData, error: joinError } = await supabaseAdmin
      .from('heresy_logs')
      .select(`
        *,
        profiles:user_id (email, name),
        heresy_responses:detected_heresy_id (heresy_phrase)
      `)
      .limit(3)

    if (joinError) {
      console.error('❌ Erro na consulta com JOINs:', joinError)
    } else {
      console.log(`✅ Consulta com JOINs: ${joinData?.length || 0} registros`)
      if (joinData && joinData.length > 0) {
        console.log('📋 Exemplo de registro:')
        const log = joinData[0]
        console.log(`   ID: ${log.id}`)
        console.log(`   Mensagem: ${log.user_message?.substring(0, 50)}...`)
        console.log(`   Ação: ${log.action_taken}`)
        console.log(`   Perfil: ${log.profiles?.email || 'N/A'}`)
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testHeresyRLS()