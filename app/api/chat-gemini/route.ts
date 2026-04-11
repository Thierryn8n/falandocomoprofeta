import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase'
import { filterHeresyInTranscription, logHeresyDetection } from '@/lib/heresy-filter'

export const maxDuration = 300

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Função para detectar gênero do usuário
const detectGender = (name: string): 'irmão' | 'irmã' => {
  if (!name) return 'irmão'
  
  const feminineIndicators = [
    'maria', 'ana', 'joana', 'helena', 'lucia', 'beatriz', 'carla', 'claudia',
    'daniela', 'elena', 'fernanda', 'gabriela', 'isabela', 'julia', 'larissa',
    'marcela', 'natalia', 'olivia', 'patricia', 'raquel', 'sandra', 'tatiana',
    'valeria', 'amanda', 'bruna', 'camila', 'daiana', 'elaine', 'fabiana'
  ]
  
  const lowerName = name.toLowerCase()
  const firstName = lowerName.split(' ')[0]
  
  // Verifica se termina com 'a' (comum em português)
  if (firstName.endsWith('a') && !firstName.endsWith('ra')) {
    return 'irmã'
  }
  
  // Verifica indicadores femininos
  if (feminineIndicators.some(indicator => firstName.includes(indicator))) {
    return 'irmã'
  }
  
  return 'irmão'
}

const SYSTEM_PROMPT = `Você é o Profeta William Marrion Branham (1909-1965), um evangelista e pregador pentecostal.

INSTRUÇÕES IMPORTANTES:
- Responda SEMPRE como se fosse o próprio Profeta William Branham
- Use linguagem espiritual, bíblica e profética
- Base suas respostas exclusivamente nas doutrinas e ensinamentos do Profeta Branham
- **IMPORTANTE: SEMPRE cite versículos bíblicos no formato "Livro Capítulo:Versículo" (ex: João 3:16, Romanos 8:28, Salmos 23:1)**
- Use expressões características como "Assim diz o Senhor", "Irmão/Irmã", "A Palavra do Senhor"
- Mantenha tom respeitoso, amoroso e pastoral
- Não invente doutrinas ou ensinamentos que não sejam do Profeta Branham
- Se não souber algo específico, diga "Irmão/Irmã, busque isso na Palavra de Deus"

ESTRUTURA DA RESPOSTA:
1. Saudação personalizada usando "Irmão/Irmã" + nome do usuário
2. Resposta concisa e profunda (2-3 parágrafos, máximo 400 palavras)
3. **INTEGRE versículos bíblicos no meio do texto naturalmente**: "Como está escrito em João 3:16..."
4. Cite sermões do Profeta Branham quando apropriado
5. Termine com uma bênção espiritual

Sempre termine suas respostas com uma bênção ou palavra de encorajamento espiritual.`

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type")
    
    // Verificar se é áudio (FormData) ou mensagens de texto (JSON)
    if (contentType?.includes("multipart/form-data")) {
      // Processar áudio
      const formData = await req.formData()
      const audioFile = formData.get("audio") as File
      const userName = formData.get("userName") as string || "irmão/irmã"
      const userGender = detectGender(userName)

      if (!audioFile) {
        return NextResponse.json({ error: "Arquivo de áudio é obrigatório" }, { status: 400 })
      }

      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        console.error("GEMINI_API_KEY não encontrada nas variáveis de ambiente")
        return NextResponse.json({ error: "Erro de configuração da API" }, { status: 500 })
      }

      // Converter áudio para base64
      const arrayBuffer = await audioFile.arrayBuffer()
      const base64Audio = Buffer.from(arrayBuffer).toString("base64")

      // Salvar áudio no Supabase Storage
      let audioStoragePath = null
      try {
        // Usar webm como formato padrão pois é suportado pelo Supabase
        const audioType = audioFile.type || 'audio/webm'
        const fileExtension = audioType.includes('webm') ? 'webm' : 'wav'
        const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`
        const filePath = `audio/${fileName}`
        
        const { data: uploadData, error: uploadError } = await getSupabaseAdmin().storage
          .from('attachments')
          .upload(filePath, arrayBuffer, {
            contentType: 'audio/webm',
            upsert: false
          })

        if (uploadError) {
          console.error('Erro ao fazer upload do áudio:', uploadError)
        } else {
          audioStoragePath = uploadData.path
          console.log('Áudio salvo no Supabase Storage:', audioStoragePath)
        }
      } catch (storageError) {
        console.error('Erro no storage do áudio:', storageError)
      }

      console.log("Processando áudio com Gemini API...")

      console.log(" Enviando áudio para transcrição...")
      console.log(" Tipo do arquivo:", audioFile.type)
      console.log(" Tamanho base64:", base64Audio.length)

      const transcriptionResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Transcreva este áudio para texto em português brasileiro. Retorne apenas o texto transcrito, sem comentários adicionais.",
                  },
                  {
                    inline_data: {
                      mime_type: audioFile.type || "audio/wav",
                      data: base64Audio,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1000,
            },
          }),
        }
      )

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text()
        console.error(" Erro na transcrição:", errorText)
        console.error(" Status:", transcriptionResponse.status)
        return NextResponse.json({ error: "Erro ao transcrever áudio: " + errorText }, { status: 500 })
      }

      const transcriptionData = await transcriptionResponse.json()
      const transcribedText = transcriptionData.candidates?.[0]?.content?.parts?.[0]?.text

      // FILTRAR HERESIA NA TRANSCRIÇÃO ANTES DE PROCESSAR
      if (!transcribedText) {
        return NextResponse.json({ error: "Não foi possível transcrever o áudio" }, { status: 500 })
      }

      console.log("Texto transcrito:", transcribedText)

      // 🛡️ FILTRAR HERESIA NA TRANSCRIÇÃO ANTES DE PROCESSAR
      const filterResult = filterHeresyInTranscription(transcribedText);
      
      if (filterResult.isBlocked) {
        console.log("🚫 Heresia detectada na transcrição:", filterResult.reason);
        
        // Registrar a heresia detectada nos logs
        try {
          // Buscar user_id da sessão ou usar um padrão
          const userId = req.headers.get('x-user-id') || 'anonymous';
          await logHeresyDetection(userId, null, transcribedText, filterResult.detectionResult!, supabase);
        } catch (logError) {
          console.error('Erro ao registrar heresia:', logError);
        }
        
        // Retornar mensagem de bloqueio em vez de processar com Gemini
        return NextResponse.json({ 
          response: filterResult.filteredText,
          transcription: transcribedText,
          blocked: true,
          reason: filterResult.reason,
          audioStoragePath: audioStoragePath,
          audioFileName: audioStoragePath ? audioStoragePath.split('/').pop() : null,
          audioFileSize: arrayBuffer.byteLength,
          audioFileType: audioFile.type || 'audio/wav'
        });
      }
      
      console.log("✅ Transcrição aprovada na filtragem de heresia");

      // Buscar referências bíblicas relevantes (igual à API principal)
      console.log("📖 Buscando referências bíblicas da King James...")
      let bibleReferences: any[] = []
      try {
        const bibleResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bible-references`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: transcribedText })
        })
        
        if (bibleResponse.ok) {
          const bibleData = await bibleResponse.json()
          bibleReferences = bibleData.verses || []
          console.log(`📖 Encontradas ${bibleReferences.length} referências bíblicas`)
        }
      } catch (bibleError) {
        console.error("❌ Erro ao buscar referências bíblicas:", bibleError)
      }

      // Buscar documentos relevantes na base de dados (igual à API principal)
      console.log("🔍 Buscando documentos relevantes na base de dados...")
      const { data: relevantDocuments, error: searchError } = await getSupabaseAdmin()
        .from('prophet_messages')
        .select('*')
        .textSearch('content', transcribedText, { 
          config: 'portuguese',
          type: 'websearch'
        })
        .order('relevance_score', { ascending: false })
        .limit(5)

      if (searchError) {
        console.error("Erro ao buscar documentos:", searchError)
      }

      const documentsFound = relevantDocuments || []
      console.log(`📚 Encontrados ${documentsFound.length} documentos relevantes`)

      // Construir contexto dos documentos (igual à API principal)
      let contextInfo = ""
      let sourcesUsedInfo = ""

      if (documentsFound.length > 0) {
        contextInfo += "\n\n=== DOCUMENTOS RELEVANTES DA BASE DE DADOS ===\n"
        contextInfo += `Total de documentos analisados: ${documentsFound.length}\n`
        contextInfo += "Pergunta do usuário: " + transcribedText + "\n\n"
        sourcesUsedInfo += "\n\n---\n**Fontes da base de dados utilizadas para esta resposta:**\n"

        documentsFound.forEach((doc, index) => {
          const documentTitle = doc.title || `Documento ${index + 1}`
          contextInfo += `--- DOCUMENTO: "${documentTitle}" ---\n`
          contextInfo += `Tipo: ${doc.type}\n`
          contextInfo += `Pontuação de Relevância: ${doc.relevance_score}\n`
          if (doc.file_url) {
            contextInfo += `URL do Arquivo: ${doc.file_url}\n`
          }
          contextInfo += `Data de Criação: ${new Date(doc.created_at).toLocaleDateString("pt-BR")}\n`
          contextInfo += `\nCONTEÚDO COMPLETO:\n${doc.content}\n\n`
          contextInfo += `--- FIM DO DOCUMENTO: "${documentTitle}" ---\n\n`

          sourcesUsedInfo += `- "${documentTitle}" (Relevância: ${doc.relevance_score})`
          if (doc.file_url) {
            sourcesUsedInfo += ` - ${doc.file_url}`
          }
          sourcesUsedInfo += "\n"
        })

        contextInfo += "=== FIM DOS DOCUMENTOS DA BASE DE DADOS ===\n"
      }

      // Prompt melhorado com contexto dos documentos
      const enhancedPrompt = `${SYSTEM_PROMPT}

INFORMAÇÃO DO USUÁRIO:
- Nome: ${userName}
- Gênero detectado: ${userGender}

${contextInfo}

INSTRUÇÕES FINAIS PARA RESPOSTA:
1. LEIA E COMPREENDA profundamente TODO o contexto dos documentos fornecidos acima
2. Identifique TODAS as informações relevantes para responder à pergunta: "${transcribedText}"
3. PRIMEIRO: Saude o usuário pelo nome (${userName}) usando "${userGender}" no início da resposta
4. Responda de forma natural, coerente e contextual como o Profeta William Branham
5. Use todo o conhecimento dos documentos para criar uma resposta fluida e espiritual
6. **IMPORTANTE: Cite versículos bíblicos DURANTE a resposta, não apenas no final. Integre as escrituras naturalmente em seus ensinamentos.**
7. **IMPORTANTE: Resposta CONCISA e PROFUNDA com MÁXIMO de 400 palavras (~20% menor). Seja profundo mas direto, use exemplos e ensinamentos bíblicos relevantes.**
8. DEPOIS: No final da resposta, adicione as citações e referências específicas

FORMATO OBRIGATÓRIO PARA REFERÊNCIAS (exatamente como mostrado):
**Referências:**
- [Título do Documento], parágrafos [números específicos]

**Fontes da base de dados utilizadas para esta resposta:**
- "[TÍTULO COMPLETO DO DOCUMENTO]" (Relevância: [pontuação numérica])

PERGUNTA DO USUÁRIO: ${transcribedText}`

// Agora, gerar resposta como Profeta Branham com contexto
const chatResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(300000), // 300 segundos timeout
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: enhancedPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    }),
  }
)

      if (!chatResponse.ok) {
        console.error("Erro na resposta do chat:", await chatResponse.text())
        return NextResponse.json({ error: "Erro ao gerar resposta" }, { status: 500 })
      }

      const chatData = await chatResponse.json()
      let generatedText = chatData.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar resposta"

      // SEMPRE adicionar referências se houver documentos relevantes (igual à API principal)
      if (documentsFound.length > 0) {
        const hasReferences = generatedText.includes("**Referências:**") || generatedText.includes("**Fontes da base de dados")
        
        if (!hasReferences) {
          console.log("🔧 Adicionando referências programaticamente à resposta de áudio...")
          
          // Construir seção de referências baseada nos documentos
          let referencesSection = "\n\n**Referências:**\n"
          documentsFound.forEach((doc, index) => {
            const title = doc.title || `Documento ${index + 1}`
            referencesSection += `- ${title}\n`
          })
          
          // Adicionar seção de fontes
          generatedText += referencesSection + sourcesUsedInfo
          
          // Adicionar referências bíblicas se existirem
          if (bibleReferences.length > 0) {
            generatedText += "\n\n**Referências Bíblicas (King James 1611):**\n"
            bibleReferences.forEach((verse, index) => {
              generatedText += `${index + 1}. ${verse.reference} - "${verse.text}"\n`
            })
          }
        } else if (!generatedText.includes("Fontes da base de dados")) {
          // Se tem referências mas não tem fontes, adicionar apenas as fontes
          generatedText += sourcesUsedInfo
          
          // Adicionar referências bíblicas se existirem
          if (bibleReferences.length > 0) {
            generatedText += "\n\n**Referências Bíblicas (King James 1611):**\n"
            bibleReferences.forEach((verse, index) => {
              generatedText += `${index + 1}. ${verse.reference} - "${verse.text}"\n`
            })
          }
        }
      }

      // Retornar resposta incluindo informações do áudio salvo
      return NextResponse.json({ 
        response: generatedText,
        transcription: transcribedText,
        audioStoragePath: audioStoragePath,
        audioFileName: audioStoragePath ? audioStoragePath.split('/').pop() : null,
        audioFileSize: arrayBuffer.byteLength,
        audioFileType: audioFile.type || 'audio/wav'
      })

    } else {
      // Processar mensagens de texto com a MESMA estrutura do áudio
      const { messages, userName } = await req.json()
      
      // Pegar a última mensagem do usuário
      const lastUserMessage = messages.filter((msg: any) => msg.role === 'user').pop()
      const textMessage = lastUserMessage?.content || ""
      
      // Detectar gênero do usuário
      const userGender = detectGender(userName || 'irmão/irmã')
      
      console.log("💬 Processando mensagem de texto:", textMessage)

      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        console.error("GEMINI_API_KEY não encontrada nas variáveis de ambiente")
        return new Response("Erro de configuração da API", { status: 500 })
      }

      // Buscar referências bíblicas relevantes (igual à rota de áudio)
      console.log("📖 Buscando referências bíblicas da King James...")
      let bibleReferences: any[] = []
      try {
        const bibleResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bible-references`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: textMessage })
        })
        
        if (bibleResponse.ok) {
          const bibleData = await bibleResponse.json()
          bibleReferences = bibleData.verses || []
          console.log(`📖 Encontradas ${bibleReferences.length} referências bíblicas`)
        }
      } catch (bibleError) {
        console.error("❌ Erro ao buscar referências bíblicas:", bibleError)
      }

      // Buscar documentos relevantes na base de dados (igual à rota de áudio)
      console.log("🔍 Buscando documentos relevantes na base de dados...")
      const { data: relevantDocuments, error: searchError } = await getSupabaseAdmin()
        .from('prophet_messages')
        .select('*')
        .textSearch('content', textMessage, { 
          config: 'portuguese',
          type: 'websearch'
        })
        .order('relevance_score', { ascending: false })
        .limit(5)

      if (searchError) {
        console.error("Erro ao buscar documentos:", searchError)
      }

      const documentsFound = relevantDocuments || []
      console.log(`📚 Encontrados ${documentsFound.length} documentos relevantes`)

      // Construir contexto dos documentos (igual à rota de áudio)
      let contextInfo = ""
      let sourcesUsedInfo = ""

      if (documentsFound.length > 0) {
        contextInfo += "\n\n=== DOCUMENTOS RELEVANTES DA BASE DE DADOS ===\n"
        contextInfo += `Total de documentos analisados: ${documentsFound.length}\n`
        contextInfo += "Pergunta do usuário: " + textMessage + "\n\n"
        sourcesUsedInfo += "\n\n---\n**Fontes da base de dados utilizadas para esta resposta:**\n"

        documentsFound.forEach((doc, index) => {
          const documentTitle = doc.title || `Documento ${index + 1}`
          contextInfo += `--- DOCUMENTO: "${documentTitle}" ---\n`
          contextInfo += `Tipo: ${doc.type}\n`
          contextInfo += `Pontuação de Relevância: ${doc.relevance_score}\n`
          if (doc.file_url) {
            contextInfo += `URL do Arquivo: ${doc.file_url}\n`
          }
          contextInfo += `Data de Criação: ${new Date(doc.created_at).toLocaleDateString("pt-BR")}\n`
          contextInfo += `\nCONTEÚDO COMPLETO:\n${doc.content}\n\n`
          contextInfo += `--- FIM DO DOCUMENTO: "${documentTitle}" ---\n\n`

          sourcesUsedInfo += `- "${documentTitle}" (Relevância: ${doc.relevance_score})`
          if (doc.file_url) {
            sourcesUsedInfo += ` - ${doc.file_url}`
          }
          sourcesUsedInfo += "\n"
        })

        contextInfo += "=== FIM DOS DOCUMENTOS DA BASE DE DADOS ===\n"
      }

      // Construir histórico de conversação com contexto
      const contents = [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}

INFORMAÇÃO DO USUÁRIO:
- Nome: ${userName || 'irmão/irmã'}
- Gênero detectado: ${userGender}

${contextInfo}

INSTRUÇÕES FINAIS PARA RESPOSTA:
1. LEIA E COMPREENDA profundamente TODO o contexto dos documentos fornecidos acima
2. Identifique TODAS as informações relevantes para responder à pergunta: "${textMessage}"
3. PRIMEIRO: Saude o usuário pelo nome (${userName || 'irmão/irmã'}) usando "${userGender}" no início da resposta
4. Responda de forma natural, coerente e contextual como o Profeta William Branham
5. Use todo o conhecimento dos documentos para criar uma resposta fluida e espiritual
6. **IMPORTANTE: Cite versículos bíblicos DURANTE a resposta, não apenas no final. Integre as escrituras naturalmente em seus ensinamentos.**
7. **IMPORTANTE: Resposta CONCISA e PROFUNDA com MÁXIMO de 400 palavras (~20% menor). Seja profundo mas direto, use exemplos e ensinamentos bíblicos relevantes.**
8. DEPOIS: No final da resposta, adicione as citações e referências específicas

FORMATO OBRIGATÓRIO PARA REFERÊNCIAS (exatamente como mostrado):
**Referências:**
- [Título do Documento], parágrafos [números específicos]

**Fontes da base de dados utilizadas para esta resposta:**
- "[TÍTULO COMPLETO DO DOCUMENTO]" (Relevância: [pontuação numérica])

PERGUNTA DO USUÁRIO: ${textMessage}` }],
        }
      ]

      // Adicionar mensagens anteriores do histórico
      messages.forEach((message: any) => {
        if (message.role === "user" && message.content !== textMessage) {
          contents.push({
            role: "user",
            parts: [{ text: message.content }],
          })
        } else if (message.role === "assistant") {
          contents.push({
            role: "model",
            parts: [{ text: message.content }],
          })
        }
      })

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(300000), // 300 segundos timeout
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 4000,
            },
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Gemini API error: ${response.status} - ${errorText}`)
        return NextResponse.json({ 
          error: `Erro na API do Gemini: ${response.status}`,
          details: errorText 
        }, { status: 500 })
      }

      const data = await response.json()
      console.log("Resposta da API do Gemini processada com sucesso")
      let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar resposta"

      // SEMPRE adicionar referências se houver documentos relevantes (igual à rota de áudio)
      if (documentsFound.length > 0) {
        const hasReferences = generatedText.includes("**Referências:**") || generatedText.includes("**Fontes da base de dados")
        
        if (!hasReferences) {
          console.log("🔧 Adicionando referências programaticamente à resposta de texto...")
          
          // Construir seção de referências baseada nos documentos
          let referencesSection = "\n\n**Referências:**\n"
          documentsFound.forEach((doc, index) => {
            const title = doc.title || `Documento ${index + 1}`
            referencesSection += `- ${title}\n`
          })
          
          // Adicionar seção de fontes
          generatedText += referencesSection + sourcesUsedInfo
          
          // Adicionar referências bíblicas se existirem
          if (bibleReferences.length > 0) {
            generatedText += "\n\n**Referências Bíblicas (King James 1611):**\n"
            bibleReferences.forEach((verse, index) => {
              generatedText += `${index + 1}. ${verse.reference} - "${verse.text}"\n`
            })
          }
        } else if (!generatedText.includes("Fontes da base de dados")) {
          // Se tem referências mas não tem fontes, adicionar apenas as fontes
          generatedText += sourcesUsedInfo
          
          // Adicionar referências bíblicas se existirem
          if (bibleReferences.length > 0) {
            generatedText += "\n\n**Referências Bíblicas (King James 1611):**\n"
            bibleReferences.forEach((verse, index) => {
              generatedText += `${index + 1}. ${verse.reference} - "${verse.text}"\n`
            })
          }
        }
      }

      return NextResponse.json({ 
        response: generatedText,
        transcription: textMessage
      })
    }
  } catch (error: any) {
    console.error("❌ Erro na API do Gemini:", error)
    console.error("📋 Stack trace:", error?.stack)
    console.error("📋 Error message:", error?.message)
    return NextResponse.json({ error: "Erro interno do servidor: " + (error?.message || "Unknown") }, { status: 500 })
  }
}
