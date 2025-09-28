// Usando fetch nativo do Node.js 18+

async function testChatAPI() {
  try {
    console.log('🧪 Testando API de chat...');
    
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'O que são os Sete Selos?'
          }
        ],
        conversationId: null,
        userId: null // Usando usuário anônimo
      })
    });

    if (!response.ok) {
      console.log(`❌ Erro na resposta: ${response.status} ${response.statusText}`);
      const errorData = await response.json();
      console.log('Detalhes do erro:', JSON.stringify(errorData));
      return;
    }

    const data = await response.json();
    console.log('✅ Resposta recebida com sucesso!');
    console.log('📝 Conteúdo da mensagem:');
    console.log(data.message || 'Sem conteúdo');
    console.log('');
    console.log('📚 Documentos utilizados:', data.documentsUsed || 0);
    console.log('📖 Títulos dos documentos:', data.documentsUsedTitles || []);
    console.log('🌐 Wikipedia utilizada:', data.wikipediaUsed || false);
    console.log('');
    
    // Verificar se a resposta contém referências
    console.log('🔍 Verificando se a resposta contém referências...');
    const hasReferences = data.message && (
      data.message.includes('Fontes utilizadas:') || 
      data.message.includes('Referências:') ||
      data.message.includes('Citações:')
    );
    
    console.log('📊 Contém fontes:', hasReferences ? '✅ SIM' : '❌ NÃO');
    
    if (!hasReferences && data.documentsUsed === 0) {
      console.log('');
      console.log('⚠️ PROBLEMA IDENTIFICADO: A resposta não contém referências!');
      console.log('💡 Isso confirma que o problema está na API de chat.');
      console.log('🔧 Possíveis causas:');
      console.log('   - Documentos não estão sendo encontrados na busca');
      console.log('   - Problema na integração com Gemini AI');
      console.log('   - Erro na formatação do prompt');
    } else if (data.documentsUsed > 0) {
      console.log('');
      console.log('✅ DOCUMENTOS ENCONTRADOS: A API está encontrando documentos relevantes');
      console.log('🔍 Verificando se as referências estão sendo incluídas na resposta...');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

testChatAPI();