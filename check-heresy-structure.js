const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela heresy_logs...');
    
    // Buscar alguns registros para ver a estrutura
    const { data: logs, error } = await supabase
      .from('heresy_logs')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Erro ao buscar logs:', error);
      return;
    }
    
    if (logs && logs.length > 0) {
      console.log('📊 Estrutura encontrada:');
      console.log('Campos disponíveis:', Object.keys(logs[0]));
      console.log('\n📝 Exemplo de registro:');
      console.log(JSON.stringify(logs[0], null, 2));
      
      // Verificar se há campos relacionados a áudio
      const audioFields = Object.keys(logs[0]).filter(key => 
        key.toLowerCase().includes('audio') || 
        key.toLowerCase().includes('voice') || 
        key.toLowerCase().includes('sound') ||
        key.toLowerCase().includes('file') ||
        key.toLowerCase().includes('url')
      );
      
      if (audioFields.length > 0) {
        console.log('\n🎵 Campos relacionados a áudio encontrados:', audioFields);
      } else {
        console.log('\n⚠️ Nenhum campo relacionado a áudio encontrado');
      }
      
    } else {
      console.log('⚠️ Nenhum registro encontrado na tabela');
    }
    
    // Verificar também a tabela conversations para entender como áudios são armazenados
    console.log('\n🔍 Verificando estrutura da tabela conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(2);
    
    if (convError) {
      console.error('❌ Erro ao buscar conversations:', convError);
    } else if (conversations && conversations.length > 0) {
      console.log('📊 Campos da tabela conversations:', Object.keys(conversations[0]));
      console.log('\n📝 Exemplo de conversation:');
      console.log(JSON.stringify(conversations[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkTableStructure();