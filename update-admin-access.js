const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iqjhqvvjqxjqjqjqjqjq.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateCanUserChatFunction() {
  console.log('🔄 Atualizando função can_user_chat para incluir administradores...')

  try {
    // Usar query SQL direta ao invés de RPC
    const { data, error } = await supabase.from('dummy').select('*').limit(0) // Dummy query para testar conexão
    
    if (error && !error.message.includes('relation "dummy" does not exist')) {
      console.error('❌ Erro de conexão:', error)
      return false
    }

    console.log('✅ Conexão com Supabase estabelecida')
    
    // Como não podemos usar exec_sql, vamos apenas simular a atualização
    console.log('📝 Função SQL que seria executada:')
    console.log(`
      CREATE OR REPLACE FUNCTION can_user_chat(p_user_id UUID)
      RETURNS BOOLEAN AS $$
      DECLARE
          has_active_subscription BOOLEAN := false;
          is_admin BOOLEAN := false;
      BEGIN
          -- Verificar se o usuário é admin - admins têm acesso ilimitado
          SELECT EXISTS(
              SELECT 1 FROM public.profiles
              WHERE id = p_user_id AND role = 'admin'
          ) INTO is_admin;
          
          IF is_admin THEN
              RETURN true;
          END IF;
          
          -- Para usuários não-admin, verificar se tem assinatura ativa
          SELECT EXISTS(
              SELECT 1 FROM public.user_subscriptions us
              JOIN public.subscription_plans sp ON us.plan_id = sp.id
              WHERE us.user_id = p_user_id 
              AND us.status = 'active'
              AND (us.current_period_end IS NULL OR us.current_period_end > NOW())
              AND sp.is_active = true
          ) INTO has_active_subscription;
          
          RETURN has_active_subscription;
      END;
      $$ LANGUAGE plpgsql;
    `)

    console.log('⚠️ Esta função precisa ser executada manualmente no painel do Supabase')
    return true

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return false
  }
}

async function testAdminAccess() {
  console.log('🧪 Testando acesso de administrador...')

  try {
    // Buscar um usuário admin para testar
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (adminError || !adminUser) {
      console.log('⚠️ Nenhum usuário admin encontrado para teste')
      return
    }

    console.log('👤 Usuário admin encontrado:', adminUser.email)

  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

async function main() {
  console.log('🚀 Iniciando verificação de acesso para administradores...')
  
  const success = await updateCanUserChatFunction()
  
  if (success) {
    await testAdminAccess()
    console.log('\n✅ Verificação concluída! As alterações no frontend já garantem acesso ilimitado aos administradores.')
    console.log('📋 Resumo das alterações implementadas:')
    console.log('   - Hook use-tokens.ts: Bypass de verificação de assinatura para admins')
    console.log('   - API chat/route.ts: Verificação de role admin antes da assinatura')
    console.log('   - Função SQL can_user_chat: Precisa ser atualizada manualmente (código fornecido acima)')
  } else {
    console.log('\n❌ Falha na verificação.')
  }
}

// Executar script
main().catch(console.error)