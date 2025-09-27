const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTQxNTUsImV4cCI6MjA2ODYzMDE1NX0.cbPMldu0By33z3ntjC7jKQA08S6LcNHQseHR7-QYLmc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithRealMessage() {
  console.log('🔍 Testando com mensagem real...\n');

  try {
    // 1. Buscar uma mensagem existente
    console.log('1. Buscando mensagens existentes...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id')
      .limit(5);

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens:', messagesError);
      return;
    }

    console.log(`📊 Encontradas ${messages.length} mensagens`);
    if (messages.length === 0) {
      console.log('⚠️ Nenhuma mensagem encontrada. Criando uma mensagem de teste...');
      
      // Buscar uma conversa existente
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      if (convError || conversations.length === 0) {
        console.log('❌ Nenhuma conversa encontrada. Não é possível testar.');
        return;
      }

      // Criar uma mensagem de teste
      const { data: newMessage, error: createError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversations[0].id,
          content: 'Mensagem de teste para attachment',
          role: 'user'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar mensagem:', createError);
        return;
      }

      console.log('✅ Mensagem de teste criada:', newMessage.id);
      messages.push(newMessage);
    }

    // 2. Tentar inserir attachment com mensagem real
    const messageId = messages[0].id;
    console.log(`\n2. Testando inserção com message_id real: ${messageId}`);

    const testData = {
      id: crypto.randomUUID(),
      message_id: messageId,
      file_name: 'test-audio.webm',
      file_type: 'audio/webm',
      file_size: 1024,
      storage_path: 'test-storage-path'
    };

    console.log('Dados de teste:', testData);

    const { data: insertData, error: insertError } = await supabase
      .from('message_attachments')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Erro na inserção:', insertError);
      console.error('Detalhes do erro:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Inserção bem-sucedida:', insertData);
      
      // Limpar dados de teste
      await supabase
        .from('message_attachments')
        .delete()
        .eq('id', testData.id);
      console.log('🧹 Dados de teste removidos');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testWithRealMessage();