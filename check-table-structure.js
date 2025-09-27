const { createClient } = require('@supabase/supabase-js')

// Usar as credenciais diretamente
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura da tabela message_attachments...\n')
  
  try {
    // Verificar se a tabela existe e sua estrutura
    const { data, error } = await supabase
      .from('message_attachments')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar tabela message_attachments:', error)
      
      // Tentar verificar se a tabela existe
      console.log('\n🔍 Verificando se a tabela existe...')
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'message_attachments')
      
      if (tablesError) {
        console.error('❌ Erro ao verificar existência da tabela:', tablesError)
      } else if (tables && tables.length === 0) {
        console.log('❌ Tabela message_attachments NÃO EXISTE!')
        console.log('📝 Precisamos criar a tabela message_attachments')
      } else {
        console.log('✅ Tabela message_attachments existe')
      }
      
      return
    }
    
    console.log('✅ Tabela message_attachments acessível')
    console.log('📊 Dados de exemplo:', data)
    
    // Tentar fazer uma inserção de teste para ver quais colunas são necessárias
    console.log('\n🧪 Testando inserção para identificar colunas necessárias...')
    
    const testData = {
      message_id: 'test-message-id-' + Date.now(),
      file_name: 'test-audio.wav',
      file_type: 'audio/wav',
      file_size: 12345,
      storage_path: 'attachments/test-audio.wav'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('message_attachments')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.error('❌ Erro na inserção de teste:', insertError)
      console.log('📝 Detalhes do erro:', insertError.details)
      console.log('📝 Mensagem:', insertError.message)
      console.log('📝 Código:', insertError.code)
    } else {
      console.log('✅ Inserção de teste bem-sucedida!')
      console.log('📊 Dados inseridos:', insertData)
      
      // Limpar dados de teste
      await supabase
        .from('message_attachments')
        .delete()
        .eq('message_id', testData.message_id)
      
      console.log('🧹 Dados de teste removidos')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkTableStructure()