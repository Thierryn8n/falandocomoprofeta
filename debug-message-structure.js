const { createClient } = require('@supabase/supabase-js')

// Usar as credenciais diretamente
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugMessageStructure() {
  console.log('🔍 Verificando estrutura das mensagens...\n')
  
  try {
    // Buscar uma conversa recente
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (convError) {
      console.error('❌ Erro ao buscar conversas:', convError)
      return
    }
    
    if (conversations && conversations.length > 0) {
      const conversation = conversations[0]
      console.log('📋 Conversa encontrada:')
      console.log('   ID:', conversation.id)
      console.log('   Título:', conversation.title)
      console.log('   Audio URL:', conversation.audio_url || 'Nenhum')
      console.log('   Mensagens:', conversation.messages ? conversation.messages.length : 0)
      
      if (conversation.messages && conversation.messages.length > 0) {
        console.log('\n📝 Estrutura das mensagens:')
        conversation.messages.forEach((msg, index) => {
          console.log(`   ${index + 1}. Role: ${msg.role}`)
          console.log(`      Content: ${msg.content.substring(0, 50)}...`)
          console.log(`      Timestamp: ${msg.timestamp}`)
          console.log(`      ID: ${msg.id || 'NENHUM ID!'}`)
          console.log(`      Audio URL: ${msg.audioUrl || 'Nenhum'}`)
          console.log('      ---')
        })
      }
    }
    
    // Verificar se há attachments órfãos
    console.log('\n🔍 Verificando attachments órfãos...')
    const { data: attachments, error: attachError } = await supabase
      .from('message_attachments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (attachError) {
      console.error('❌ Erro ao buscar attachments:', attachError)
    } else {
      console.log(`📎 Attachments encontrados: ${attachments.length}`)
      attachments.forEach((att, index) => {
        console.log(`   ${index + 1}. Message ID: ${att.message_id}`)
        console.log(`      File: ${att.file_name}`)
        console.log(`      Type: ${att.file_type}`)
        console.log(`      Size: ${att.file_size} bytes`)
        console.log(`      Path: ${att.storage_path}`)
        console.log('      ---')
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugMessageStructure()