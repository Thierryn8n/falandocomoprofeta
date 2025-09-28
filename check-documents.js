const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

async function checkDocuments() {
  try {
    console.log('🔍 Verificando documentos na base de dados...');
    
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, type, status, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar documentos:', error);
      return;
    }
    
    console.log('📊 Total de documentos encontrados:', documents?.length || 0);
    
    if (documents && documents.length > 0) {
      console.log('📋 Lista de documentos:');
      documents.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.title} (${doc.type}) - Status: ${doc.status}`);
      });
    } else {
      console.log('📭 Nenhum documento encontrado na base de dados!');
      console.log('💡 Isso explica por que o profeta não está mostrando referências.');
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkDocuments();