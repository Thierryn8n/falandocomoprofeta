const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

// Inicializar cliente Supabase com service key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function recreateAttachmentsBucket() {
  console.log('🚀 Iniciando recriação do bucket attachments...');
  
  try {
    // Primeiro, tentar deletar o bucket se existir
    console.log('🗑️ Tentando deletar bucket existente...');
    const { error: deleteError } = await supabase.storage.deleteBucket('attachments');
    
    if (deleteError) {
      console.log('⚠️ Erro ao deletar bucket (pode não existir):', deleteError.message);
    } else {
      console.log('✅ Bucket deletado com sucesso!');
    }

    // Aguardar um pouco para garantir que a operação foi processada
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Criar o novo bucket com configurações corretas
    console.log('📦 Criando novo bucket attachments...');
    const { data: bucketData, error: createError } = await supabase.storage.createBucket('attachments', {
      public: true,
      allowedMimeTypes: [
        'image/*',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'audio/*',
        'audio/webm',
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/ogg',
        'audio/m4a',
        'audio/aac'
      ],
      fileSizeLimit: 10485760 // 10MB em bytes
    });

    if (createError) {
      console.error('❌ Erro ao criar bucket:', createError);
      return false;
    }

    console.log('✅ Bucket attachments criado com sucesso!');
    console.log('📋 Dados do bucket:', bucketData);

    // Verificar as configurações do bucket
    console.log('🔍 Verificando configurações do bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return false;
    }

    const attachmentsBucket = buckets.find(bucket => bucket.name === 'attachments');
    if (attachmentsBucket) {
      console.log('✅ Configurações do bucket attachments:');
      console.log('   - Nome:', attachmentsBucket.name);
      console.log('   - Público:', attachmentsBucket.public);
      console.log('   - Tipos MIME permitidos:', attachmentsBucket.allowed_mime_types);
      console.log('   - Limite de tamanho:', attachmentsBucket.file_size_limit, 'bytes');
    }

    // Testar upload de um arquivo de áudio fictício
    console.log('🎵 Testando upload de áudio...');
    const testAudioData = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45
    ]); // Header básico de arquivo WAV

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload('audio/test-audio.wav', testAudioData, {
        contentType: 'audio/wav',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError);
      return false;
    }

    console.log('✅ Teste de upload de áudio bem-sucedido!');
    console.log('📁 Arquivo carregado:', uploadData.path);

    // Limpar arquivo de teste
    const { error: deleteFileError } = await supabase.storage
      .from('attachments')
      .remove(['audio/test-audio.wav']);

    if (deleteFileError) {
      console.log('⚠️ Aviso: Não foi possível deletar arquivo de teste:', deleteFileError.message);
    } else {
      console.log('🧹 Arquivo de teste removido com sucesso!');
    }

    console.log('🎉 Bucket attachments recriado com sucesso e testado!');
    console.log('📝 Tipos MIME suportados:');
    console.log('   - Imagens: image/*, image/jpeg, image/png, image/gif, image/webp, image/svg+xml');
    console.log('   - Áudios: audio/*, audio/webm, audio/wav, audio/mp3, audio/mpeg, audio/ogg, audio/m4a, audio/aac');
    console.log('   - Limite de tamanho: 10MB');

    return true;

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
    return false;
  }
}

// Executar a função
recreateAttachmentsBucket()
  .then(success => {
    if (success) {
      console.log('✅ Processo concluído com sucesso!');
      process.exit(0);
    } else {
      console.log('❌ Processo falhou!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });