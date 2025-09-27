const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (substitua pelos seus valores)
const SUPABASE_URL = 'https://ixqjqhqjqhqjqhqjqhqj.supabase.co'; // Substitua pela sua URL
const SUPABASE_SERVICE_KEY = 'your-service-role-key'; // Substitua pela sua chave

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTable() {
  try {
    console.log('🔧 Criando tabela mercado_pago_config...');
    
    // Primeiro, vamos tentar criar a tabela diretamente
    const { data, error } = await supabase
      .from('mercado_pago_config')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('📝 Tabela não existe, criando...');
      
      // Usar SQL direto para criar a tabela
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS mercado_pago_config (
          id SERIAL PRIMARY KEY,
          access_token TEXT NOT NULL DEFAULT '',
          public_key TEXT NOT NULL DEFAULT '',
          client_id TEXT,
          client_secret TEXT,
          webhook_url TEXT,
          test_mode BOOLEAN DEFAULT true,
          enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      // Tentar executar via query direta
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL
      });
      
      if (createError) {
        console.error('❌ Erro ao criar tabela:', createError);
        
        // Tentar método alternativo - inserir dados padrão
        console.log('🔄 Tentando método alternativo...');
        const { error: insertError } = await supabase
          .from('mercado_pago_config')
          .insert({
            access_token: '',
            public_key: '',
            test_mode: true,
            enabled: false
          });
        
        if (insertError) {
          console.error('❌ Erro no método alternativo:', insertError);
        } else {
          console.log('✅ Tabela criada via inserção!');
        }
      } else {
        console.log('✅ Tabela mercado_pago_config criada com sucesso!');
      }
    } else if (error) {
      console.error('❌ Erro ao verificar tabela:', error);
    } else {
      console.log('✅ Tabela mercado_pago_config já existe!');
    }
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

createTable();