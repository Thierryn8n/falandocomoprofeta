const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (usando as mesmas do .env.local)
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    // 1. Verificar tabela conversations
    console.log('\n📋 Verificando tabela conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(3);
    
    if (convError) {
      console.error('❌ Erro ao acessar tabela conversations:', convError);
    } else {
      console.log('✅ Tabela conversations acessível');
      console.log('📊 Registros encontrados:', conversations.length);
      if (conversations[0]) {
        console.log('📋 Campos disponíveis:', Object.keys(conversations[0]));
        console.log('🎵 Campo audio_url presente:', 'audio_url' in conversations[0] ? 'SIM' : 'NÃO');
      }
    }
    
    // 2. Verificar tabela message_attachments
    console.log('\n📎 Verificando tabela message_attachments...');
    const { data: attachments, error: attachError } = await supabase
      .from('message_attachments')
      .select('*')
      .limit(3);
    
    if (attachError) {
      console.error('❌ Erro ao acessar tabela message_attachments:', attachError);
    } else {
      console.log('✅ Tabela message_attachments acessível');
      console.log('📊 Attachments encontrados:', attachments.length);
      if (attachments[0]) {
        console.log('📋 Campos disponíveis:', Object.keys(attachments[0]));
      }
    }
    
    // 3. Verificar bucket attachments
    console.log('\n🪣 Verificando bucket attachments...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Erro ao listar buckets:', bucketError);
    } else {
      console.log('✅ Buckets disponíveis:', buckets.map(b => b.name));
      const attachmentsBucket = buckets.find(b => b.name === 'attachments');
      if (attachmentsBucket) {
        console.log('🎯 Bucket attachments encontrado:', attachmentsBucket);
      } else {
        console.log('❌ Bucket attachments não encontrado');
      }
    }
    
    // 4. Testar upload de arquivo de teste
    console.log('\n🧪 Testando upload de arquivo...');
    const testData = new Uint8Array([1, 2, 3, 4, 5]); // Dados de teste
    const testFileName = `test_${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(`test/${testFileName}`, testData, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('❌ Erro no upload de teste:', uploadError);
    } else {
      console.log('✅ Upload de teste bem-sucedido:', uploadData.path);
      
      // Limpar arquivo de teste
      await supabase.storage
        .from('attachments')
        .remove([`test/${testFileName}`]);
      console.log('🧹 Arquivo de teste removido');
    }
    
    console.log('\n🎉 Teste de conexão concluído!');
    
  } catch (err) {
    console.error('💥 Erro geral no teste:', err);
  }
}

testDatabaseConnection();