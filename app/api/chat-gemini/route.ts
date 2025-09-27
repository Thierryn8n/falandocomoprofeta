import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { filterHeresyInTranscription, logHeresyDetection } from '@/lib/heresy-filter'

export const maxDuration = 30

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const SYSTEM_PROMPT = `Você é o Profeta William Marrion Branham (1909-1965), um evangelista e pregador pentecostal. 

INSTRUÇÕES IMPORTANTES:
- Responda SEMPRE como se fosse o próprio Profeta William Branham
- Use linguagem espiritual, bíblica e profética
- Base suas respostas exclusivamente nas doutrinas e ensinamentos do Profeta Branham
- Cite versículos bíblicos quando apropriado
- Use expressões características como "Assim diz o Senhor", "Irmão/Irmã", "A Palavra do Senhor"
- Mantenha tom respeitoso, amoroso e pastoral
- Não invente doutrinas ou ensinamentos que não sejam do Profeta Branham
- Se não souber algo específico, diga "Irmão/Irmã, busque isso na Palavra de Deus"

TEMAS PRINCIPAIS que você deve abordar:
- A Mensagem do Tempo do Fim
- Os Sete Selos
- As Sete Eras da Igreja
- Batismo em Nome de Jesus
- A Serpente Semente
- A Divindade (não Trindade)
- Cura Divina
- Dons Espirituais
- Segunda Vinda de Cristo

Sempre termine suas respostas com uma bênção ou palavra de encorajamento espiritual.`

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type")
    
    // Verificar se é áudio (FormData) ou mensagens de texto (JSON)
    if (contentType?.includes("multipart/form-data")) {
      // Processar áudio
      const formData = await req.formData()
      const audioFile = formData.get("audio") as File

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
        
        const { data: uploadData, error: uploadError } = await supabase.storage
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

      // Primeiro, fazer speech-to-text
      const transcriptionResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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
        console.error("Erro na transcrição:", await transcriptionResponse.text())
        return NextResponse.json({ error: "Erro ao transcrever áudio" }, { status: 500 })
      }

      const transcriptionData = await transcriptionResponse.json()
      const transcribedText = transcriptionData.candidates?.[0]?.content?.parts?.[0]?.text

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

      // Agora, gerar resposta como Profeta Branham
      const chatResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }],
              },
              {
                role: "user",
                parts: [{ text: transcribedText }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        }
      )

      if (!chatResponse.ok) {
        console.error("Erro na resposta do chat:", await chatResponse.text())
        return NextResponse.json({ error: "Erro ao gerar resposta" }, { status: 500 })
      }

      const chatData = await chatResponse.json()
      const generatedText = chatData.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar resposta"

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
      // Processar mensagens de texto (comportamento original)
      const { messages } = await req.json()

      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        console.error("GEMINI_API_KEY não encontrada nas variáveis de ambiente")
        return new Response("Erro de configuração da API", { status: 500 })
      }

      // Construir o histórico de mensagens para o Gemini
      const contents = [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        }
      ]

      // Adicionar mensagens do usuário
      messages.forEach((message: any) => {
        if (message.role === "user") {
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
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
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
      console.log("Resposta da API do Gemini:", JSON.stringify(data, null, 2))
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar resposta"

      return new Response(generatedText, {
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }
  } catch (error) {
    console.error("Erro na API do Gemini:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
