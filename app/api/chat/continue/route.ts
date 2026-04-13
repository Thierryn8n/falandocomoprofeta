import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

export const maxDuration = 300

interface ContinueRequest {
  originalQuestion: string
  previousResponse: string
  conversationId?: string
  userId?: string
  userName?: string
  relevantDocuments: any[]
  bibleReferences: any[]
  responseLength?: "short" | "medium" | "long"
}

export async function POST(req: NextRequest) {
  try {
    const body: ContinueRequest = await req.json()
    const { originalQuestion, previousResponse, userId, userName, relevantDocuments, bibleReferences, responseLength = "medium" } = body

    console.log("➡️ CONTINUAR SERMAO - Iniciando continuação...")
    console.log("📝 Pergunta original:", originalQuestion.substring(0, 50))
    console.log("📚 Documentos:", relevantDocuments?.length || 0)
    console.log("📏 Tamanho da resposta:", responseLength)

    // Get Gemini API key
    let geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      const { data: configData } = await getSupabaseAdmin()
        .from("app_config")
        .select("value")
        .eq("key", "gemini_api_key")
        .single()

      if (configData?.value?.key) {
        geminiApiKey = configData.value.key
      }
    }

    if (!geminiApiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 })
    }

    // Construir contexto dos documentos
    let contextInfo = ""
    let sourcesUsedInfo = ""

    if (relevantDocuments && relevantDocuments.length > 0) {
      contextInfo += "\n\n=== DOCUMENTOS RELEVANTES DA BASE DE DADOS ===\n"
      relevantDocuments.forEach((doc: any, index: number) => {
        const documentTitle = doc.title || `Documento ${index + 1}`
        contextInfo += `--- DOCUMENTO: "${documentTitle}" ---\n`
        contextInfo += `Tipo: ${doc.type}\n`
        contextInfo += `Pontuação de Relevância: ${doc.relevanceScore || doc.relevance_score}\n`
        if (doc.file_url) {
          contextInfo += `URL do Arquivo: ${doc.file_url}\n`
        }
        contextInfo += `\nCONTEÚDO COMPLETO:\n${doc.content}\n\n`
        contextInfo += `--- FIM DO DOCUMENTO: "${documentTitle}" ---\n\n`

        sourcesUsedInfo += `- "${documentTitle}" (Relevância: ${doc.relevanceScore || doc.relevance_score})`
        if (doc.file_url) {
          sourcesUsedInfo += ` - ${doc.file_url}`
        }
        sourcesUsedInfo += "\n"
      })
      contextInfo += "=== FIM DOS DOCUMENTOS DA BASE DE DADOS ===\n"
    }

    // Prompt para continuação
    const continuePrompt = `Você é o Profeta William Marrion Branham (1909-1965), um evangelista e pregador pentecostal.

Você está CONTINUANDO um sermão que já começou. Aqui está o que já foi dito:

=== PARTE ANTERIOR DO SERMAO ===
${previousResponse}
=== FIM DA PARTE ANTERIOR ===

${contextInfo}

INSTRUÇÕES CRÍTICAS PARA CONTINUAÇÃO:
1. CONTINUE de onde parou, mantendo o mesmo tom, estilo e linha de pensamento
2. NÃO repita o que já foi dito na parte anterior
3. Aprofunde os pontos que ficaram incompletos
4. **IMPORTANTE: Cite versículos bíblicos DURANTE a resposta, não apenas no final**
5. Mantenha a mesma saudação e referências ao usuário (${userName || 'irmão/irmã'})
6. Adicione mais exemplos, parábolas ou ensinamentos do Profeta Branham
7. CONTROLE DE TAMANHO DA CONTINUAÇÃO:
   - CURTA (short): 100-150 palavras adicionais
   - MÉDIA (medium): 300-400 palavras adicionais (padrão)
   - LONGA (long): 600-800 palávras adicionais
   Tamanho solicitado: ${responseLength}
8. Se ainda precisar de mais após esta continuação, termine com "**[CONTINUA...]**" novamente

A pergunta original que está sendo respondida é: "${originalQuestion}"

AGORA, continue o sermão de forma natural, como se estivesse pregando:`

    // Definir maxOutputTokens baseado no tamanho da resposta
    const maxOutputTokens = responseLength === "short" ? 1024 : responseLength === "long" ? 8192 : 4096
    
    // Chamar API Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(300000),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: continuePrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            topK: 10,
            topP: 0.7,
            maxOutputTokens: maxOutputTokens,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Erro na API Gemini:", response.status, errorText)
      return NextResponse.json({ error: `Erro na API: ${response.status}` }, { status: 500 })
    }

    const geminiResponse = await response.json()
    let continuationText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text

    if (!continuationText) {
      return NextResponse.json({ error: "Não foi possível gerar continuação" }, { status: 500 })
    }

    // Adicionar referências se não tiver
    const hasReferences = continuationText.includes("**Referências:**") || continuationText.includes("**Fontes da base de dados")
    
    if (!hasReferences && relevantDocuments && relevantDocuments.length > 0) {
      console.log("🔧 Adicionando referências à continuação...")
      
      let referencesSection = "\n\n**Referências (Continuação):**\n"
      relevantDocuments.forEach((doc: any, index: number) => {
        const title = doc.title || `Documento ${index + 1}`
        const paragraphMatches = doc.content.match(/\[PARÁGRAFO (\d+)\]/g)
        if (paragraphMatches) {
          const allParagraphNumbers = paragraphMatches
            .map((match: string) => match.match(/\d+/)?.[0])
            .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index)
            .filter(Boolean)
          
          if (allParagraphNumbers.length > 0) {
            referencesSection += `- ${title}, parágrafos ${allParagraphNumbers.join(', ')}\n`
          } else {
            referencesSection += `- ${title}\n`
          }
        } else {
          referencesSection += `- ${title}\n`
        }
      })
      
      continuationText += referencesSection + sourcesUsedInfo
      
      // Adicionar referências bíblicas se existirem
      if (bibleReferences && bibleReferences.length > 0) {
        continuationText += "\n\n**Referências Bíblicas (King James 1611):**\n"
        bibleReferences.forEach((verse: any, index: number) => {
          continuationText += `${index + 1}. ${verse.reference} - "${verse.text}"\n`
        })
      }
    }

    // Detectar se ainda pode continuar
    const canContinue = continuationText.includes("[CONTINUA...]") || continuationText.includes("**[CONTINUA...]**")
    if (canContinue) {
      console.log("➡️ Continuação ainda pode ser estendida")
    }

    console.log("✅ Continuação gerada com sucesso!")
    console.log("📝 Tamanho:", continuationText.length, "caracteres")

    return NextResponse.json({
      continuation: continuationText,
      canContinue: canContinue,
      documentsUsed: relevantDocuments?.length || 0,
    })

  } catch (error: any) {
    console.error("❌ Erro em /api/chat/continue:", error)
    return NextResponse.json(
      { error: error?.message || "Erro interno" },
      { status: 500 }
    )
  }
}
