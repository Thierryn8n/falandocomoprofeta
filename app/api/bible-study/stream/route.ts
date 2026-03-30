import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const SYSTEM_PROMPT = `Você é um assistente especializado em estudos bíblicos, com profundo conhecimento das Escrituras e dos ensinamentos do Profeta William Marrion Branham.

SUA MISSÃO:
Criar estudos bíblicos completos e interativos, organizando o conhecimento em cards conectáveis que ajudam o usuário a visualizar as conexões entre conceitos, versículos e revelações.

REGRAS FUNDAMENTAIS - LEIA E ANALISE TUDO:
1. LEIA E COMPREENDA profundamente TODAS as mensagens do profeta fornecidas acima
2. Analise o TÍTULO e a DESCRIÇÃO do painel para identificar o tema principal
3. Use APENAS informações das mensagens do profeta e da Bíblia
4. NUNCA invente conteúdo que não esteja nas mensagens fornecidas
5. CRIE CONEXÕES REAIS entre versículos, conceitos e revelações
6. SEMPRE cite a fonte: versículo bíblico ou mensagem do profeta
7. Use a estrutura JSON EXATA fornecida no final

TIPOS DE CARDS (escolha o mais apropriado):
1. **bible_verse** - Versículos bíblicos (base para tudo)
2. **concept** - Conceitos e explicações teológicas
3. **revelation** - Revelações divinas e proféticas
4. **question** - Perguntas que estimulam reflexão
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

IMPORTANTE:
- Use exatamente o formato JSON fornecido
- NÃO inclua marcadores de código (```json, ```)
- Crie NO MÍNIMO 5 cards para um estudo completo
- MAXIMIZE o uso das mensagens do Profeta fornecidas
- Crie conexões significativas entre os cards
- Inclua parágrafos específicos das mensagens

RESPOSTA DEVE SER APENAS O JSON - sem texto adicional:

{
  "cards": [
    {
      "title": "Título do Card",
      "content": "Conteúdo detalhado baseado nas mensagens do profeta",
      "card_type": "prophet_message",
      "bible_reference": "João 3:16",
      "prophet_message": "Citação exata do Profeta Branham",
      "source_message": "Título da Mensagem",
      "paragraph_refs": [1, 2, 3],
      "position": { "x": 100, "y": 100 },
      "size": { "width": 300, "height": 200 },
      "color": "#3B82F6"
    }
  ],
  "connections": [
    {
      "from": "index_do_card_origem",
      "to": "index_do_card_destino", 
      "type": "explica",
      "label": "explica",
      "color": "#EF4444"
    }
  ]
}`

