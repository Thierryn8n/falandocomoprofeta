const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

async function checkApiKeysStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela api_keys...');
    
    // Tentar buscar todos os dados da tabela api_keys
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela api_keys:', error);
      
      // Tentar verificar se existe uma tabela de configurações
      console.log('\n🔍 Tentando buscar em outras tabelas de configuração...');
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .limit(5);
      
      if (settingsError) {
        console.error('❌ Tabela settings também não encontrada:', settingsError);
      } else {
        console.log('✅ Tabela settings encontrada:', settingsData);
      }
      
      return;
    }
    
    console.log('✅ Estrutura da tabela api_keys:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data && data.length > 0) {
      console.log('\n📋 Campos disponíveis:');
      Object.keys(data[0]).forEach(key => {
        console.log(`- ${key}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkApiKeysStructure();