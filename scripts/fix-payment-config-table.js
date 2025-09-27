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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPaymentConfigTable() {
  try {
    console.log('🔧 Tentando corrigir a tabela payment_system_config...');
    
    // Primeiro, vamos tentar uma abordagem diferente
    // Vamos criar uma nova linha com todos os campos necessários
    console.log('📝 Tentando inserir dados com allow_system_switch...');
    
    const testData = {
      active_system: 'abacate_pay',
      abacate_pay_enabled: true,
      mercado_pago_enabled: false,
      allow_system_switch: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('payment_system_config')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.error('❌ Erro ao inserir dados de teste:', insertError);
      
      // Se não conseguir inserir, vamos tentar sem a coluna allow_system_switch
      console.log('🔄 Tentando sem allow_system_switch...');
      
      const simpleData = {
        active_system: 'abacate_pay',
        abacate_pay_enabled: true,
        mercado_pago_enabled: false
      };
      
      const { data: simpleInsert, error: simpleError } = await supabase
        .from('payment_system_config')
        .insert(simpleData)
        .select();
      
      if (simpleError) {
        console.error('❌ Erro ao inserir dados simples:', simpleError);
      } else {
        console.log('✅ Dados simples inseridos com sucesso:', simpleInsert);
        
        // Agora vamos tentar fazer update para adicionar allow_system_switch
        if (simpleInsert && simpleInsert.length > 0) {
          const recordId = simpleInsert[0].id;
          
          console.log('🔄 Tentando adicionar allow_system_switch via update...');
          const { data: updateData, error: updateError } = await supabase
            .from('payment_system_config')
            .update({ allow_system_switch: true })
            .eq('id', recordId)
            .select();
          
          if (updateError) {
            console.error('❌ Erro no update:', updateError);
            console.log('📋 A coluna allow_system_switch realmente não existe na tabela.');
          } else {
            console.log('✅ Update realizado com sucesso:', updateData);
          }
        }
      }
    } else {
      console.log('✅ Dados inseridos com sucesso (coluna já existe):', insertData);
    }
    
    // Verificar estrutura atual da tabela
    console.log('📋 Verificando estrutura atual da tabela...');
    const { data: currentData, error: currentError } = await supabase
      .from('payment_system_config')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('❌ Erro ao consultar tabela:', currentError);
    } else if (currentData && currentData.length > 0) {
      console.log('📊 Colunas disponíveis:', Object.keys(currentData[0]));
      console.log('📄 Dados atuais:', currentData[0]);
    }
    
    // Tentar uma abordagem usando SQL raw se possível
    console.log('🔧 Tentando executar SQL diretamente...');
    
    try {
      // Tentar diferentes formas de executar SQL
      const sqlCommands = [
        'SELECT column_name FROM information_schema.columns WHERE table_name = \'payment_system_config\'',
        'SHOW COLUMNS FROM payment_system_config',
        'DESCRIBE payment_system_config'
      ];
      
      for (const sql of sqlCommands) {
        try {
          const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });
          if (!sqlError) {
            console.log(`✅ SQL executado com sucesso (${sql}):`, sqlData);
            break;
          }
        } catch (e) {
          // Continuar tentando
        }
      }
    } catch (e) {
      console.log('⚠️ Não foi possível executar SQL diretamente');
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

fixPaymentConfigTable();