const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL() {
  try {
    console.log('🔄 Executando SQL para criar tabela payment_transactions...');
    
    // Tentar executar usando uma query direta
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'payment_transactions');
    
    if (error) {
      console.log('❌ Erro ao verificar tabelas:', error.message);
    } else {
      console.log('📋 Resultado da busca por payment_transactions:', data);
      
      if (data.length === 0) {
        console.log('❌ Tabela payment_transactions não encontrada');
        
        // Vamos tentar criar usando uma abordagem mais simples
        console.log('🔄 Tentando criar tabela usando SQL direto...');
        
        // Primeiro, vamos verificar se podemos executar SQL
        const { data: sqlResult, error: sqlError } = await supabase
          .rpc('exec_sql', {
            sql: `CREATE TABLE IF NOT EXISTS public.payment_transactions (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL,
              amount DECIMAL(10,2) NOT NULL,
              payment_status TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`
          });
        
        if (sqlError) {
          console.log('❌ Erro ao executar SQL:', sqlError.message);
          console.log('📝 Você precisa executar o SQL manualmente no Supabase Dashboard');
        } else {
          console.log('✅ SQL executado com sucesso!');
        }
      } else {
        console.log('✅ Tabela payment_transactions já existe!');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

executeSQL();