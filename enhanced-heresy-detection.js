const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://wlwwgnimfuvoxjecdnza.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE'
);

// Palavras-chave expandidas para detecção de heresia
const ENHANCED_HERESY_KEYWORDS = {
  blasphemy: [
    // Blasfêmias diretas
    'deus é mentiroso', 'jesus é falso', 'espírito santo não existe',
    'bíblia é mentira', 'cristo é demônio', 'deus não existe',
    'jesus não ressuscitou', 'deus é mau', 'cristo é satanás',
    'deus é idiota', 'jesus é burro', 'cristo é falso profeta',
    'bíblia é lixo', 'deus é fraco', 'jesus falhou',
    
    // Variações e formas indiretas
    'deus mente', 'jesus engana', 'cristo é mentiroso',
    'bíblia falsa', 'deus falso', 'jesus fake',
    'deus inexistente', 'cristo inexistente'
  ],
  
  doctrinal_heresy: [
    // Heresias sobre salvação
    'salvação por obras', 'salvação pelas obras', 'obras salvam',
    'batismo salva', 'sacramento salva', 'igreja salva',
    'papa salva', 'santos salvam', 'maria salva',
    
    // Heresias sobre a trindade
    'trindade é falsa', 'trindade não existe', 'jesus não é deus',
    'espírito santo não é deus', 'três deuses', 'modalismo',
    'arianismo', 'unitarismo', 'jesus é criado',
    
    // Heresias marianas
    'maria é deusa', 'maria é divina', 'maria co-redentora',
    'maria medianeira', 'orar para maria', 'adorar maria',
    
    // Heresias papais
    'papa é deus', 'papa infalível', 'papa é cristo',
    'papa é mediador', 'obedecer papa', 'papa salva',
    
    // Outras heresias doutrinárias
    'reencarnação cristã', 'múltiplos deuses', 'panteísmo',
    'universalismo', 'todos se salvam', 'inferno não existe',
    'purgatório existe', 'limbo existe'
  ],
  
  false_teaching: [
    // Teologia da prosperidade
    'deus quer te enriquecer', 'fé gera riqueza', 'dizimar enriquece',
    'oferta traz bênção', 'semente financeira', 'determinar bênção',
    'confessar prosperidade', 'decretar riqueza',
    
    // Falsos ensinamentos sobre fé
    'fé move montanhas literalmente', 'nunca ficar doente',
    'cristão não sofre', 'fé cura tudo', 'pensamento positivo',
    'lei da atração cristã', 'visualizar bênçãos',
    
    // Gnosticismo moderno
    'conhecimento secreto', 'revelação especial', 'código bíblico',
    'numerologia bíblica', 'cabala cristã',
    
    // Determinismo extremo
    'deus predestinou tudo', 'livre arbítrio não existe',
    'deus causa o mal', 'calvinismo extremo'
  ],
  
  inappropriate: [
    // Conteúdo sexual explícito
    'sexo explícito', 'pornografia', 'masturbação', 'orgasmo',
    'sexo anal', 'sexo oral', 'fetiche', 'bdsm',
    
    // Drogas e vícios
    'usar drogas', 'maconha', 'cocaína', 'crack', 'heroína',
    'lsd', 'ecstasy', 'beber muito', 'embriagar',
    
    // Violência
    'matar alguém', 'violência física', 'espancar', 'torturar',
    'suicídio', 'se matar', 'morte violenta',
    
    // Ódio e discriminação
    'ódio racial', 'racismo', 'homofobia extrema', 'misoginia',
    'antissemitismo', 'xenofobia'
  ],
  
  occultism: [
    // Ocultismo e esoterismo
    'magia negra', 'bruxaria', 'feitiçaria', 'macumba',
    'umbanda', 'candomblé', 'espiritismo', 'mediunidade',
    'tarot', 'astrologia', 'horóscopo', 'numerologia',
    'cristais mágicos', 'energia cósmica', 'chakras',
    'reiki', 'new age', 'gnose', 'teosofia'
  ],
  
  anti_christian: [
    // Ataques ao cristianismo
    'cristianismo é falso', 'igreja é mentira', 'pastores enganam',
    'religião é ópio', 'fé é ilusão', 'deus é invenção',
    'bíblia é mito', 'jesus é lenda', 'cristianismo é seita'
  ]
};

// Função melhorada para detectar heresia por palavras-chave
function detectHeresyByKeywords(message) {
  const lowerMessage = message.toLowerCase();
  
  // Normalizar texto (remover acentos, pontuação extra)
  const normalizedMessage = lowerMessage
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove pontuação
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
  
  for (const [category, keywords] of Object.entries(ENHANCED_HERESY_KEYWORDS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = keyword
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Busca exata
      if (normalizedMessage.includes(normalizedKeyword)) {
        return {
          isHeresy: true,
          category: category,
          keyword: keyword,
          confidence: 90,
          matchType: 'exact'
        };
      }
      
      // Busca por palavras individuais (para frases)
      const keywordWords = normalizedKeyword.split(' ');
      const messageWords = normalizedMessage.split(' ');
      
      if (keywordWords.length > 1) {
        let matchCount = 0;
        for (const kw of keywordWords) {
          if (messageWords.some(mw => mw.includes(kw) || kw.includes(mw))) {
            matchCount++;
          }
        }
        
        // Se encontrou pelo menos 70% das palavras-chave
        if (matchCount / keywordWords.length >= 0.7) {
          return {
            isHeresy: true,
            category: category,
            keyword: keyword,
            confidence: Math.round(60 + (matchCount / keywordWords.length) * 30),
            matchType: 'partial'
          };
        }
      }
    }
  }
  
  return { isHeresy: false, category: 'appropriate', confidence: 95 };
}

// Função para análise contextual adicional
function contextualAnalysis(message) {
  const lowerMessage = message.toLowerCase();
  
  // Padrões suspeitos
  const suspiciousPatterns = [
    /deus\s+(não|nao)\s+(existe|é|eh)/,
    /jesus\s+(não|nao)\s+(é|eh|ressuscitou)/,
    /bíblia\s+(é|eh)\s+(falsa|mentira|mito)/,
    /igreja\s+(é|eh)\s+(falsa|mentira|enganação)/,
    /salvação\s+por\s+obras/,
    /maria\s+(é|eh)\s+(deusa|divina)/,
    /papa\s+(é|eh)\s+(deus|infalível)/
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        isHeresy: true,
        category: 'pattern_detected',
        reason: 'Padrão herético detectado por regex',
        confidence: 85
      };
    }
  }
  
  return { isHeresy: false };
}

async function enhancedHeresyDetection() {
  try {
    console.log('🔍 Iniciando detecção aprimorada de heresias...');
    
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
    
    // Buscar logs existentes
    const { data: existingLogs } = await supabase
      .from('heresy_logs')
      .select('conversation_id')
      .not('conversation_id', 'is', null);
    
    const analyzedConversationIds = new Set(existingLogs?.map(log => log.conversation_id) || []);
    
    let processedCount = 0;
    let heresiesFound = 0;
    let newHeresiesFound = 0;
    
    for (const conversation of conversations) {
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
      
      // Análise por palavras-chave aprimorada
      const keywordResult = detectHeresyByKeywords(userMessage);
      
      // Análise contextual adicional
      const contextResult = contextualAnalysis(userMessage);
      
      // Determinar resultado final
      let finalResult = keywordResult;
      if (!keywordResult.isHeresy && contextResult.isHeresy) {
        finalResult = contextResult;
      }
      
      console.log(`🤖 Resultado: ${finalResult.isHeresy ? 'HERESIA' : 'APROPRIADO'} (${finalResult.confidence || 0}%)`);
      
      if (finalResult.isHeresy) {
        heresiesFound++;
        
        // Verificar se já existe log para esta conversation
        if (!analyzedConversationIds.has(conversation.id)) {
          console.log('🚨 NOVA HERESIA DETECTADA! Criando log...');
          
          const { data: newLog, error: logError } = await supabase
            .from('heresy_logs')
            .insert({
              user_id: conversation.user_id,
              conversation_id: conversation.id,
              user_message: userMessage,
              action_taken: 'enhanced_keyword_detection',
              ai_classification: `${finalResult.category}: ${finalResult.keyword || finalResult.reason} (${finalResult.matchType || 'pattern'})`,
              admin_id: conversation.user_id
            })
            .select()
            .single();
          
          if (logError) {
            console.error('❌ Erro ao criar log:', logError);
          } else {
            console.log('✅ Log criado com ID:', newLog.id);
            newHeresiesFound++;
          }
        } else {
          console.log('📋 Heresia já registrada anteriormente');
        }
      } else {
        console.log('✅ Mensagem classificada como apropriada');
      }
      
      processedCount++;
      
      // Pausa pequena
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 Análise aprimorada concluída!`);
    console.log(`📊 Conversations processadas: ${processedCount}`);
    console.log(`🚨 Total de heresias encontradas: ${heresiesFound}`);
    console.log(`🆕 Novas heresias detectadas: ${newHeresiesFound}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

enhancedHeresyDetection();