// Helper function to analyze documents for relevance
async function analyzeDocumentsForPanel(
  panelTitle: string,
  panelDescription: string,
  panelTheme: string
) {
  try {
    // Get all documents from Supabase
    const supabase = getSupabaseAdmin()
    const { data: documents, error } = await supabase
      .from('prophet_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return []
    }

    if (!documents || documents.length === 0) {
      console.log('No documents found in database')
      return []
    }

    console.log(`📚 Analyzing ${documents.length} documents for panel: "${panelTitle}"`)

    // Create search terms from panel info
    const searchTerms = [
      panelTitle,
      panelDescription,
      panelTheme
    ].filter(Boolean).join(' ').toLowerCase()

    // Split into individual terms for better matching
    const terms = searchTerms.split(/\s+/).filter(term => term.length > 2)

    // Analyze each document for relevance
    const analyzedDocuments = documents.map(doc => {
      const title = (doc.title || '').toLowerCase()
      const content = (doc.content || '').toLowerCase()
      const fullText = title + ' ' + content

      // Calculate relevance score
      let relevanceScore = 0
      const matchDetails: string[] = []

      // Check for exact title matches
      if (title.includes(panelTitle.toLowerCase())) {
        relevanceScore += 50
        matchDetails.push('Title matches panel')
      }

      // Check for term matches in content
      terms.forEach(term => {
        const regex = new RegExp(term, 'gi')
        const matches = fullText.match(regex)
        if (matches) {
          relevanceScore += matches.length * 5
          matchDetails.push(`${matches.length} matches for "${term}"`)
        }
      })

      // Bonus for theme matches
      if (panelTheme && content.includes(panelTheme.toLowerCase())) {
        relevanceScore += 20
        matchDetails.push('Theme matches content')
      }

      // Bonus for description matches
      if (panelDescription && content.includes(panelDescription.toLowerCase())) {
        relevanceScore += 15
        matchDetails.push('Description matches content')
      }

      return {
        ...doc,
        relevanceScore,
        matchDetails
      }
    })

    // Sort by relevance score and filter out low-scoring documents
    const sortedDocuments = analyzedDocuments
      .filter(doc => doc.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10) // Top 10 most relevant

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
    const supabase = getSupabaseAdmin()
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

    // Combine user question with audio transcription if provided
    const userQuestion = audioTranscription 
      ? `${question}\n\n[TRANSCRIÇÃO DE ÁUDIO]: ${audioTranscription}`
      : question

    // Prepare the complete prompt
    const fullPrompt = `${SYSTEM_PROMPT}

=== INFORMAÇÕES DO PAINEL ===
Título: ${panel.title}
Descrição: ${panel.description}
Tema: ${panel.theme}

${contextInfo}

${prophetContext}

=== PERGUNTA DO USUÁRIO ===
${userQuestion}

Baseado em todas as informações acima, crie cards de estudo bíblico detalhados e conexões significativas.`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', await openaiResponse.text())
      throw new Error('Failed to generate response')
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    // Parse the JSON response
    let cardsData
    try {
      // Find JSON in the response (it might be wrapped in code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      cardsData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw response:', aiResponse)
      
      // Return a simple error response
      return new Response(JSON.stringify({
        error: 'Failed to parse AI response',
        rawResponse: aiResponse
      }), { status: 500 })
    }

    // Save the interaction and cards to database
    const interactionId = uuidv4()
    
    // First, save the interaction
    const { error: interactionError } = await supabase
      .from('study_interactions')
      .insert({
        id: interactionId,
        panel_id: panelId,
        question: userQuestion,
        answer: aiResponse,
        cards_generated: cardsData.cards?.length || 0,
        context_analysis: {
          existing_cards_count: existingCards?.length || 0,
          relevant_documents_count: relevantDocuments.length,
          analysis_timestamp: new Date().toISOString()
        }
      })

    if (interactionError) {
      console.error('Error saving interaction:', interactionError)
    }

    // Save each card with proper positioning
    if (cardsData.cards && Array.isArray(cardsData.cards)) {
      for (let i = 0; i < cardsData.cards.length; i++) {
        const card = cardsData.cards[i]
        
        // Calculate position if not provided
        if (!card.position) {
          const row = Math.floor(i / 3)
          const col = i % 3
          card.position = {
            x: col * 350 + 50,
            y: row * 250 + 50
          }
        }
        
        // Set default size if not provided
        if (!card.size) {
          card.size = {
            width: 300,
            height: 200
          }
        }

        // Set default color based on card type
        if (!card.color) {
          const colors = {
            bible_verse: '#3B82F6',
            concept: '#10B981', 
            revelation: '#8B5CF6',
            question: '#F59E0B',
            prophet_message: '#EF4444',
            connection: '#6B7280',
            note: '#EC4899'
          }
          card.color = colors[card.card_type as keyof typeof colors] || '#6B7280'
        }

        const { error: cardError } = await supabase
          .from('study_cards')
          .insert({
            panel_id: panelId,
            title: card.title,
            content: card.content,
            card_type: card.card_type,
            position_x: card.position.x,
            position_y: card.position.y,
            width: card.size.width,
            height: card.size.height,
            color: card.color,
            bible_reference: card.bible_reference,
            prophet_message: card.prophet_message,
            source_message: card.source_message,
            paragraph_refs: card.paragraph_refs,
            interaction_id: interactionId
          })

        if (cardError) {
          console.error('Error saving card:', cardError)
        }
      }
    }

    // Save connections if provided
    if (cardsData.connections && Array.isArray(cardsData.connections)) {
      for (const connection of cardsData.connections) {
        // Get the card IDs from the database
        const { data: fromCard } = await supabase
          .from('study_cards')
          .select('id')
          .eq('panel_id', panelId)
          .eq('title', cardsData.cards[connection.from]?.title)
          .single()

        const { data: toCard } = await supabase
          .from('study_cards')
          .select('id')
          .eq('panel_id', panelId)
          .eq('title', cardsData.cards[connection.to]?.title)
          .single()

        if (fromCard && toCard) {
          const { error: connectionError } = await supabase
            .from('card_connections')
            .insert({
              panel_id: panelId,
              from_card_id: fromCard.id,
              to_card_id: toCard.id,
              connection_type: connection.type,
              label: connection.label,
              color: connection.color || '#EF4444'
            })

          if (connectionError) {
            console.error('Error saving connection:', connectionError)
          }
        }
      }
    }

    // Return the response as a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send the cards data as JSON
          const jsonData = JSON.stringify(cardsData)
          controller.enqueue(encoder.encode(`data: ${jsonData}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
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
    console.error('Error in bible-study/stream API:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
