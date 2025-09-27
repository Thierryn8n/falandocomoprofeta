const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTQxNTUsImV4cCI6MjA2ODYzMDE1NX0.cbPMldu0By33z3ntjC7jKQA08S6LcNHQseHR7-QYLmc';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTable() {
  console.log('🔍 Verificando estrutura da tabela message_attachments...\n');

  try {
    // 1. Verificar se a tabela existe e suas colunas
    console.log('1. Verificando estrutura da tabela...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('message_attachments')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error('❌ Erro ao acessar tabela:', tableError);
      return;
    }
    console.log('✅ Tabela acessível');

    // 2. Tentar inserir dados de teste
    console.log('\n2. Testando inserção de dados...');
    const testData = {
      id: crypto.randomUUID(),
      message_id: crypto.randomUUID(),
      file_name: 'test-audio.webm',
      file_type: 'audio/webm',
      file_size: 1024,
      storage_path: 'test-storage-path', // Corrigido: usar storage_path em vez de file_url
      created_at: new Date().toISOString()
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

    // 3. Verificar permissões RLS
    console.log('\n3. Verificando permissões RLS...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('message_attachments')
      .select('count')
      .limit(1);

    if (rlsError) {
      console.error('❌ Possível problema com RLS:', rlsError);
    } else {
      console.log('✅ Permissões RLS parecem OK');
    }

    // 4. Verificar se existem registros na tabela
    console.log('\n4. Verificando registros existentes...');
    const { data: existingData, error: selectError } = await supabase
      .from('message_attachments')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('❌ Erro ao buscar registros:', selectError);
    } else {
      console.log(`📊 Encontrados ${existingData.length} registros na tabela`);
      if (existingData.length > 0) {
        console.log('Exemplo de registro:', existingData[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugTable();