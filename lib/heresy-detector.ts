import { supabase, type HeresyResponse, type HeresyLog } from "@/lib/supabase"

interface HeresyDetectionResult {
  isHeresy: boolean
  heresyType: "predefined" | "ai_classified" | "none"
  detectedHeresyId?: string
  predefinedResponse?: string
  actionTaken: "responded_with_predefined" | "passed_to_ai" | "ai_classified_heresy" | "ai_classified_irrelevant"
  aiClassification?: string
  confidence: number
}

export class HeresyDetector {
  private heresyResponses: HeresyResponse[] = []
  private geminiApiKey: string | null = null

  constructor(geminiApiKey?: string) {
    this.geminiApiKey = geminiApiKey || null
  }

  // Load heresy responses from database
  async loadHeresyResponses(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("heresy_responses")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error loading heresy responses:", error)
        return
      }

      this.heresyResponses = data || []
      console.log(`✅ Loaded ${this.heresyResponses.length} active heresy responses`)
    } catch (error) {
      console.error("💥 Exception loading heresy responses:", error)
    }
  }

  // Check for predefined heresies using keyword matching
  private checkPredefinedHeresies(message: string): { detected: boolean; heresy?: HeresyResponse } {
    const messageLower = message.toLowerCase().trim()

    for (const heresy of this.heresyResponses) {
      // Check exact phrase match
      if (messageLower.includes(heresy.heresy_phrase.toLowerCase())) {
        console.log(`🎯 Exact heresy phrase detected: "${heresy.heresy_phrase}"`)
        return { detected: true, heresy }
      }

      // Check keyword matches
      const keywordMatches = heresy.keywords.filter((keyword) => messageLower.includes(keyword.toLowerCase()))

      if (keywordMatches.length >= 2) {
        // Require at least 2 keyword matches
        console.log(`🎯 Heresy keywords detected: ${keywordMatches.join(", ")}`)
        return { detected: true, heresy }
      }

      // Single strong keyword match for critical heresies
      const criticalKeywords = ["trindade", "três pessoas", "três deuses", "aspersão", "derramamento"]
      const hasCriticalKeyword = heresy.keywords.some(
        (keyword) => criticalKeywords.includes(keyword.toLowerCase()) && messageLower.includes(keyword.toLowerCase()),
      )

      if (hasCriticalKeyword) {
        console.log(`🎯 Critical heresy keyword detected: ${keywordMatches.join(", ")}`)
        return { detected: true, heresy }
      }
    }

    return { detected: false }
  }

  // Use AI to classify potential heresies, offenses, and inappropriate content
  private async classifyWithAI(
    message: string,
  ): Promise<{ classification: string; confidence: number; isHeresy: boolean }> {
    if (!this.geminiApiKey) {
      console.log("⚠️ No Gemini API key available for AI classification")
      return { classification: "no_api_key", confidence: 0, isHeresy: false }
    }

    try {
      const classificationPrompt = `Você é um sistema de moderação para um chat religioso cristão baseado nas mensagens do Profeta William Branham.

ANALISE a seguinte mensagem e classifique-a em uma das categorias:

MENSAGEM: "${message}"

CATEGORIAS:
1. "heresy_doctrinal" - Heresias doutrinárias (trindade, batismo por aspersão, salvação por obras, etc.)
2. "heresy_blasphemy" - Blasfêmias contra Deus, Jesus, Espírito Santo ou o Profeta
3. "offensive_language" - Linguagem ofensiva, palavrões, insultos
4. "immoral_content" - Conteúdo imoral, sexual, violento
5. "off_topic_irrelevant" - Completamente fora do tópico religioso (muito casual, trivial)
6. "legitimate_question" - Pergunta legítima sobre fé, doutrina, ou vida cristã
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
RAZÃO: [breve explicação]`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: classificationPrompt }] }],
            generationConfig: {
              temperature: 0.1, // Very low for consistent classification
              topK: 5,
              topP: 0.8,
              maxOutputTokens: 200,
            },
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Gemini classification API error:", response.status, errorText)
        return { classification: "api_error", confidence: 0, isHeresy: false }
      }

      const result = await response.json()
      const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || ""

      // Parse AI response
      const classificationMatch = aiResponse.match(/CLASSIFICAÇÃO:\s*([^\n]+)/i)
      const confidenceMatch = aiResponse.match(/CONFIANÇA:\s*(\d+)/i)
      const reasonMatch = aiResponse.match(/RAZÃO:\s*([^\n]+)/i)

      const classification = classificationMatch?.[1]?.trim() || "unknown"
      const confidence = Number.parseInt(confidenceMatch?.[1] || "0")
      const reason = reasonMatch?.[1]?.trim() || ""

      console.log(`🤖 AI Classification: ${classification} (${confidence}%) - ${reason}`)

      const isHeresy = ["heresy_doctrinal", "heresy_blasphemy", "offensive_language", "immoral_content"].includes(
        classification,
      )

      return { classification, confidence, isHeresy }
    } catch (error) {
      console.error("💥 AI classification error:", error)
      return { classification: "error", confidence: 0, isHeresy: false }
    }
  }

  // Main heresy detection function
  async detectHeresy(message: string, userId?: string, conversationId?: string): Promise<HeresyDetectionResult> {
    console.log(`🔍 Analyzing message for heresy: "${message.substring(0, 100)}..."`)

    // Load heresy responses if not already loaded
    if (this.heresyResponses.length === 0) {
      await this.loadHeresyResponses()
    }

    // Step 1: Check predefined heresies
    const predefinedCheck = this.checkPredefinedHeresies(message)

    if (predefinedCheck.detected && predefinedCheck.heresy) {
      console.log(`✅ Predefined heresy detected: "${predefinedCheck.heresy.heresy_phrase}"`)

      // Log the heresy detection
      await this.logHeresyDetection({
        userId,
        conversationId,
        userMessage: message,
        detectedHeresyId: predefinedCheck.heresy.id,
        actionTaken: "responded_with_predefined",
        aiClassification: "predefined_match",
      })

      return {
        isHeresy: true,
        heresyType: "predefined",
        detectedHeresyId: predefinedCheck.heresy.id,
        predefinedResponse: predefinedCheck.heresy.correct_response,
        actionTaken: "responded_with_predefined",
        confidence: 95,
      }
    }

    // Step 2: AI Classification for more nuanced detection
    const aiClassification = await this.classifyWithAI(message)

    if (aiClassification.isHeresy && aiClassification.confidence >= 70) {
      console.log(`🤖 AI detected heresy: ${aiClassification.classification}`)

      // Log the AI heresy detection
      await this.logHeresyDetection({
        userId,
        conversationId,
        userMessage: message,
        detectedHeresyId: null,
        actionTaken: "ai_classified_heresy",
        aiClassification: `${aiClassification.classification} (${aiClassification.confidence}%)`,
      })

      return {
        isHeresy: true,
        heresyType: "ai_classified",
        actionTaken: "ai_classified_heresy",
        aiClassification: aiClassification.classification,
        confidence: aiClassification.confidence,
      }
    }

    // Step 3: Log as passed to AI (legitimate content)
    await this.logHeresyDetection({
      userId,
      conversationId,
      userMessage: message,
      detectedHeresyId: null,
      actionTaken: "passed_to_ai",
      aiClassification: `${aiClassification.classification} (${aiClassification.confidence}%)`,
    })

    console.log(`✅ Message passed heresy check: ${aiClassification.classification}`)

    return {
      isHeresy: false,
      heresyType: "none",
      actionTaken: "passed_to_ai",
      aiClassification: aiClassification.classification,
      confidence: aiClassification.confidence,
    }
  }

  // Log heresy detection to database
  private async logHeresyDetection(logData: {
    userId?: string
    conversationId?: string
    userMessage: string
    detectedHeresyId?: string | null
    actionTaken: HeresyLog["action_taken"]
    aiClassification?: string
  }): Promise<void> {
    try {
      const { error } = await supabase.from("heresy_logs").insert({
        user_id: logData.userId || null,
        conversation_id: logData.conversationId || null,
        user_message: logData.userMessage,
        detected_heresy_id: logData.detectedHeresyId || null,
        action_taken: logData.actionTaken,
        ai_classification: logData.aiClassification || null,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("❌ Error logging heresy detection:", error)
      } else {
        console.log(`📝 Heresy detection logged: ${logData.actionTaken}`)
      }
    } catch (error) {
      console.error("💥 Exception logging heresy detection:", error)
    }
  }

  // Generate appropriate response for detected heresy
  generateHeresyResponse(detection: HeresyDetectionResult): string {
    if (detection.heresyType === "predefined" && detection.predefinedResponse) {
      return detection.predefinedResponse
    }

    // Generate contextual response based on AI classification
    switch (detection.aiClassification) {
      case "heresy_doctrinal":
        return `Irmão/irmã, a Palavra de Deus nos ensina diferente do que foi dito. Assim diz o Senhor através das Escrituras: busque a verdade na Palavra revelada. Que o Espírito Santo te guie em toda verdade. Amém.`

      case "heresy_blasphemy":
        return `Irmão/irmã, cuidado com as palavras, pois está escrito: "Não tomarás o nome do Senhor teu Deus em vão" (Êxodo 20:7). Que o Senhor te perdoe e te dê um coração contrito. Amém.`

      case "offensive_language":
        return `Irmão/irmã, "Nenhuma palavra torpe saia da vossa boca, mas só a que for boa para promover a edificação" (Efésios 4:29). Que o Senhor purifique nossos lábios para Sua glória. Amém.`

      case "immoral_content":
        return `Irmão/irmã, "Fugi da prostituição" e de toda impureza (1 Coríntios 6:18). Que o Senhor nos dê um coração puro e pensamentos santos. Busque a santidade, pois sem ela ninguém verá o Senhor. Amém.`

      default:
        return `Irmão/irmã, que possamos manter nossa conversa sempre edificante e centrada na Palavra do Senhor. "Seja a vossa palavra sempre agradável, temperada com sal" (Colossenses 4:6). Que Deus te abençoe. Amém.`
    }
  }
}

// Export singleton instance
export const heresyDetector = new HeresyDetector()
