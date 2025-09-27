const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

// Função para classificar mensagem usando IA (similar ao heresy-detector.ts)
async function classifyMessageWithAI(message, geminiApiKey) {
  const classificationPrompt = `Analise esta mensagem e classifique em uma das categorias:

MENSAGEM: "${message}"

CATEGORIAS:
1. "heresy_doctrinal" - Heresias doutrinárias graves contra ensinamentos cristãos
2. "heresy_blasphemy" - Blasfêmias contra Deus, Jesus ou Espírito Santo
3. "heresy_false_teaching" - Falsos ensinamentos ou distorções bíblicas
4. "inappropriate_content" - Conteúdo inadequado, ofensivo ou imoral
5. "sincere_question" - Perguntas sinceras sobre fé e doutrina
6. "appropriate_content" - Conteúdo apropriado e edificante
7. "greeting_casual" - Cumprimentos normais e conversas casuais apropriadas

INSTRUÇÕES:
- Seja rigoroso com heresias doutrinárias
- Identifique blasfêmias e ofensas
- Permita perguntas sinceras sobre fé
- Permita cumprimentos e conversas casuais apropriadas
- Considere o contexto religioso

RESPONDA APENAS com:
CLASSIFICAÇÃO: [categoria]
CONFIANÇA: [0-100]
RAZÃO: [breve explicação]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: classificationPrompt }] }],
          generationConfig: {
            temperature: 0.1,
            topK: 5,
            topP: 0.8,
            maxOutputTokens: 200,
          },
        }),
      },
    );

    if (!response.ok) {
      console.error("❌ Erro na API Gemini:", response.status);
      return { classification: "api_error", confidence: 0, isHeresy: false };
    }

    const result = await response.json();
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse da resposta da IA
    const classificationMatch = aiResponse.match(/CLASSIFICAÇÃO:\s*([^\n]+)/i);
    const confidenceMatch = aiResponse.match(/CONFIANÇA:\s*(\d+)/i);
    const reasonMatch = aiResponse.match(/RAZÃO:\s*([^\n]+)/i);

    const classification = classificationMatch?.[1]?.trim() || "unknown";
    const confidence = parseInt(confidenceMatch?.[1] || "0");
    const reason = reasonMatch?.[1]?.trim() || "";

    const heresyCategories = ["heresy_doctrinal", "heresy_blasphemy", "heresy_false_teaching", "inappropriate_content"];
    const isHeresy = heresyCategories.includes(classification);

    return { classification, confidence, reason, isHeresy };
  } catch (error) {
    console.error("❌ Erro ao classificar com IA:", error);
    return { classification: "error", confidence: 0, isHeresy: false };
  }
}

async function processConversationsForHeresy() {
  try {
    console.log('🔍 Iniciando análise de conversations para detectar heresias...');
    
    // Buscar chave da API Gemini
    const { data: apiKeyData, error: apiError } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('provider', 'gemini')
      .eq('is_active', true)
      .single();
    
    if (apiError || !apiKeyData?.encrypted_key) {
      console.error('❌ Chave da API Gemini não encontrada:', apiError);
      return;
    }
    
    const geminiApiKey = apiKeyData.encrypted_key;
    console.log('✅ Chave da API Gemini carregada');
    
    // Buscar conversations que ainda não foram analisadas
    const { data: existingLogs } = await supabase
      .from('heresy_logs')
      .select('conversation_id')
      .not('conversation_id', 'is', null);
    
    const analyzedConversationIds = new Set(existingLogs?.map(log => log.conversation_id) || []);
    
    // Buscar todas as conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (convError) {
      console.error('❌ Erro ao buscar conversations:', convError);
      return;
    }
    
    console.log(`📊 Total de conversations: ${conversations.length}`);
    console.log(`📋 Já analisadas: ${analyzedConversationIds.size}`);
    
    const conversationsToAnalyze = conversations.filter(conv => !analyzedConversationIds.has(conv.id));
    console.log(`🆕 Para analisar: ${conversationsToAnalyze.length}`);
    
    let processedCount = 0;
    let heresiesFound = 0;
    
    for (const conversation of conversationsToAnalyze) {
      console.log(`\n🔍 Analisando conversation ${conversation.id}...`);
      
      // Extrair mensagem do usuário
      let userMessage = '';
      if (conversation.messages && Array.isArray(conversation.messages)) {
        const userMsg = conversation.messages.find(msg => msg.role === 'user');
        userMessage = userMsg?.content || '';
      }
      
      if (!userMessage.trim()) {
        console.log('⚠️ Nenhuma mensagem do usuário encontrada, pulando...');
        continue;
      }
      
      console.log(`📝 Mensagem: "${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}"`);
      
      // Classificar com IA
      const aiResult = await classifyMessageWithAI(userMessage, geminiApiKey);
      
      console.log(`🤖 Classificação: ${aiResult.classification} (${aiResult.confidence}%)`);
      console.log(`💭 Razão: ${aiResult.reason}`);
      
      if (aiResult.isHeresy && aiResult.confidence >= 70) {
        console.log('🚨 HERESIA DETECTADA! Criando log...');
        
        // Criar log de heresia
        const { data: newLog, error: logError } = await supabase
          .from('heresy_logs')
          .insert({
            user_id: conversation.user_id,
            conversation_id: conversation.id,
            user_message: userMessage,
            action_taken: 'ai_classified_heresy',
            ai_classification: `${aiResult.classification}: ${aiResult.reason}`,
            admin_id: conversation.user_id // Usando user_id como admin_id temporariamente
          })
          .select()
          .single();
        
        if (logError) {
          console.error('❌ Erro ao criar log de heresia:', logError);
        } else {
          console.log('✅ Log de heresia criado com ID:', newLog.id);
          heresiesFound++;
        }
      } else {
        console.log('✅ Mensagem classificada como apropriada');
      }
      
      processedCount++;
      
      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n🎉 Análise concluída!`);
    console.log(`📊 Conversations processadas: ${processedCount}`);
    console.log(`🚨 Heresias detectadas: ${heresiesFound}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

processConversationsForHeresy();