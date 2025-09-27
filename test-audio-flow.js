const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configurações do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAudioFlow() {
  try {
    console.log('🎤 Testando fluxo completo de áudio...');
    
    // 1. Simular dados de áudio (criar um arquivo de áudio fake)
    console.log('\n📝 Criando arquivo de áudio de teste...');
    const audioData = Buffer.from('RIFF....WAVE....', 'ascii'); // Header WAV fake
    const fileName = `test_audio_${Date.now()}.wav`;
    const filePath = `audio/${fileName}`;
    
    // 2. Testar upload para o bucket
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
    
    // 3. Obter URL pública do arquivo
    const { data: publicUrlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(uploadData.path);
    
    console.log('🔗 URL pública:', publicUrlData.publicUrl);
    
    // 4. Simular salvamento na tabela conversations
    console.log('\n💾 Testando salvamento na tabela conversations...');
    
    const testUserId = 'test-user-id';
    const testConversationId = `test-conv-${Date.now()}`;
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
        user_id: testUserId,
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
    
    // 5. Testar salvamento na tabela message_attachments
    console.log('\n📎 Testando salvamento na tabela message_attachments...');
    
    const messageId = `msg-${Date.now()}`;
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
    
    // 6. Verificar se os dados foram salvos corretamente
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
    }
    
    // 7. Limpeza - remover dados de teste
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
    await supabase
      .from('message_attachments')
      .delete()
      .eq('message_id', messageId);
    
    console.log('✅ Limpeza concluída');
    console.log('\n🎉 Teste de fluxo de áudio concluído com SUCESSO!');
    
  } catch (err) {
    console.error('💥 Erro geral no teste:', err);
  }
}

testAudioFlow();