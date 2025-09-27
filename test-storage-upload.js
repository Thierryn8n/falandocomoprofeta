const { createClient } = require('@supabase/supabase-js')

// Definir as variáveis manualmente para teste
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Definida' : '❌ Não definida')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testStorageUpload() {
  try {
    console.log('🔍 Testando upload no Supabase Storage...')
    
    // 1. Listar buckets disponíveis
    console.log('\n📁 Verificando buckets disponíveis...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError)
      return
    }
    
    console.log('✅ Buckets encontrados:')
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`)
    })
    
    // 2. Verificar se o bucket 'attachments' existe
    const attachmentsBucket = buckets.find(b => b.name === 'attachments')
    if (!attachmentsBucket) {
      console.error('❌ Bucket "attachments" não encontrado!')
      return
    }
    
    console.log('✅ Bucket "attachments" encontrado!')
    
    // 3. Tentar fazer upload de um arquivo de áudio de teste
    console.log('\n📤 Testando upload de arquivo de áudio...')
    
    // Criar um buffer simulando um arquivo de áudio WebM
    const testAudioContent = Buffer.from('WEBM_FAKE_AUDIO_DATA_FOR_TESTING', 'utf-8')
    const fileName = `audio_${Date.now()}_test.webm`
    const filePath = `audio/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, testAudioContent, {
        contentType: 'audio/webm',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError)
      return
    }
    
    console.log('✅ Upload realizado com sucesso!')
    console.log('📄 Dados do upload:', uploadData)
    
    // 4. Verificar se o arquivo foi salvo
    console.log('\n🔍 Verificando se o arquivo foi salvo...')
    const { data: files, error: listError } = await supabase.storage
      .from('attachments')
      .list('audio')
    
    if (listError) {
      console.error('❌ Erro ao listar arquivos:', listError)
      return
    }
    
    console.log('📁 Arquivos na pasta audio:')
    files.forEach(file => {
      console.log(`  - ${file.name} (${file.metadata?.size || 'tamanho desconhecido'} bytes)`)
    })
    
    // 5. Tentar obter URL pública do arquivo
    console.log('\n🔗 Obtendo URL pública...')
    const { data: publicUrlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath)
    
    console.log('🌐 URL pública:', publicUrlData.publicUrl)
    
    // 6. Limpar arquivo de teste
    console.log('\n🧹 Limpando arquivo de teste...')
    const { error: deleteError } = await supabase.storage
      .from('attachments')
      .remove([filePath])
    
    if (deleteError) {
      console.error('⚠️ Erro ao deletar arquivo de teste:', deleteError)
    } else {
      console.log('✅ Arquivo de teste removido com sucesso!')
    }
    
    console.log('\n🎉 Teste de storage concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

testStorageUpload()