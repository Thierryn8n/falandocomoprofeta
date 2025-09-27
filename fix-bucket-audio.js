const { createClient } = require('@supabase/supabase-js')

// Credenciais do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAttachmentsBucket() {
  try {
    console.log('🔧 Corrigindo bucket attachments para aceitar áudio...')
    
    // Método direto: usar a API de administração do Supabase
    console.log('🔄 Usando API de administração do Supabase...')
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        query: `
          UPDATE storage.buckets 
          SET allowed_mime_types = ARRAY['image/*', 'audio/*', 'audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg']
          WHERE id = 'attachments'
          RETURNING *;
        `
      })
    })
    
    if (!response.ok) {
      console.log('⚠️ Método direto não funcionou, tentando recriar o bucket...')
      
      // Tentar deletar e recriar o bucket com as configurações corretas
      try {
        const { error: deleteError } = await supabase.storage.deleteBucket('attachments')
        if (deleteError && !deleteError.message.includes('not found')) {
          console.log('⚠️ Erro ao deletar bucket (pode não existir):', deleteError.message)
        }
        
        // Criar bucket com configurações corretas
        const { data: createData, error: createError } = await supabase.storage.createBucket('attachments', {
          public: true,
          allowedMimeTypes: ['image/*', 'audio/*', 'audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg'],
          fileSizeLimit: 10485760 // 10MB
        })
        
        if (createError) {
          console.error('❌ Erro ao criar bucket:', createError)
        } else {
          console.log('✅ Bucket criado com sucesso!')
          console.log('📊 Dados:', createData)
        }
        
      } catch (bucketError) {
        console.error('❌ Erro ao recriar bucket:', bucketError)
      }
    } else {
      console.log('✅ Bucket atualizado com sucesso!')
    }
    
    // Verificar a configuração atual do bucket
    console.log('\n🔍 Verificando configuração atual do bucket...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError)
      return
    }
    
    const attachmentsBucket = buckets.find(b => b.name === 'attachments')
    if (attachmentsBucket) {
      console.log('📁 Configuração do bucket attachments:')
      console.log('  - Nome:', attachmentsBucket.name)
      console.log('  - Público:', attachmentsBucket.public)
      console.log('  - Limite de tamanho:', attachmentsBucket.file_size_limit)
      console.log('  - Tipos MIME permitidos:', attachmentsBucket.allowed_mime_types)
    } else {
      console.error('❌ Bucket attachments não encontrado!')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

fixAttachmentsBucket()