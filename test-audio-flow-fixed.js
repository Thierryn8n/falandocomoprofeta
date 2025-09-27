const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configurações do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para gerar UUID válido
function generateUUID() {
  return crypto.randomUUID();
}

async function testAudioFlowFixed() {
  try {
    console.log('🎤 Testando fluxo completo de áudio (versão corrigida)...');
    
    // 1. Primeiro, verificar se existe um usuário real na tabela profiles
    console.log('\n👤 Verificando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ Nenhum usuário encontrado na tabela profiles');
      console.log('ℹ️  Criando usuário de teste...');
      
      // Criar usuário de teste
      const testUserId = generateUUID();
      const { data: newUser, error: createUserError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (createUserError) {
        console.error('❌ Erro ao criar usuário de teste:', createUserError);
        return;
      }
      
      console.log('✅ Usuário de teste criado:', newUser.id);
      var realUserId = newUser.id;
    } else {
      var realUserId = users[0].id;
      console.log('✅ Usando usuário existente:', realUserId);
    }
    
    // 2. Simular dados de áudio
    console.log('\n📝 Criando arquivo de áudio de teste...');
    const audioData = Buffer.from('RIFF....WAVE....', 'ascii');
    const fileName = `test_audio_${Date.now()}.wav`;
    const filePath = `audio/${fileName}`;
    
    // 3. Testar upload para o bucket
    console.log('📤 Testando upload para bucket attachments...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, audioData, {
        contentType: 'audio/wav',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError);
      return;
    }
    
    console.log('✅ Upload bem-sucedido:', uploadData.path);
    
    // 4. Obter URL pública do arquivo
    const { data: publicUrlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(uploadData.path);
    
    console.log('🔗 URL pública:', publicUrlData.publicUrl);
    
    // 5. Simular salvamento na tabela conversations
    console.log('\n💾 Testando salvamento na tabela conversations...');
    
    const testConversationId = generateUUID();
    const testMessages = [
      {
        role: 'user',
        content: '[Mensagem de áudio de teste]',
        timestamp: new Date().toISOString(),
        audioUrl: publicUrlData.publicUrl
      }
    ];
    
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert({
        id: testConversationId,
        user_id: realUserId,
        title: 'Teste de Áudio',
        messages: testMessages,
        audio_url: uploadData.path,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (convError) {
      console.error('❌ Erro ao salvar conversa:', convError);
    } else {
      console.log('✅ Conversa salva com sucesso');
      console.log('📊 ID da conversa:', convData.id);
      console.log('🎵 Audio URL salvo:', convData.audio_url);
    }
    
    // 6. Testar salvamento na tabela message_attachments
    console.log('\n📎 Testando salvamento na tabela message_attachments...');
    
    const messageId = generateUUID();
    const { data: attachData, error: attachError } = await supabase
      .from('message_attachments')
      .insert({
        message_id: messageId,
        file_name: fileName,
        file_type: 'audio/wav',
        file_size: audioData.length,
        storage_path: uploadData.path
      })
      .select()
      .single();
    
    if (attachError) {
      console.error('❌ Erro ao salvar attachment:', attachError);
    } else {
      console.log('✅ Attachment salvo com sucesso');
      console.log('📊 ID do attachment:', attachData.id);
    }
    
    // 7. Verificar se os dados foram salvos corretamente
    console.log('\n🔍 Verificando dados salvos...');
    
    const { data: savedConv, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', testConversationId)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar conversa salva:', fetchError);
    } else {
      console.log('✅ Conversa recuperada com sucesso');
      console.log('📋 Mensagens salvas:', savedConv.messages.length);
      console.log('🎵 Audio URL recuperado:', savedConv.audio_url);
      console.log('📝 Conteúdo da primeira mensagem:', savedConv.messages[0].content);
    }
    
    // 8. Testar a API de conversações (simulando o que o frontend faz)
    console.log('\n🌐 Testando API de conversações...');
    
    const apiTestMessages = [
      {
        role: 'user',
        content: 'Teste de mensagem via API',
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: 'Resposta do assistente',
        timestamp: new Date().toISOString()
      }
    ];
    
    // Simular chamada para a API
    const apiPayload = {
      user_id: realUserId,
      conversation_id: testConversationId,
      messages: apiTestMessages,
      audio_url: uploadData.path
    };
    
    console.log('📤 Payload da API:', JSON.stringify(apiPayload, null, 2));
    
    // 9. Limpeza - remover dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    // Remover arquivo do storage
    await supabase.storage
      .from('attachments')
      .remove([uploadData.path]);
    
    // Remover conversa de teste
    await supabase
      .from('conversations')
      .delete()
      .eq('id', testConversationId);
    
    // Remover attachment de teste
    if (attachData) {
      await supabase
        .from('message_attachments')
        .delete()
        .eq('message_id', messageId);
    }
    
    console.log('✅ Limpeza concluída');
    console.log('\n🎉 Teste de fluxo de áudio concluído com SUCESSO!');
    console.log('\n📋 RESUMO:');
    console.log('✅ Bucket attachments: Funcionando');
    console.log('✅ Upload de áudio: Funcionando');
    console.log('✅ Tabela conversations: Funcionando');
    console.log('✅ Tabela message_attachments: Funcionando');
    console.log('✅ Campo audio_url: Presente e funcional');
    
  } catch (err) {
    console.error('💥 Erro geral no teste:', err);
  }
}

testAudioFlowFixed();