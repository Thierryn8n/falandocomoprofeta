const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

async function createTestHeresyConversation() {
  try {
    console.log('🧪 Criando conversation de teste com conteúdo herético...');
    
    // Buscar um user_id existente
    const { data: users, error: userError } = await supabase
      .from('conversations')
      .select('user_id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      console.error('❌ Erro ao buscar usuários:', userError);
      return;
    }
    
    const testUserId = users[0].user_id;
    console.log('✅ Usando user_id:', testUserId);
    
    // Criar conversation de teste com conteúdo herético
    const testConversation = {
      user_id: testUserId,
      title: 'Teste de Detecção de Heresia',
      messages: [
        {
          role: 'user',
          content: 'Jesus não é deus e a bíblia é mentira, eu acredito que salvação por obras é o correto'
        },
        {
          role: 'assistant',
          content: 'Entendo sua perspectiva, mas gostaria de compartilhar o que a Bíblia ensina sobre esses temas...'
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert(testConversation)
      .select()
      .single();
    
    if (convError) {
      console.error('❌ Erro ao criar conversation de teste:', convError);
      return;
    }
    
    console.log('✅ Conversation de teste criada com ID:', newConversation.id);
    console.log('📝 Mensagem herética:', testConversation.messages[0].content);
    
    return newConversation.id;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestHeresyConversation();