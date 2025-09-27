// Biblioteca de filtragem de heresia para transcrições de áudio
// Baseada no sistema de detecção aprimorado

interface HeresyDetectionResult {
  isHeresy: boolean;
  category: string;
  keyword?: string;
  confidence: number;
  reason: string;
}

// Palavras-chave expandidas para detecção de heresia
const HERESY_KEYWORDS = {
  blasphemy: [
    'jesus não é deus', 'jesus é mentira', 'deus não existe', 'deus é falso',
    'espírito santo é falso', 'bíblia é mentira', 'bíblia é falsa',
    'cristo é mentira', 'cristianismo é falso', 'religião é mentira',
    'profeta branham é falso', 'branham mentiu', 'branham enganou'
  ],
  
  doctrinal_heresy: [
    // Salvação por obras
    'salvação por obras', 'obras salvam', 'preciso fazer obras para ser salvo',
    'batismo salva', 'igreja salva', 'sacramento salva', 'penitência salva',
    
    // Trindade (contra a doutrina unicista)
    'três deuses', 'três pessoas em deus', 'pai filho e espírito santo são diferentes',
    'trindade é verdade', 'jesus não é o pai',
    
    // Heresias marianas
    'maria é deusa', 'maria salva', 'orar para maria', 'maria intercessora',
    'maria mãe de deus', 'imaculada conceição', 'assunção de maria',
    
    // Heresias papais
    'papa é infalível', 'papa é vigário de cristo', 'papa salva',
    'igreja católica é a única verdadeira', 'tradição igual à bíblia'
  ],
  
  false_teaching: [
    // Teologia da prosperidade
    'deus quer te enriquecer', 'fé para ficar rico', 'dízimo traz riqueza',
    'determine e confesse riqueza', 'jesus era rico',
    
    // Gnosticismo
    'conhecimento secreto salva', 'iluminação espiritual', 'despertar da consciência',
    'verdade oculta', 'sabedoria esotérica',
    
    // Determinismo/Predestinação extrema
    'deus escolheu quem vai se salvar', 'alguns nasceram para o inferno',
    'não adianta evangelizar', 'livre arbítrio não existe'
  ],
  
  inappropriate_content: [
    // Sexual
    'sexo', 'pornografia', 'masturbação', 'prostituição', 'adultério',
    'fornicação', 'homossexualismo', 'lesbianismo', 'transexual',
    
    // Drogas
    'maconha', 'cocaína', 'crack', 'heroína', 'drogas', 'entorpecentes',
    'álcool', 'bebida alcoólica', 'embriaguez',
    
    // Violência
    'matar', 'assassinar', 'violência', 'agressão', 'espancar',
    'tortura', 'suicídio', 'morte',
    
    // Ódio
    'ódio', 'racismo', 'preconceito', 'discriminação', 'xenofobia'
  ],
  
  occultism: [
    'macumba', 'umbanda', 'candomblé', 'espiritismo', 'kardecismo',
    'bruxaria', 'feitiçaria', 'magia', 'ocultismo', 'satanismo',
    'demônio', 'diabo', 'lúcifer', 'satanás', 'possessão',
    'médium', 'psicografia', 'reencarnação', 'carma', 'chakra',
    'tarô', 'horóscopo', 'astrologia', 'numerologia', 'quiromancia'
  ],
  
  anti_christianity: [
    'cristianismo é opressão', 'igreja explora', 'pastor ladrão',
    'religião é ópio', 'deus é invenção', 'bíblia foi inventada',
    'jesus nunca existiu', 'cristianismo é mentira', 'fé é ilusão'
  ]
};

// Padrões contextuais mais sofisticados
const CONTEXTUAL_PATTERNS = [
  // Negação da divindade de Cristo
  {
    pattern: /jesus\s+(não\s+é|nunca\s+foi)\s+(deus|divino|senhor)/i,
    category: 'doctrinal_heresy',
    severity: 'high'
  },
  
  // Salvação por obras
  {
    pattern: /(preciso|tenho\s+que|devo)\s+.*(fazer|cumprir|obedecer)\s+.*(para\s+ser\s+salvo|para\s+ir\s+pro\s+céu)/i,
    category: 'doctrinal_heresy',
    severity: 'high'
  },
  
  // Negação da Bíblia
  {
    pattern: /bíblia\s+(é|foi)\s+(inventada|criada|escrita)\s+por\s+homens/i,
    category: 'blasphemy',
    severity: 'high'
  },
  
  // Heresias marianas
  {
    pattern: /(orar|rezar|pedir)\s+(para|pra)\s+maria/i,
    category: 'doctrinal_heresy',
    severity: 'medium'
  },
  
  // Teologia da prosperidade
  {
    pattern: /deus\s+quer\s+(que\s+você|te)\s+(seja\s+rico|tenha\s+dinheiro|prospere\s+financeiramente)/i,
    category: 'false_teaching',
    severity: 'medium'
  }
];

/**
 * Detecta heresia em texto usando análise por palavras-chave e padrões contextuais
 */
export function detectHeresyInText(text: string): HeresyDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      isHeresy: false,
      category: 'appropriate_content',
      confidence: 100,
      reason: 'Texto vazio ou inválido'
    };
  }

  const normalizedText = text.toLowerCase().trim();
  
  // 1. Verificar padrões contextuais primeiro (mais precisos)
  for (const pattern of CONTEXTUAL_PATTERNS) {
    if (pattern.pattern.test(normalizedText)) {
      const confidence = pattern.severity === 'high' ? 95 : 
                        pattern.severity === 'medium' ? 85 : 75;
      
      return {
        isHeresy: true,
        category: pattern.category,
        confidence,
        reason: `Padrão contextual detectado: ${pattern.pattern.source}`
      };
    }
  }
  
  // 2. Verificar palavras-chave por categoria
  for (const [category, keywords] of Object.entries(HERESY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        // Calcular confiança baseada no tamanho da palavra-chave
        const confidence = Math.min(90, 60 + (keyword.length * 2));
        
        return {
          isHeresy: true,
          category,
          keyword,
          confidence,
          reason: `Palavra-chave detectada: "${keyword}"`
        };
      }
    }
  }
  
  // 3. Verificar palavras isoladas de alta gravidade
  const highSeverityWords = [
    'blasfêmia', 'heresia', 'satanismo', 'anticristo', 'falso profeta'
  ];
  
  for (const word of highSeverityWords) {
    if (normalizedText.includes(word)) {
      return {
        isHeresy: true,
        category: 'blasphemy',
        keyword: word,
        confidence: 85,
        reason: `Palavra de alta gravidade detectada: "${word}"`
      };
    }
  }
  
  return {
    isHeresy: false,
    category: 'appropriate_content',
    confidence: 95,
    reason: 'Nenhuma heresia detectada na análise'
  };
}

/**
 * Filtra texto herético, retornando uma mensagem de bloqueio se necessário
 */
export function filterHeresyInTranscription(transcribedText: string): {
  isBlocked: boolean;
  filteredText: string;
  reason?: string;
  detectionResult?: HeresyDetectionResult;
} {
  const detectionResult = detectHeresyInText(transcribedText);
  
  if (detectionResult.isHeresy && detectionResult.confidence >= 70) {
    return {
      isBlocked: true,
      filteredText: "Desculpe, mas não posso processar este conteúdo pois contém elementos que vão contra os ensinamentos bíblicos. Por favor, reformule sua pergunta de forma respeitosa e edificante.",
      reason: detectionResult.reason,
      detectionResult
    };
  }
  
  return {
    isBlocked: false,
    filteredText: transcribedText,
    detectionResult
  };
}

/**
 * Registra heresia detectada no banco de dados
 */
export async function logHeresyDetection(
  userId: string,
  conversationId: string | null,
  originalText: string,
  detectionResult: HeresyDetectionResult,
  supabase: any
) {
  try {
    const { error } = await supabase
      .from('heresy_logs')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        message_content: originalText,
        heresy_type: detectionResult.category,
        confidence_score: detectionResult.confidence,
        detection_method: 'audio_transcription_filter',
        additional_info: {
          keyword: detectionResult.keyword,
          reason: detectionResult.reason,
          source: 'audio_transcription'
        }
      });
    
    if (error) {
      console.error('❌ Erro ao registrar heresia detectada:', error);
    } else {
      console.log('✅ Heresia registrada nos logs:', detectionResult.category);
    }
  } catch (error) {
    console.error('❌ Erro ao registrar heresia:', error);
  }
}