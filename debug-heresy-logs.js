const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Ler variáveis de ambiente do arquivo .env.local
let supabaseUrl, supabaseKey

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
  })
} catch (error) {
  console.error('❌ Erro ao ler .env.local:', error.message)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugHeresyLogs() {
  console.log('🔍 Verificando tabela heresy_logs...\n')

  try {
    // 1. Verificar se a tabela existe e sua estrutura
    console.log('1. Verificando estrutura da tabela...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('heresy_logs')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ Erro ao acessar tabela:', tableError)
      return
    }

    console.log('✅ Tabela heresy_logs acessível')

    // 2. Contar total de registros
    console.log('\n2. Contando registros...')
    const { count, error: countError } = await supabase
      .from('heresy_logs')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError)
    } else {
      console.log(`📊 Total de registros: ${count}`)
    }

    // 3. Buscar alguns registros recentes
    console.log('\n3. Buscando registros recentes...')
    const { data: recentLogs, error: recentError } = await supabase
      .from('heresy_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('❌ Erro ao buscar registros:', recentError)
    } else {
      console.log(`📋 Registros encontrados: ${recentLogs?.length || 0}`)
      if (recentLogs && recentLogs.length > 0) {
        console.log('\n📝 Últimos registros:')
        recentLogs.forEach((log, index) => {
          console.log(`${index + 1}. ID: ${log.id}`)
          console.log(`   Usuário: ${log.user_id || 'N/A'}`)
          console.log(`   Mensagem: ${log.user_message?.substring(0, 50)}...`)
          console.log(`   Ação: ${log.action_taken}`)
          console.log(`   Data: ${log.created_at}`)
          console.log(`   Admin: ${log.admin_id || 'N/A'}`)
          console.log('   ---')
        })
      }
    }

    // 4. Verificar políticas RLS
    console.log('\n4. Verificando políticas RLS...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'heresy_logs' })
      .catch(() => {
        // Se a função não existir, tentamos uma consulta direta
        return supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'heresy_logs')
      })

    if (policiesError) {
      console.log('⚠️  Não foi possível verificar políticas RLS automaticamente')
    } else if (policies && policies.length > 0) {
      console.log('🔒 Políticas RLS encontradas:')
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} para ${policy.roles}`)
      })
    } else {
      console.log('⚠️  Nenhuma política RLS encontrada')
    }

    // 5. Testar consulta com JOIN (como no componente)
    console.log('\n5. Testando consulta com JOINs...')
    const { data: joinData, error: joinError } = await supabase
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
      console.log(`✅ Consulta com JOINs funcionou: ${joinData?.length || 0} registros`)
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugHeresyLogs()