const fs = require('fs');
const path = require('path');

// Função para carregar variáveis de ambiente do .env.local
function loadEnvVariables() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env.local não encontrado');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });

  return envVars;
}

async function cleanupPaymentConfig() {
  try {
    console.log('🔧 Iniciando limpeza da tabela payment_system_config...');
    
    // Carregar variáveis de ambiente
    const envVars = loadEnvVariables();
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variáveis de ambiente do Supabase não encontradas');
      process.exit(1);
    }

    // Importar Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 Verificando registros atuais...');
    
    // 1. Buscar todos os registros atuais
    const { data: currentRecords, error: fetchError } = await supabase
      .from('payment_system_config')
      .select('*')
      .order('updated_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Erro ao buscar registros:', fetchError);
      return;
    }

    console.log(`📋 Encontrados ${currentRecords.length} registros`);
    
    if (currentRecords.length === 0) {
      console.log('✅ Nenhum registro encontrado para limpar');
      return;
    }

    // 2. Manter apenas o registro mais recente
    const mostRecentRecord = currentRecords[0];
    console.log(`🎯 Mantendo registro mais recente: ${mostRecentRecord.id}`);
    console.log(`   - Criado em: ${mostRecentRecord.created_at}`);
    console.log(`   - Atualizado em: ${mostRecentRecord.updated_at}`);

    // 3. Deletar todos os outros registros
    if (currentRecords.length > 1) {
      const recordsToDelete = currentRecords.slice(1).map(r => r.id);
      console.log(`🗑️  Deletando ${recordsToDelete.length} registros duplicados...`);
      
      const { error: deleteError } = await supabase
        .from('payment_system_config')
        .delete()
        .in('id', recordsToDelete);

      if (deleteError) {
        console.error('❌ Erro ao deletar registros duplicados:', deleteError);
        return;
      }
      
      console.log('✅ Registros duplicados removidos com sucesso');
    }

    // 4. Corrigir tipos de dados do registro restante
    console.log('🔧 Corrigindo tipos de dados...');
    
    const correctedData = {
      abacate_pay_enabled: mostRecentRecord.abacate_pay_enabled === 'true' || mostRecentRecord.abacate_pay_enabled === true,
      mercado_pago_enabled: mostRecentRecord.mercado_pago_enabled === 'true' || mostRecentRecord.mercado_pago_enabled === true,
      allow_system_switch: mostRecentRecord.allow_system_switch === 'true' || mostRecentRecord.allow_system_switch === true,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('payment_system_config')
      .update(correctedData)
      .eq('id', mostRecentRecord.id);

    if (updateError) {
      console.error('❌ Erro ao corrigir tipos de dados:', updateError);
      return;
    }

    console.log('✅ Tipos de dados corrigidos com sucesso');

    // 5. Verificar resultado final
    const { data: finalRecord, error: finalError } = await supabase
      .from('payment_system_config')
      .select('*')
      .single();

    if (finalError) {
      console.error('❌ Erro ao verificar resultado final:', finalError);
      return;
    }

    console.log('🎉 Limpeza concluída com sucesso!');
    console.log('📊 Configuração final:');
    console.log(`   - ID: ${finalRecord.id}`);
    console.log(`   - Sistema ativo: ${finalRecord.active_system}`);
    console.log(`   - Abacate Pay habilitado: ${finalRecord.abacate_pay_enabled} (${typeof finalRecord.abacate_pay_enabled})`);
    console.log(`   - Mercado Pago habilitado: ${finalRecord.mercado_pago_enabled} (${typeof finalRecord.mercado_pago_enabled})`);
    console.log(`   - Permitir alternar sistema: ${finalRecord.allow_system_switch} (${typeof finalRecord.allow_system_switch})`);

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar limpeza
cleanupPaymentConfig();