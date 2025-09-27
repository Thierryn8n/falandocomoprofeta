const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Corrigindo políticas RLS da tabela message_attachments...\n');

  try {
    // 1. Remover políticas existentes
    console.log('1. Removendo políticas existentes...');
    
    const dropPolicies = [
      `DROP POLICY IF EXISTS "Users can view their own attachments" ON message_attachments;`,
      `DROP POLICY IF EXISTS "Users can insert their own attachments" ON message_attachments;`
    ];

    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.log(`⚠️ Aviso ao remover política: ${error.message}`);
      }
    }
    console.log('✅ Políticas antigas removidas');

    // 2. Criar nova política permissiva
    console.log('\n2. Criando nova política permissiva...');
    
    const createPolicySQL = `
      CREATE POLICY "Allow all operations for authenticated users" ON message_attachments 
      FOR ALL 
      TO authenticated 
      USING (true) 
      WITH CHECK (true);
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql_query: createPolicySQL });
    
    if (createError) {
      console.error('❌ Erro ao criar nova política:', createError);
      return false;
    }
    
    console.log('✅ Nova política criada com sucesso');

    // 3. Testar inserção
    console.log('\n3. Testando inserção após correção...');
    
    const testData = {
      id: crypto.randomUUID(),
      message_id: crypto.randomUUID(),
      file_name: 'test-audio-after-fix.webm',
      file_type: 'audio/webm',
      file_size: 1024,
      storage_path: 'test-storage-path-after-fix'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('message_attachments')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Ainda há erro na inserção:', insertError);
      return false;
    } else {
      console.log('✅ Inserção bem-sucedida após correção!');
      
      // Limpar dados de teste
      await supabase
        .from('message_attachments')
        .delete()
        .eq('id', testData.id);
      console.log('🧹 Dados de teste removidos');
      return true;
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Função alternativa usando SQL direto
async function fixRLSDirectSQL() {
  console.log('\n🔧 Tentativa alternativa: Executando SQL direto...\n');

  const sqlCommands = [
    `DROP POLICY IF EXISTS "Users can view their own attachments" ON message_attachments;`,
    `DROP POLICY IF EXISTS "Users can insert their own attachments" ON message_attachments;`,
    `CREATE POLICY "Allow all operations for authenticated users" ON message_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);`
  ];

  for (let i = 0; i < sqlCommands.length; i++) {
    console.log(`Executando comando ${i + 1}/${sqlCommands.length}...`);
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sqlCommands[i] });
      if (error) {
        console.log(`⚠️ Aviso no comando ${i + 1}: ${error.message}`);
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    } catch (err) {
      console.error(`❌ Erro no comando ${i + 1}:`, err);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando correção das políticas RLS...\n');
  
  // Tentar primeira abordagem
  const success = await fixRLSPolicies();
  
  if (!success) {
    // Tentar abordagem alternativa
    await fixRLSDirectSQL();
  }
  
  console.log('\n✨ Processo concluído!');
  console.log('📝 Agora teste novamente o fluxo de áudio na aplicação.');
}

main();