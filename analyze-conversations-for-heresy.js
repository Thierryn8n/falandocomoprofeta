const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

async function analyzeConversationsStructure() {
  try {
    console.log('🔍 Analisando estrutura da tabela conversations...');
    
    // Buscar algumas conversations para entender a estrutura
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);
    
    if (convError) {
      console.error('❌ Erro ao buscar conversations:', convError);
      return;
    }
    
    console.log(`✅ Encontradas ${conversations.length} conversations para análise`);
    
    if (conversations.length > 0) {
      console.log('\n📊 Estrutura da tabela conversations:');
      const firstConv = conversations[0];
      Object.keys(firstConv).forEach(key => {
        console.log(`  - ${key}: ${typeof firstConv[key]} (${firstConv[key] ? 'tem valor' : 'vazio'})`);
      });
      
      console.log('\n📝 Exemplo de conversation:');
      console.log(JSON.stringify(firstConv, null, 2));
    }
    
    // Contar total de conversations
    const { count, error: countError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`\n📈 Total de conversations no banco: ${count}`);
    }
    
    // Verificar quantas conversations já têm logs de heresia
    const { data: existingLogs, error: logsError } = await supabase
      .from('heresy_logs')
      .select('conversation_id')
      .not('conversation_id', 'is', null);
    
    if (!logsError) {
      const uniqueConversationIds = new Set(existingLogs.map(log => log.conversation_id));
      console.log(`📋 Conversations que já têm logs de heresia: ${uniqueConversationIds.size}`);
      console.log(`🆕 Conversations para analisar: ${count - uniqueConversationIds.size}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

analyzeConversationsStructure();