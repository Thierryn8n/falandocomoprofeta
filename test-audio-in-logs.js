const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

async function testAudioInLogs() {
  try {
    console.log('🔍 Buscando logs de heresia com áudio...');
    
    // Buscar logs de heresia
    const { data: logs, error: logsError } = await supabase
      .from('heresy_logs')
      .select('*')
      .limit(10);
    
    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError);
      return;
    }
    
    console.log(`📊 Encontrados ${logs.length} logs de heresia`);
    
    // Para cada log, verificar se a conversation tem áudio
    let logsWithAudio = 0;
    
    for (const log of logs) {
      if (log.conversation_id) {
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('audio_url')
          .eq('id', log.conversation_id)
          .single();
        
        if (!convError && conversation && conversation.audio_url) {
          logsWithAudio++;
          console.log(`🎵 Log ${log.id} tem áudio: ${conversation.audio_url}`);
        }
      }
    }
    
    console.log(`\n📈 Resumo:`);
    console.log(`- Total de logs: ${logs.length}`);
    console.log(`- Logs com áudio: ${logsWithAudio}`);
    console.log(`- Logs sem áudio: ${logs.length - logsWithAudio}`);
    
    // Buscar algumas conversations com áudio para exemplo
    console.log('\n🔍 Buscando conversations com áudio...');
    const { data: conversationsWithAudio, error: audioError } = await supabase
      .from('conversations')
      .select('id, audio_url, title')
      .not('audio_url', 'is', null)
      .limit(5);
    
    if (!audioError && conversationsWithAudio) {
      console.log(`📊 Encontradas ${conversationsWithAudio.length} conversations com áudio:`);
      conversationsWithAudio.forEach(conv => {
        console.log(`- ${conv.title}: ${conv.audio_url}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testAudioInLogs();