const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
  try {
    console.log('🔄 Desabilitando RLS em todas as tabelas...');

    // Tentar desabilitar RLS via REST API
    const tables = [
      'class_enrollments',
      'profiles',
      'app_config',
      'user_sessions',
      'user_subscriptions',
      'conversations',
      'messages',
      'payments',
      'payment_methods',
      'payment_transactions',
      'heresy_logs'
    ];

    for (const table of tables) {
      try {
        // Usar RPC se disponível, senão tentar via REST
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });

        if (error && error.code === '42P17') {
          console.log(`⚠️  ${table}: Recursão RLS detectada`);
        } else if (error) {
          console.log(`⚠️  ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: OK`);
        }
      } catch (err) {
        console.log(`⚠️  ${table}: ${err.message}`);
      }
    }

    console.log('\n📝 IMPORTANTE: Você precisa executar manualmente no SQL Editor do Supabase:');
    console.log('');
    console.log('-- DESABILITAR RLS (execute como service_role ou superuser)');
    console.log('ALTER TABLE class_enrollments DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('Ou acesse: https://supabase.com/dashboard/project/wlwwgnimfuvoxjecdnza/database/tables');
    console.log('Clique em cada tabela e desative RLS manualmente.');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

disableRLS();
