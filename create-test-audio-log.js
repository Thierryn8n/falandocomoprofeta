const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

async function createTestAudioLog() {
  try {
    console.log('🔍 Buscando uma conversation com áudio...');
    
    // Buscar uma conversation que tenha áudio
    const { data: conversationWithAudio, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .not('audio_url', 'is', null)
      .limit(1)
      .single();
    
    if (convError || !conversationWithAudio) {
      console.error('❌ Nenhuma conversation com áudio encontrada:', convError);
      return;
    }
    
    console.log('✅ Conversation com áudio encontrada:', conversationWithAudio.title);
    console.log('🎵 URL do áudio:', conversationWithAudio.audio_url);
    
    // Criar um log de heresia usando essa conversation
    const { data: newLog, error: logError } = await supabase
      .from('heresy_logs')
      .insert({
        user_id: conversationWithAudio.user_id,
        conversation_id: conversationWithAudio.id,
        user_message: 'Mensagem de áudio de teste para heresia',
        action_taken: 'ai_classified_heresy',
        ai_classification: 'Teste de áudio',
        admin_id: conversationWithAudio.user_id // Usando o mesmo user_id como admin para teste
      })
      .select()
      .single();
    
    if (logError) {
      console.error('❌ Erro ao criar log de heresia:', logError);
      return;
    }
    
    console.log('✅ Log de heresia com áudio criado com sucesso!');
    console.log('📊 ID do log:', newLog.id);
    console.log('🎵 Conversation ID:', newLog.conversation_id);
    
    // Verificar se o log foi criado corretamente
    const { data: verifyLog, error: verifyError } = await supabase
      .from('heresy_logs')
      .select('*')
      .eq('id', newLog.id)
      .single();
    
    if (!verifyError && verifyLog) {
      console.log('✅ Verificação: Log criado corretamente');
      
      // Verificar se conseguimos buscar o áudio via conversation_id
      const { data: audioCheck, error: audioError } = await supabase
        .from('conversations')
        .select('audio_url')
        .eq('id', verifyLog.conversation_id)
        .single();
      
      if (!audioError && audioCheck?.audio_url) {
        console.log('✅ Áudio acessível via conversation_id:', audioCheck.audio_url);
      } else {
        console.error('❌ Erro ao acessar áudio:', audioError);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createTestAudioLog();