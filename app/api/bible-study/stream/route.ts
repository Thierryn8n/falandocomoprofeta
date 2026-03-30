import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `Você é um assistente especializado em estudos bíblicos, com profundo conhecimento das Escrituras e dos ensinamentos do Profeta William Marrion Branham.

SUA MISSÃO:
Criar estudos bíblicos completos e interativos, organizando o conhecimento em cards conectáveis que ajudam o usuário a visualizar as conexões entre conceitos, versículos e revelações.

REGRAS FUNDAMENTAIS - LEIA E ANALISE TUDO:
1. LEIA E COMPREENDA profundamente TODAS as mensagens do profeta fornecidas acima
2. Analise o TÍTULO e a DESCRIÇÃO do painel para identificar o tema principal
3. Use APENAS informações das mensagens do profeta e da Bíblia
4. NUNCA invente conteúdo que não esteja nas mensagens fornecidas
5. Crie cards ESPECÍFICOS baseados nas mensagens do profeta
6. Numere e cite os parágrafos específicos das mensagens quando usar
7. Use DIVERSOS TIPOS de elementos visuais para melhor organização

TIPOS DE CARDS QUE VOCÊ DEVE CRIAR (USE TODOS ELES):
1. **verse** - Versículos bíblicos específicos com contexto (usa sticky)
2. **concept** - Conceitos teológicos e doutrinários (usa sticky)
3. **question** - Perguntas provocativas para reflexão (usa sticky)
4. **answer** - Respostas baseadas nas Escrituras e profeta (usa sticky)
5. **title** - Títulos importantes para seções (usa sticky)
6. **text** - Textos explicativos e detalhados (usa sticky)
7. **prophet_message** - CITAÇÕES DIRETAS do Profeta Branham (usa frame - MAIOR!)
8. **connection** - Cards que conectam diferentes ideias (usa table)
9. **note** - Anotações e insights pessoais (usa doc)

IMPORTANTE - IMAGENS PARA FRAMES:
- Para cards do tipo 'prophet_message' que usam frame, BUSQUE IMAGENS RELEVANTES
- Use termos como: "perseverança cristã", "fé bíblica", "oração", "Bíblia"
- Inclua no frame: [IMAGEM: descrição da imagem buscada]
- Exemplo: [IMAGEM: pessoa orando com Bíblia aberta]

IMPORTANTE - LAYOUT E ORGANIZAÇÃO:
- Os cards serão posicionados AUTOMATICAMENTE com espaçamento de 320px horizontal
- prophet_message usa FRAME maior (350x250) para destacar COM IMAGENS
- connection usa TABLE para mostrar relações
- note usa DOC para anotações estruturadas
- Demais usam STICKY com tamanho padrão (280x180)
- NÃO se preocupe com posições - o sistema organiza automaticamente

ESTRUTURA DA RESPOSTA:
Para cada card, forneça:
- title: Título claro e conciso (será numerado automaticamente)
- content: Conteúdo detalhado e explicativo
- card_type: UM DOS 9 TIPOS ACIMA (use variedade!)
- bible_reference: Referência bíblica (se aplicável)
- prophet_message: Citação direta do Profeta (SEMPRE que possível)
- source_message: Título da mensagem original do profeta
- paragraph_refs: Números dos parágrafos específicos usados

IMPORTANTE - NUMERAÇÃO AUTOMÁTICA:
- Os cards serão numerados automaticamente: 1., 2., 3., etc.
- NÃO inclua números no título - o sistema adiciona automaticamente
- Organize os cards em ordem lógica para estudo

CONEXÕES ENTRE CARDS:
Identifique quais cards devem ser conectados:
- Versículos que explicam conceitos
- Conceitos que respondem perguntas
- Mensagens do profeta que iluminam versículos
- Revelações que conectam ideias
- Perguntas que levam a respostas

VERSÕES BÍBLICAS:
Adapte as citações conforme a versão solicitada pelo usuário.

EXEMPLO DE RESPOSTA FORMATADA:
{
  "analysis": "Análise completa do painel identificando tema principal: [tema específico]. Analisadas mensagens do profeta sobre [assunto específico].",
  "cards": [
    {
      "title": "[Nome da Mensagem do Profeta] - [Tema]",
      "content": "Baseado na mensagem [título], parágrafos [números], Brother Branham ensina que...",
      "card_type": "prophet_message",
      "bible_reference": "Referência bíblica mencionada na mensagem",
      "prophet_message": "Citação direta e específica do profeta",
      "source_message": "Título exato da mensagem",
      "paragraph_refs": "1, 3, 5"
    }
  ],
  "connections": [
    {
      "from_card_title": "Título do Card Origem",
      "to_card_title": "Título do Card Destino",
      "connection_type": "explains",
      "label": "Exemplifica"
    }
  ]
}

IMPORTANTE - OBRIGATÓRIO:
- NUNCA crie conteúdo genérico
- SEMPRE use informações das mensagens do profeta fornecidas
- CITE os parágrafos específicos que você usou
- Use TODOS os tipos de cards disponíveis
- Crie um MAPA MENTAL ESPECÍFICO baseado no tema do painel
- Analise REALMENTE o título e descrição fornecidos`

// Helper function to stream data
function streamData(data: any, controller: ReadableStreamDefaultController) {
  const chunk = `data: ${JSON.stringify(data)}\n\n`
  controller.enqueue(new TextEncoder().encode(chunk))
}

// Enhanced function to analyze documents and find most relevant content
async function analyzeDocumentsForPanel(panelTitle: string, panelDescription: string, panelTheme: string): Promise<any[]> {
  try {
    console.log("🔍 Analyzing documents for panel...")
    console.log("🔍 Panel title:", panelTitle)
    console.log("🔍 Panel description:", panelDescription)
    console.log("🔍 Panel theme:", panelTheme)

    // Get ALL processed documents from database
    const { data: allDocuments, error } = await supabase
      .from("documents")
      .select("id, title, content, type, file_url, created_at, updated_at")
      .eq("status", "processed")
      .not("content", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching documents:", error)
      return []
    }

    if (!allDocuments || allDocuments.length === 0) {
      console.log("📭 No documents found in database")
      return []
    }

    console.log(`✅ Found ${allDocuments.length} documents in database`)

    // Combine panel info for analysis
    const panelText = `${panelTitle} ${panelDescription} ${panelTheme}`.toLowerCase()
    const panelTextNormalized = panelText
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    // Extract meaningful keywords
    const keywords = panelTextNormalized
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter(
        (word) =>
          !["que", "como", "onde", "quando", "por", "para", "com", "sem", "sobre", "uma", "uns", "das", "dos", "pela", "pelo", "isso", "essa", "este", "esta", "aquele", "aquela", "muito", "mais", "menos", "bem", "mal", "sim", "não", "também", "ainda", "já", "sempre", "nunca"].includes(word),
      )

    // Extract key phrases (2-4 words)
    const phrases: string[] = []
    const words = panelTextNormalized.split(/\s+/)
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].length > 3 && words[i + 1].length > 3) {
        phrases.push(`${words[i]} ${words[i + 1]}`)
      }
      if (i < words.length - 2 && words[i + 2].length > 3) {
        phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
      }
    }

    console.log("🔍 Extracted keywords:", keywords)
    console.log("🔍 Extracted phrases:", phrases)

    const relevantDocuments: any[] = []

    // Analyze each document for relevance
    for (const doc of allDocuments) {
      if (!doc.content || doc.content.trim().length === 0) {
        continue
      }

      const contentLower = doc.content.toLowerCase()
      const titleLower = doc.title.toLowerCase()
      let relevanceScore = 0
      const matchDetails: string[] = []

      // 1. Exact phrase matching
      phrases.forEach((phrase) => {
        if (phrase.length > 5) {
          const phraseMatches = (contentLower.match(new RegExp(phrase.replace(/\s+/g, "\\s+"), "gi")) || []).length
          if (phraseMatches > 0) {
            relevanceScore += phraseMatches * 25
            matchDetails.push(`Frase "${phrase}" encontrada ${phraseMatches} vez(es)`)
          }

          const titlePhraseMatches = (titleLower.match(new RegExp(phrase.replace(/\s+/g, "\\s+"), "gi")) || []).length
          if (titlePhraseMatches > 0) {
            relevanceScore += titlePhraseMatches * 40
            matchDetails.push(`Frase "${phrase}" no título ${titlePhraseMatches} vez(es)`)
          }
        }
      })

      // 2. Individual keyword analysis
      keywords.forEach((keyword) => {
        if (keyword.length > 3) {
          const contentMatches = (contentLower.match(new RegExp(`\\b${keyword}\\b`, "gi")) || []).length
          if (contentMatches > 0) {
            relevanceScore += contentMatches * 8
            matchDetails.push(`"${keyword}" encontrada ${contentMatches} vez(es) no conteúdo`)
          }

          const titleMatches = (titleLower.match(new RegExp(`\\b${keyword}\\b`, "gi")) || []).length
          if (titleMatches > 0) {
            relevanceScore += titleMatches * 20
            matchDetails.push(`"${keyword}" encontrada ${titleMatches} vez(es) no título`)
          }
        }
      })

      // 3. Document type bonus
      if (doc.type === "pdf") {
        relevanceScore += 5
        matchDetails.push("Documento PDF (fonte primária)")
      }

      // 4. Recency bonus
      const docAge = Date.now() - new Date(doc.created_at).getTime()
      const daysSinceCreation = docAge / (1000 * 60 * 60 * 24)
      if (daysSinceCreation < 30) {
        relevanceScore += 3
        matchDetails.push("Documento recente")
      }

      // Only include documents with meaningful relevance
      if (relevanceScore >= 15) {
        relevantDocuments.push({
          ...doc,
          relevanceScore,
          matchDetails,
        })
      }
    }

    // Sort by relevance score and select top documents
    const sortedDocuments = relevantDocuments.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5)

    console.log(`✅ Found ${sortedDocuments.length} relevant documents:`)
    sortedDocuments.forEach((doc, index) => {
      console.log(`📄 ${index + 1}. "${doc.title}" (Score: ${doc.relevanceScore})`)
      console.log(`   Matches: ${doc.matchDetails.join("; ")}`)
    })

    return sortedDocuments
  } catch (error) {
    console.error("💥 Error analyzing documents:", error)
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const { panelId, question, audioTranscription } = await req.json()

    if (!panelId) {
      return new Response(JSON.stringify({ error: 'Panel ID is required' }), { status: 400 })
    }

    // Get panel information
    const { data: panel, error: panelError } = await supabase
      .from('bible_study_panels')
      .select('*')
      .eq('id', panelId)
      .single()

    if (panelError || !panel) {
      return new Response(JSON.stringify({ error: 'Panel not found' }), { status: 404 })
    }

    // Get existing cards and connections for context
    const { data: existingCards } = await supabase
      .from('study_cards')
      .select('*')
      .eq('panel_id', panelId)

    // Use sophisticated document analysis (same as chat API)
    const relevantDocuments = await analyzeDocumentsForPanel(
      panel.title || '',
      panel.description || '',
      panel.theme || ''
    )

    console.log('[Bible Study] Documents analysis complete:', relevantDocuments.length, 'relevant documents found')

    // Build context for AI
    let contextInfo = ''
    if (existingCards && existingCards.length > 0) {
      contextInfo += '\n\n=== CARDS EXISTENTES NO PAINEL ===\n'
      existingCards.forEach((card, index) => {
        contextInfo += `Card ${index + 1}: "${card.title}" (${card.card_type})\n`
        contextInfo += `Conteúdo: ${card.content}\n`
        if (card.bible_reference) {
          contextInfo += `Referência: ${card.bible_reference}\n`
        }
        contextInfo += '\n'
      })
    }

    // Add relevant documents context with scoring
    let prophetContext = ''
    if (relevantDocuments && relevantDocuments.length > 0) {
      prophetContext += '\n\n=== MENSAGENS DO PROFETA RELEVANTES (ANÁLISE COMPLETA) ===\n'
      prophetContext += `Total de mensagens relevantes: ${relevantDocuments.length}\n\n`
      
      relevantDocuments.forEach((doc, index) => {
        prophetContext += `--- MENSAGEM ${index + 1}: "${doc.title}" ---\n`
        prophetContext += `Relevância: ${doc.relevanceScore} pontos\n`
        prophetContext += `Matches: ${doc.matchDetails.join('; ')}\n`
        prophetContext += `\nCONTEÚDO COMPLETO COM NUMERAÇÃO DE PARÁGRAFOS:\n`
        
        // Add paragraph numbering
        const paragraphs = doc.content.split(/\n\s*\n|\n{2,}/).filter((p: string) => p.trim().length > 0)
        paragraphs.forEach((paragraph: string, pIndex: number) => {
          prophetContext += `[PARÁGRAFO ${pIndex + 1}] ${paragraph.trim()}\n\n`
        })
        
        prophetContext += `--- FIM DA MENSAGEM ---\n\n`
      })
      
      prophetContext += '=== FIM DAS MENSAGENS DO PROFETA ===\n'
    } else {
      prophetContext += '\n\n=== NENHUMA MENSAGEM RELEVANTE ENCONTRADA ===\n'
      prophetContext += 'Não foram encontradas mensagens do profeta relevantes ao tema do painel.\n'
      prophetContext += 'Por favor, verifique se há documentos na base de dados.\n'
    }

    // Build the enhanced prompt
    const userQuestion = audioTranscription || question
    const enhancedPrompt = `${SYSTEM_PROMPT}

CONTEXTO DO PAINEL:
- Título: ${panel.title}
- Descrição: ${panel.description || 'Não especificada'}
- Tema: ${panel.theme || 'Não especificado'}
- Versão Bíblica: ${panel.bible_version}
- Auxílio do Profeta: ${panel.prophet_assistance ? 'Sim' : 'Não'}

${contextInfo}

${prophetContext}

PERGUNTA DO USUÁRIO: ${userQuestion}

ANÁLISE NECESSÁRIA:
1. LEIA E COMPREENDA profundamente TODAS as mensagens do profeta fornecidas acima
2. Analise o TÍTULO e a DESCRIÇÃO do painel para identificar o tema principal
3. Entenda como a nova pergunta se conecta ao contexto existente
4. Crie novos cards que expandam e conectem-se ao conhecimento atual
5. Use APENAS mensagens do profeta que sejam relevantes ao tema
6. SEMPRE cite os parágrafos específicos das mensagens quando usar
7. Sugira conexões lógicas entre cards novos e existentes

INSTRUÇÕES ESPECÍFICAS:
- Crie cards ESPECÍFICOS baseados nas mensagens do profeta - NUNCA genéricos
- Se o painel já tem conteúdo, crie cards que complementem e expandam
- Se for o primeiro card, crie uma base sólida para o estudo usando as mensagens disponíveis
- Use as mensagens do profeta para enriquecer o estudo - CITE os parágrafos
- Sempre sugira conexões lógicas entre os cards
- Use a versão bíblica configurada no painel
- NUNCA invente conteúdo - use APENAS as mensagens fornecidas acima
- Crie um MAPA MENTAL ESPECÍFICO baseado nas mensagens do profeta

RESPOSTA OBRIGATÓRIA EM FORMATO JSON:
{
  "analysis": "Análise do contexto do painel e como a pergunta se conecta",
  "cards": [
    {
      "title": "Título do Card",
      "content": "Conteúdo detalhado",
      "card_type": "verse|concept|question|answer|connection|note|prophet_message",
      "bible_reference": "Referência (se aplicável)",
      "prophet_message": "Citação do Profeta (se relevante)",
      "source_message": "Título da mensagem original",
      "paragraph_refs": "Números dos parágrafos citados"
    }
  ],
  "connections": [
    {
      "from_card_title": "Título do Card Origem",
      "to_card_title": "Título do Card Destino", 
      "connection_type": "related|explains|causes|leads_to|contrasts",
      "label": "Descrição da conexão"
    }
  ]
}`

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call Gemini API
          const apiKey = process.env.GEMINI_API_KEY
          if (!apiKey) {
            streamData({ type: 'error', error: "Configuration error" }, controller)
            controller.close()
            return
          }

          console.log('[Bible Study] Starting streaming generation...')
          console.log('[Bible Study] Panel context:', {
            title: panel.title,
            description: panel.description,
            prophetAssistance: panel.prophet_assistance
          })
          console.log('[Bible Study] Relevant documents found:', relevantDocuments?.length || 0)

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: enhancedPrompt }],
                  },
                ],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 8000,
                },
              }),
            }
          )

          if (!response.ok) {
            streamData({ type: 'error', error: "Failed to generate study content" }, controller)
            controller.close()
            return
          }

          const geminiResponse = await response.json()
          const aiResponse = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text

          if (!aiResponse) {
            streamData({ type: 'error', error: "No response from AI" }, controller)
            controller.close()
            return
          }

          console.log('[Bible Study] AI response received, parsing...')
          console.log('[Bible Study] Raw AI response:', aiResponse.substring(0, 500) + '...')

          // Parse JSON response
          let studyContent
          try {
            // Look for JSON object, handling various formats
            let jsonText = aiResponse
            
            // Remove markdown code blocks if present
            if (jsonText.includes('```json')) {
              jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '')
            }
            
            // Find the start and end of JSON object
            const jsonStart = jsonText.indexOf('{')
            const jsonEnd = jsonText.lastIndexOf('}')
            
            if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
              throw new Error('No valid JSON object found')
            }
            
            const jsonString = jsonText.substring(jsonStart, jsonEnd + 1)
            studyContent = JSON.parse(jsonString)
            
            console.log('[Bible Study] Parsed study content:', {
              analysis: studyContent.analysis?.substring(0, 100) + '...',
              cardsCount: studyContent.cards?.length || 0,
              connectionsCount: studyContent.connections?.length || 0
            })
          } catch (error) {
            console.error('[Bible Study] Error parsing AI response:', error)
            console.error('[Bible Study] Raw response snippet:', aiResponse.substring(0, 1000))
            streamData({ type: 'error', error: "Invalid AI response format" }, controller)
            controller.close()
            return
          }

          console.log('[Bible Study] Parsed study content, creating cards in real-time...')

          // Save and stream cards one by one
          const savedCards = []
          for (let i = 0; i < studyContent.cards.length; i++) {
            const cardData = studyContent.cards[i]
            
            // Create card with smart positioning and numbering
            const { data: savedCard, error } = await supabase
              .from('study_cards')
              .insert({
                panel_id: panelId,
                title: `${i + 1}. ${cardData.title}`, // Add numbering
                content: cardData.content,
                card_type: cardData.card_type,
                position_x: 100 + i * 320, // Horizontal layout - each card to the right
                position_y: 100, // All cards on same Y level
                width: cardData.card_type === 'prophet_message' ? 350 : 
                       cardData.card_type === 'connection' ? 380 : 280,
                height: cardData.card_type === 'prophet_message' ? 250 : 
                        cardData.card_type === 'connection' ? 220 : 180,
                color: '#ffffff',
                bible_reference: cardData.bible_reference,
                prophet_message: cardData.prophet_message,
                metadata: { generated_by_ai: true, card_number: i + 1 }
              })
              .select()
              .single()

            if (!error && savedCard) {
              savedCards.push(savedCard)
              console.log(`🎯 Card ${i + 1}/${studyContent.cards.length} criado:`, savedCard.title)
              
              // Stream card immediately
              streamData({
                type: 'card',
                card: savedCard,
                progress: { current: i + 1, total: studyContent.cards.length }
              }, controller)
              
              // Small delay for visual effect
              await new Promise(resolve => setTimeout(resolve, 300))
            }
          }

          // Save and stream connections
          const savedConnections = []
          if (studyContent.connections) {
            for (const connData of studyContent.connections) {
              const fromCard = savedCards.find(c => c.title === connData.from_card_title)
              const toCard = savedCards.find(c => c.title === connData.to_card_title)
              
              if (fromCard && toCard) {
                const { data: savedConn, error } = await supabase
                  .from('card_connections')
                  .insert({
                    panel_id: panelId,
                    from_card_id: fromCard.id,
                    to_card_id: toCard.id,
                    connection_type: connData.connection_type,
                    label: connData.label,
                    color: '#3b82f6'
                  })
                  .select()
                  .single()

                if (!error && savedConn) {
                  savedConnections.push(savedConn)
                  console.log(`🔗 Conexão criada:`, connData.label)
                  
                  // Stream connection immediately
                  streamData({
                    type: 'connection',
                    connection: savedConn
                  }, controller)
                  
                  // Small delay for visual effect
                  await new Promise(resolve => setTimeout(resolve, 200))
                }
              }
            }
          }

          // Complete
          streamData({
            type: 'complete',
            analysis: studyContent.analysis,
            totalCards: savedCards.length,
            totalConnections: savedConnections.length
          }, controller)

          controller.close()
        } catch (error) {
          console.error('Error in streaming:', error)
          streamData({ type: 'error', error: 'Internal server error' }, controller)
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in streaming API:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
