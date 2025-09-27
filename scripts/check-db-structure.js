const { createClient } = require('@supabase/supabase-js')

// Configurações do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabaseStructure() {
  console.log('🔍 Verificando estrutura do banco de dados...')

  try {
    // Verificar tabelas existentes
    console.log('\n📋 Verificando tabelas...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['subscription_plans', 'user_subscriptions', 'user_tokens', 'token_usage_history'])

    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError)
    } else {
      console.log('✅ Tabelas encontradas:', tables?.map(t => t.table_name))
    }

    // Verificar estrutura da tabela subscription_plans
    console.log('\n📋 Verificando estrutura da tabela subscription_plans...')
    const { data: planColumns, error: planColumnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'subscription_plans')

    if (planColumnsError) {
      console.error('❌ Erro ao verificar colunas de subscription_plans:', planColumnsError)
    } else {
      console.log('✅ Colunas de subscription_plans:', planColumns)
    }

    // Verificar planos existentes
    console.log('\n📋 Verificando planos existentes...')
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')

    if (plansError) {
      console.error('❌ Erro ao verificar planos:', plansError)
    } else {
      console.log('✅ Planos encontrados:', plans)
    }

    // Verificar assinaturas existentes
    console.log('\n📋 Verificando assinaturas existentes...')
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(5)

    if (subscriptionsError) {
      console.error('❌ Erro ao verificar assinaturas:', subscriptionsError)
    } else {
      console.log('✅ Assinaturas encontradas:', subscriptions)
    }

    // Testar função can_user_chat se existir
    console.log('\n🔧 Testando função can_user_chat...')
    const { data: canChatResult, error: canChatError } = await supabase
      .rpc('can_user_chat', { p_user_id: '00000000-0000-0000-0000-000000000000' })

    if (canChatError) {
      console.error('❌ Função can_user_chat não encontrada ou erro:', canChatError)
    } else {
      console.log('✅ Função can_user_chat funcionando:', canChatResult)
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar verificação
checkDatabaseStructure()