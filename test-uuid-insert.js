const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

// Usar as credenciais diretamente
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUUIDInsert() {
  console.log('🧪 Testando inserção com UUID válido...\n')
  
  try {
    // Gerar UUID válido
    const validUUID = randomUUID()
    console.log('🆔 UUID gerado:', validUUID)
    
    const testData = {
      message_id: validUUID,
      file_name: 'test-audio.wav',
      file_type: 'audio/wav',
      file_size: 12345,
      storage_path: 'attachments/test-audio.wav'
    }
    
    console.log('📊 Dados para inserção:', testData)
    
    const { data: insertData, error: insertError } = await supabase
      .from('message_attachments')
      .insert(testData)
      .select()
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError)
      console.log('📝 Detalhes do erro:', insertError.details)
      console.log('📝 Mensagem:', insertError.message)
      console.log('📝 Código:', insertError.code)
    } else {
      console.log('✅ Inserção bem-sucedida!')
      console.log('📊 Dados inseridos:', insertData)
      
      // Verificar se foi inserido
      const { data: checkData, error: checkError } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', validUUID)
      
      if (checkError) {
        console.error('❌ Erro ao verificar inserção:', checkError)
      } else {
        console.log('✅ Verificação: dados encontrados na tabela')
        console.log('📊 Dados verificados:', checkData)
      }
      
      // Limpar dados de teste
      const { error: deleteError } = await supabase
        .from('message_attachments')
        .delete()
        .eq('message_id', validUUID)
      
      if (deleteError) {
        console.error('❌ Erro ao limpar dados de teste:', deleteError)
      } else {
        console.log('🧹 Dados de teste removidos com sucesso')
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testUUIDInsert()