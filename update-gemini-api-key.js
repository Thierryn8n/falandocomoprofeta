const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const NEW_GEMINI_KEY = 'AIzaSyCvoSfwjmrkLZEhfQcgrtaTTAbuAL7opdc';

async function updateGeminiKey() {
  try {
    console.log('🔄 Atualizando chave da API do Google Gemini...');
    console.log('🔑 Nova chave:', NEW_GEMINI_KEY.substring(0, 15) + '...');
    
    // 1. Primeiro, desativar todas as chaves Gemini existentes
    console.log('📝 Desativando chaves Gemini existentes...');
    const { error: deactivateError } = await supabase
      .from('api_keys')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('provider', 'gemini');
    
    if (deactivateError) {
      console.log('⚠️ Erro ao desativar chaves existentes:', deactivateError.message);
    } else {
      console.log('✅ Chaves Gemini existentes desativadas');
    }
    
    // 2. Verificar se a nova chave já existe
    console.log('🔍 Verificando se a nova chave já existe...');
    const { data: existingKeys, error: searchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('provider', 'gemini')
      .eq('encrypted_key', NEW_GEMINI_KEY);
    
    if (searchError) {
      console.log('❌ Erro ao buscar chaves:', searchError.message);
      return;
    }
    
    if (existingKeys && existingKeys.length > 0) {
      // 3a. Ativar chave existente
      console.log('🔄 Chave já existe, ativando...');
      const { error: activateError } = await supabase
        .from('api_keys')
        .update({ 
          is_active: true, 
          updated_at: new Date().toISOString(),
          key_name: 'Google Gemini API Key - Paga (Atualizada)'
        })
        .eq('provider', 'gemini')
        .eq('encrypted_key', NEW_GEMINI_KEY);
      
      if (activateError) {
        console.log('❌ Erro ao ativar chave existente:', activateError.message);
      } else {
        console.log('✅ Chave Gemini existente ativada com sucesso!');
      }
    } else {
      // 3b. Inserir nova chave
      console.log('➕ Inserindo nova chave Gemini...');
      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          provider: 'gemini',
          key_name: 'Google Gemini API Key - Paga',
          encrypted_key: NEW_GEMINI_KEY,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.log('❌ Erro ao inserir nova chave:', insertError.message);
      } else {
        console.log('✅ Nova chave Gemini inserida e ativada com sucesso!');
      }
    }
    
    // 4. Verificar status final
    console.log('🔍 Verificando status final das chaves Gemini...');
    const { data: finalKeys, error: finalError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('provider', 'gemini')
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.log('❌ Erro ao verificar status final:', finalError.message);
    } else {
      console.log('📊 Status final das chaves Gemini:');
      finalKeys.forEach((key, index) => {
        const preview = key.encrypted_key.substring(0, 15) + '...';
        const status = key.is_active ? '🟢 ATIVA' : '🔴 INATIVA';
        console.log(`  ${index + 1}. ${key.key_name}: ${preview} - ${status}`);
      });
      
      const activeKeys = finalKeys.filter(k => k.is_active);
      console.log(`\n📈 Resumo: ${activeKeys.length} chave(s) ativa(s) de ${finalKeys.length} total`);
      
      if (activeKeys.length === 1 && activeKeys[0].encrypted_key === NEW_GEMINI_KEY) {
        console.log('🎉 SUCESSO! A nova chave Gemini está configurada e ativa!');
        console.log('💡 Agora você pode usar o Speech-to-Text e outras funcionalidades do Gemini!');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

updateGeminiKey();