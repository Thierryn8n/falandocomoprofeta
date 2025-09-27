const { createClient } = require('@supabase/supabase-js');

// Usar as credenciais reais do .env.local
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConversations() {
  console.log('🔍 Verificando conversações recentes...');
  
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('❌ Erro ao buscar conversações:', error);
      return;
    }
    
    console.log('📊 Conversações encontradas:', data.length);
    
    if (data.length === 0) {
      console.log('⚠️ Nenhuma conversação encontrada na tabela');
      return;
    }
    
    data.forEach((conv, i) => {
      console.log(`${i+1}. ID: ${conv.id}`);
      console.log(`   Título: ${conv.title}`);
      console.log(`   User ID: ${conv.user_id}`);
      console.log(`   Mensagens: ${conv.messages?.length || 0}`);
      console.log(`   Audio URL: ${conv.audio_url || 'Nenhum'}`);
      console.log(`   Criado: ${conv.created_at}`);
      console.log(`   Atualizado: ${conv.updated_at}`);
      
      // Mostrar as mensagens se existirem
      if (conv.messages && conv.messages.length > 0) {
        console.log('   📝 Mensagens:');
        conv.messages.forEach((msg, j) => {
          console.log(`      ${j+1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
          if (msg.audioUrl) {
            console.log(`         🎵 Audio URL: ${msg.audioUrl}`);
          }
        });
      }
      
      console.log('---');
    });
    
    // Verificar também a tabela message_attachments
    console.log('\n🔍 Verificando attachments...');
    const { data: attachments, error: attachError } = await supabase
      .from('message_attachments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (attachError) {
      console.error('❌ Erro ao buscar attachments:', attachError);
    } else {
      console.log('📎 Attachments encontrados:', attachments.length);
      attachments.forEach((att, i) => {
        console.log(`${i+1}. Message ID: ${att.message_id}`);
        console.log(`   Arquivo: ${att.file_name}`);
        console.log(`   Tipo: ${att.file_type}`);
        console.log(`   Tamanho: ${att.file_size} bytes`);
        console.log(`   Storage Path: ${att.storage_path}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkConversations();