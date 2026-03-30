import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Interface for documents with relevance scoring
interface Document {
  id: string
  title: string
  content: string
  type: string
  file_url?: string
  created_at: string
  updated_at: string
}

// Enhanced function to analyze documents and find most relevant content
async function analyzeDocumentsForPanel(panelTitle: string, panelDescription: string, panelTheme: string): Promise<(Document & { relevanceScore: number; matchDetails: string[] })[]> {
  try {
    console.log("🔍 Analyzing documents for panel...")
    console.log("🔍 Panel title:", panelTitle)
    console.log("🔍 Panel description:", panelDescription)
    console.log("🔍 Panel theme:", panelTheme)

    // Get ALL processed documents from database
    const { data: allDocuments, error } = await getSupabaseAdmin()
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

    const relevantDocuments: (Document & { relevanceScore: number; matchDetails: string[] })[] = []

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

TIPOS DE CARDS QUE VOCÊ DEVE CRIAR:
1. **verse** - Versículos bíblicos específicos com contexto
2. **concept** - Conceitos teológicos e doutrinários
3. **question** - Perguntas provocativas para reflexão
4. **answer** - Respostas baseadas nas Escrituras e profeta
5. **prophet_message** - Citações diretas do Profeta Branham (USE ESTE!)
6. **connection** - Cards que conectam diferentes ideias
7. **note** - Anotações e insights pessoais

ESTRUTURA DA RESPOSTA:
Para cada card, forneça:
- title: Título claro e conciso (cite a mensagem do profeta se aplicável)
- content: Conteúdo detalhado e explicativo baseado NAS MENSAGENS
- card_type: Um dos 7 tipos acima
- bible_reference: Referência bíblica (se aplicável)
- prophet_message: Citação do Profeta (se relevante)
- source_message: Título da mensagem original do profeta
- paragraph_refs: Números dos parágrafos específicos usados da mensagem

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
- Crie um MAPA MENTAL ESPECÍFICO baseado no tema do painel
- Analise REALMENTE o título e descrição fornecidos`

export async function POST(req: NextRequest) {
  try {
    const { panelId, question, audioTranscription, panelContext } = await req.json()

    if (!panelId) {
      return NextResponse.json({ error: 'Panel ID is required' }, { status: 400 })
    }

    // Get panel information
    const { data: panel, error: panelError } = await getSupabaseAdmin()
      .from('bible_study_panels')
      .select('*')
      .eq('id', panelId)
      .single()

    if (panelError || !panel) {
      return NextResponse.json({ error: 'Panel not found' }, { status: 404 })
    }

    // Get existing cards and connections for context
    const { data: existingCards } = await getSupabaseAdmin()
      .from('study_cards')
      .select('*')
      .eq('panel_id', panelId)

    const { data: existingConnections } = await getSupabaseAdmin()
      .from('card_connections')
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
${panel.prophet_assistance ? `\n\nPRIORIDADE: integre com equilíbrio e reverência o ensino do Profeta William Marrion Branham, alinhado ao tema "${panel.theme || 'do estudo'}" e às Escrituras na versão ${panel.bible_version}.` : ''}

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

FORMATO OBRIGATÓRIO PARA REFERÊNCIAS:
- Cite o TÍTULO COMPLETO da mensagem do profeta
- Liste TODOS os números dos parágrafos específicos utilizados
- Exemplo: "A Serpente Semente - Mensagem 61-0318", parágrafos 1, 3, 5, 8

LEMBRETE CRÍTICO:
O conteúdo ACIMA contém as mensagens COMPLETAS do profeta com numeração de parágrafos.
Você DEVE usar esse conteúdo específico para criar os cards.
NÃO gere conteúdo genérico sobre o tema - use as mensagens REAIS fornecidas.

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

    // Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY não encontrada")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    console.log('[Bible Study] Enhanced prompt length:', enhancedPrompt.length)
    console.log('[Bible Study] Panel context:', {
      title: panel.title,
      description: panel.description,
      prophetAssistance: panel.prophet_assistance
    })
    console.log('[Bible Study] Relevant documents found:', relevantDocuments?.length || 0)
    if (relevantDocuments && relevantDocuments.length > 0) {
      console.log('[Bible Study] First document title:', relevantDocuments[0].title)
      console.log('[Bible Study] First document content preview:', relevantDocuments[0].content?.substring(0, 200))
    }
    console.log('[Bible Study] Prophet context length:', prophetContext.length)

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
      console.error("Gemini API error:", await response.text())
      return NextResponse.json({ error: "Failed to generate study content" }, { status: 500 })
    }

    const geminiResponse = await response.json()
    const aiResponse = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text

    console.log('[Bible Study] Raw AI response length:', aiResponse?.length || 0)
    console.log('[Bible Study] Raw AI response preview:', aiResponse?.substring(0, 500) + '...')

    if (!aiResponse) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 })
    }

    // Parse JSON response
    let studyContent
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      studyContent = JSON.parse(jsonMatch[0])
      console.log('[Bible Study] Parsed study content:', {
        analysis: studyContent.analysis?.substring(0, 100) + '...',
        cardsCount: studyContent.cards?.length || 0,
        connectionsCount: studyContent.connections?.length || 0
      })
    } catch (error) {
      console.error('Error parsing AI response:', error)
      console.error('[Bible Study] AI response that failed to parse:', aiResponse)
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 })
    }

    // Save cards to database
    const savedCards = []
    console.log('[Bible Study] Attempting to save cards:', studyContent.cards?.length || 0)
    for (const cardData of studyContent.cards) {
      console.log('[Bible Study] Saving card:', {
        title: cardData.title,
        type: cardData.card_type,
        hasProphetMessage: !!cardData.prophet_message
      })
      const { data: savedCard, error } = await getSupabaseAdmin()
        .from('study_cards')
        .insert({
          panel_id: panelId,
          title: cardData.title,
          content: cardData.content,
          card_type: cardData.card_type,
          position_x: Math.random() * 400 + 50, // Random position
          position_y: Math.random() * 300 + 50,
          width: 200,
          height: 150,
          color: '#ffffff',
          bible_reference: cardData.bible_reference,
          prophet_message: cardData.prophet_message,
          metadata: { generated_by_ai: true }
        })
        .select()
        .single()

      if (!error && savedCard) {
        savedCards.push(savedCard)
        console.log('[Bible Study] Successfully saved card:', savedCard.id)
      } else {
        console.error('[Bible Study] Failed to save card:', error)
      }
    }

    // Save connections
    const savedConnections = []
    if (studyContent.connections) {
      for (const connData of studyContent.connections) {
        const fromCard = savedCards.find(c => c.title === connData.from_card_title)
        const toCard = savedCards.find(c => c.title === connData.to_card_title)
        
        if (fromCard && toCard) {
          const { data: savedConn, error } = await getSupabaseAdmin()
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
          }
        }
      }
    }

    console.log('[Bible Study] Total cards saved:', savedCards.length)
    console.log('[Bible Study] Study content generated:', {
      analysis: studyContent.analysis?.substring(0, 200) + '...',
      cardsGenerated: savedCards.length,
      prophetMessagesUsed: savedCards.filter((c: any) => c.prophet_message).length
    })

    return NextResponse.json({
      success: true,
      cards: savedCards,
      connections: savedConnections,
      analysis: studyContent.analysis
    })

    // Save interaction
    await getSupabaseAdmin()
      .from('study_interactions')
      .insert({
        panel_id: panelId,
        question: userQuestion,
        answer: aiResponse,
        cards_generated: savedCards,
        context_analysis: {
          existing_cards_count: existingCards?.length || 0,
          analysis: studyContent.analysis || ''
        }
      })

    return NextResponse.json({
      success: true,
      cards: savedCards,
      connections: savedConnections,
      analysis: studyContent.analysis
    })

  } catch (error) {
    console.error('Error in Bible Study API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const panelId = searchParams.get('panelId')

    if (!panelId) {
      return NextResponse.json({ error: 'Panel ID is required' }, { status: 400 })
    }

    // Get panel data
    const { data: panel } = await getSupabaseAdmin()
      .from('bible_study_panels')
      .select('*')
      .eq('id', panelId)
      .single()

    // Get cards
    const { data: cards } = await getSupabaseAdmin()
      .from('study_cards')
      .select('*')
      .eq('panel_id', panelId)
      .order('created_at')

    // Get connections
    const { data: connections } = await getSupabaseAdmin()
      .from('card_connections')
      .select('*')
      .eq('panel_id', panelId)

    return NextResponse.json({
      panel,
      cards: cards || [],
      connections: connections || []
    })

  } catch (error) {
    console.error('Error fetching Bible Study data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
