const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envLines = envContent.split('\n');
const env = {};

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.log('KEY:', supabaseKey ? 'OK' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  try {
    console.log('🔧 Verificando estrutura atual da tabela...');
    
    // Primeiro, verificar a estrutura atual
    const { data: currentData, error: currentError } = await supabase
      .from('payment_system_config')
      .select('*')
      .limit(1);
      
    if (currentError) {
      console.error('❌ Erro ao consultar tabela:', currentError);
      return;
    }
    
    console.log('📋 Estrutura atual da tabela:');
    if (currentData && currentData.length > 0) {
      const columns = Object.keys(currentData[0]);
      console.log('Colunas existentes:', columns);
      
      if (columns.includes('allow_system_switch')) {
        console.log('✅ Coluna allow_system_switch já existe!');
        return;
      }
    }
    
    console.log('🔧 Adicionando coluna allow_system_switch...');
    
    // Tentar adicionar a coluna usando uma abordagem mais simples
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE payment_system_config 
        ADD COLUMN IF NOT EXISTS allow_system_switch BOOLEAN DEFAULT true;
      `
    });
    
    if (error) {
      console.error('❌ Erro ao adicionar coluna:', error);
      
      // Se exec_sql não funcionar, tentar uma abordagem diferente
      console.log('🔄 Tentando abordagem alternativa...');
      
      // Verificar se podemos fazer um update que force a criação da coluna
      const { data: updateData, error: updateError } = await supabase
        .from('payment_system_config')
        .update({ allow_system_switch: true })
        .eq('id', 'any-id');
        
      if (updateError) {
        console.error('❌ Coluna realmente não existe. Erro:', updateError.message);
        console.log('📝 Você precisa adicionar a coluna manualmente no Supabase Dashboard:');
        console.log('   1. Vá para o Supabase Dashboard');
        console.log('   2. Navegue até Database > Tables');
        console.log('   3. Encontre a tabela "payment_system_config"');
        console.log('   4. Adicione uma nova coluna:');
        console.log('      - Nome: allow_system_switch');
        console.log('      - Tipo: boolean');
        console.log('      - Valor padrão: true');
      } else {
        console.log('✅ Coluna adicionada com sucesso via update!');
      }
      
      return;
    }
    
    console.log('✅ Coluna adicionada com sucesso!');
    
    // Verificar novamente a estrutura
    const { data: newData, error: newError } = await supabase
      .from('payment_system_config')
      .select('*')
      .limit(1);
      
    if (!newError && newData && newData.length > 0) {
      console.log('📋 Nova estrutura da tabela:');
      console.log('Colunas:', Object.keys(newData[0]));
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

addColumn();