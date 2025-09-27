const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

async function debugAudioIssue() {
  try {
    console.log('🔍 Verificando logs de heresia com áudio...');
    
    // Buscar logs de heresia que têm conversation_id
    const { data: heresyLogs, error: heresyError } = await supabase
      .from('heresy_logs')
      .select('*')
      .not('conversation_id', 'is', null)
      .limit(5);
    
    if (heresyError) {
      console.error('❌ Erro ao buscar logs de heresia:', heresyError);
      return;
    }
    
    console.log(`✅ Encontrados ${heresyLogs.length} logs com conversation_id`);
    
    for (const log of heresyLogs) {
      console.log(`\n📊 Log ID: ${log.id}`);
      console.log(`🗣️ Conversation ID: ${log.conversation_id}`);
      
      // Buscar a conversation correspondente
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('audio_url, title')
        .eq('id', log.conversation_id)
        .single();
      
      if (convError) {
        console.error(`❌ Erro ao buscar conversation ${log.conversation_id}:`, convError);
        continue;
      }
      
      if (conversation?.audio_url) {
        console.log(`🎵 Áudio encontrado: ${conversation.audio_url}`);
        
        // Verificar se o arquivo existe no storage
        const { data: fileData, error: fileError } = await supabase.storage
          .from('audio')
          .list('', {
            search: conversation.audio_url.replace('audio/', '')
          });
        
        if (fileError) {
          console.error(`❌ Erro ao verificar arquivo no storage:`, fileError);
        } else if (fileData && fileData.length > 0) {
          console.log(`✅ Arquivo existe no storage`);
          
          // Tentar obter URL pública
          const { data: publicUrl } = supabase.storage
            .from('audio')
            .getPublicUrl(conversation.audio_url.replace('audio/', ''));
          
          console.log(`🔗 URL pública: ${publicUrl.publicUrl}`);
        } else {
          console.log(`❌ Arquivo NÃO encontrado no storage`);
        }
      } else {
        console.log(`❌ Nenhum áudio associado`);
      }
    }
    
    // Verificar configuração do bucket
    console.log('\n🪣 Verificando configuração do bucket de áudio...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Erro ao listar buckets:', bucketError);
    } else {
      const audioBucket = buckets.find(b => b.name === 'audio');
      if (audioBucket) {
        console.log('✅ Bucket "audio" encontrado');
        console.log(`📊 Público: ${audioBucket.public}`);
      } else {
        console.log('❌ Bucket "audio" NÃO encontrado');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugAudioIssue();