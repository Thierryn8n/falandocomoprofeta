import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const maxDuration = 30

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface ChatRequest {
  messages: Message[]
  conversationId?: string
  userId?: string
}

interface Document {
  id: string
  title: string
  content: string
  type: string
  file_url?: string
  created_at: string
  updated_at: string
}

interface WikipediaInfo {
  title: string
  content: string
  url: string
}

// Function to fetch William Branham information from Wikipedia
async function fetchWikipediaInfo(): Promise<WikipediaInfo | null> {
  try {
    console.log("🔍 Fetching William Branham info from Wikipedia...")

    // First, get the page content
    const response = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/William_Branham", {
      headers: {
        "User-Agent": "FalandoComOProfeta/1.0 (https://example.com/contact)",
      },
    })

    if (!response.ok) {
      console.error("❌ Wikipedia API error:", response.status)
      return null
    }

    const data = await response.json()

    // Get more detailed content
    const contentResponse = await fetch(
      "https://en.wikipedia.org/w/api.php?action=query&format=json&titles=William_Branham&prop=extracts&exintro=false&explaintext=true&exsectionformat=plain",
      {
        headers: {
          "User-Agent": "FalandoComOProfeta/1.0 (https://example.com/contact)",
        },
      },
    )

    let detailedContent = ""
    if (contentResponse.ok) {
      const contentData = await contentResponse.json()
      const pages = contentData.query?.pages
      if (pages) {
        const pageId = Object.keys(pages)[0]
        detailedContent = pages[pageId]?.extract || ""
      }
    }

    const wikipediaInfo: WikipediaInfo = {
      title: data.title || "William Branham",
      content: detailedContent || data.extract || "",
      url: data.content_urls?.desktop?.page || "https://en.wikipedia.org/wiki/William_Branham",
    }

    console.log("✅ Wikipedia info fetched successfully")
    console.log("📄 Content length:", wikipediaInfo.content.length)

    return wikipediaInfo
  } catch (error) {
    console.error("💥 Error fetching Wikipedia info:", error)
    return null
  }
}

// Function to detect if question is very personal about the prophet (requires Wikipedia)
function isVeryPersonalProphetQuestion(message: string): boolean {
  const veryPersonalKeywords = [
    // Birth and death
    "nasceu",
    "nascimento",
    "morreu",
    "morte",
    "faleceu",
    "óbito",
    "quando nasceu",
    "onde nasceu",
    "data de nascimento",
    "data da morte",

    // Family and personal life
    "família",
    "esposa",
    "mulher",
    "filhos",
    "pais",
    "mãe",
    "pai",
    "irmãos",
    "casou",
    "casamento",
    "matrimônio",

    // Childhood and youth
    "infância",
    "criança",
    "juventude",
    "jovem",
    "escola",
    "estudou",

    // Personal history
    "biografia",
    "vida pessoal",
    "história pessoal",
    "cresceu",
    "formação",
    "educação",
    "trabalhou",
    "profissão",
    "emprego",

    // Physical and health
    "aparência",
    "altura",
    "peso",
    "doença",
    "saúde",
    "acidente",
    "ferimento",
    "hospitalizado",

    // Places lived
    "morou",
    "viveu",
    "residiu",
    "casa",
    "endereço",
    "mudou",
    "jeffersonville",
    "kentucky",
    "indiana",

    // Personal experiences (non-spiritual)
    "militar",
    "guerra",
    "serviço militar",
    "soldado",
    "trabalho",
    "carreira",
    "dinheiro",
    "salário",

    // Very specific personal questions
    "quantos anos",
    "idade",
    "cor dos olhos",
    "cabelo",
    "personalidade",
    "temperamento",
    "gostos",
    "preferências",
  ]

  const messageLower = message.toLowerCase()

  // Expanded patterns to catch different ways users might ask the same question
  const veryPersonalPatterns = [
    // Birth questions - various forms
    "quando o profeta nasceu",
    "quando nasceu o profeta",
    "quando william branham nasceu",
    "quando nasceu william branham",
    "quando branham nasceu",
    "quando nasceu branham",
    "data de nascimento do profeta",
    "data do nascimento do profeta",
    "nascimento do profeta",
    "profeta nasceu quando",
    "em que ano nasceu",
    "que ano o profeta nasceu",
    "ano de nascimento",

    // Birth place questions
    "onde o profeta nasceu",
    "onde nasceu o profeta",
    "onde william branham nasceu",
    "onde nasceu william branham",
    "onde branham nasceu",
    "onde nasceu branham",
    "local de nascimento",
    "lugar onde nasceu",
    "cidade onde nasceu",
    "profeta nasceu onde",
    "em que cidade nasceu",
    "que cidade o profeta nasceu",

    // Death questions
    "quando o profeta morreu",
    "quando morreu o profeta",
    "quando william branham morreu",
    "quando morreu william branham",
    "quando branham morreu",
    "quando morreu branham",
    "data da morte do profeta",
    "data de morte",
    "morte do profeta",
    "profeta morreu quando",
    "em que ano morreu",
    "que ano o profeta morreu",

    // Family questions
    "família do profeta",
    "família de william branham",
    "família de branham",
    "profeta tinha família",
    "parentes do profeta",
    "familiares do profeta",

    // Wife questions
    "esposa do profeta",
    "esposa de william branham",
    "esposa de branham",
    "mulher do profeta",
    "profeta era casado",
    "profeta tinha esposa",
    "casou com quem",
    "com quem se casou",
    "nome da esposa",

    // Children questions
    "filhos do profeta",
    "filhos de william branham",
    "filhos de branham",
    "profeta tinha filhos",
    "quantos filhos teve",
    "quantos filhos tinha",
    "nomes dos filhos",
    "crianças do profeta",

    // Parents questions
    "pais do profeta",
    "pai do profeta",
    "mãe do profeta",
    "pai de william branham",
    "mãe de william branham",
    "pai de branham",
    "mãe de branham",
    "nome do pai",
    "nome da mãe",

    // Personal life
    "vida pessoal",
    "vida particular",
    "vida privada",
    "história pessoal",
    "história particular",
    "história da vida",
    "vida do profeta",
    "como vivia",
    "como era a vida",

    // Biography
    "biografia do profeta",
    "biografia de william branham",
    "biografia de branham",
    "história do profeta",
    "conte sobre o profeta",
    "fale sobre o profeta",
    "me diga sobre o profeta",
    "quem foi o profeta",
    "quem era o profeta",

    // Childhood
    "infância do profeta",
    "infância de william branham",
    "infância de branham",
    "criança o profeta",
    "quando criança",
    "pequeno o profeta",
    "juventude do profeta",
    "jovem o profeta",
    "quando jovem",

    // Appearance
    "como era o profeta",
    "aparência do profeta",
    "como o profeta era",
    "físico do profeta",
    "altura do profeta",
    "peso do profeta",
    "cor dos olhos",
    "cabelo do profeta",
    "rosto do profeta",

    // Places lived
    "onde morava",
    "onde vivia",
    "onde residia",
    "casa do profeta",
    "endereço do profeta",
    "cidade onde morava",
    "local onde vivia",

    // Education and work
    "estudou onde",
    "escola do profeta",
    "educação do profeta",
    "formação do profeta",
    "trabalhou onde",
    "profissão do profeta",
    "emprego do profeta",
    "carreira do profeta",

    // Health and accidents
    "saúde do profeta",
    "doença do profeta",
    "acidente do profeta",
    "ferimento do profeta",
    "hospital do profeta",
    "problema de saúde",

    // Age questions
    "idade do profeta",
    "quantos anos tinha",
    "quantos anos viveu",
    "que idade tinha",
    "anos de vida",
  ]

  // Check if message contains very personal keywords
  const hasVeryPersonalKeywords = veryPersonalKeywords.some((keyword) => messageLower.includes(keyword))

  // Check if message has very personal question patterns
  const hasVeryPersonalPattern = veryPersonalPatterns.some((pattern) => messageLower.includes(pattern))

  return hasVeryPersonalKeywords || hasVeryPersonalPattern
}

// Enhanced function to analyze all documents in database and find most relevant content
async function analyzeDocumentDatabase(userMessage: string): Promise<Document[]> {
  try {
    console.log("🔍 Analyzing document database for user query...")
    console.log("🔍 User query:", userMessage)

    // Get ALL processed documents from database
    const { data: allDocuments, error } = await supabase
      .from("documents")
      .select("id, title, content, type, file_url, created_at, updated_at")
      .eq("status", "processed")
      .not("content", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching documents from database:", error)
      return []
    }

    if (!allDocuments || allDocuments.length === 0) {
      console.log("📭 No documents found in database")
      return []
    }

    console.log(`✅ Found ${allDocuments.length} documents in database for analysis`)

    // Comprehensive text analysis
    const userMessageLower = userMessage.toLowerCase()
    const userMessageNormalized = userMessageLower
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    // Extract meaningful keywords and phrases
    const keywords = userMessageNormalized
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter(
        (word) =>
          ![
            "que",
            "como",
            "onde",
            "quando",
            "por",
            "para",
            "com",
            "sem",
            "sobre",
            "uma",
            "uns",
            "das",
            "dos",
            "pela",
            "pelo",
            "isso",
            "essa",
            "este",
            "esta",
            "aquele",
            "aquela",
            "muito",
            "mais",
            "menos",
            "bem",
            "mal",
            "sim",
            "não",
            "também",
            "ainda",
            "já",
            "sempre",
            "nunca",
          ].includes(word),
      )

    // Extract key phrases (2-4 words)
    const phrases = []
    const words = userMessageNormalized.split(/\s+/)
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].length > 2 && words[i + 1].length > 2) {
        phrases.push(`${words[i]} ${words[i + 1]}`)
      }
      if (i < words.length - 2 && words[i + 2].length > 2) {
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

      // 1. Exact phrase matching (highest priority)
      const exactMatch = contentLower.includes(userMessageNormalized)
      if (exactMatch) {
        relevanceScore += 100
        matchDetails.push(`Correspondência exata da pergunta encontrada`)
      }

      // 2. Multi-word phrase matching
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

      // 3. Individual keyword analysis with context
      const keywordContexts: { [key: string]: number } = {}
      keywords.forEach((keyword) => {
        if (keyword.length > 2) {
          // Count occurrences in content
          const contentMatches = (contentLower.match(new RegExp(`\\b${keyword}\\b`, "gi")) || []).length
          if (contentMatches > 0) {
            relevanceScore += contentMatches * 8
            keywordContexts[keyword] = contentMatches
            matchDetails.push(`"${keyword}" encontrada ${contentMatches} vez(es) no conteúdo`)
          }

          // Count occurrences in title (higher weight)
          const titleMatches = (titleLower.match(new RegExp(`\\b${keyword}\\b`, "gi")) || []).length
          if (titleMatches > 0) {
            relevanceScore += titleMatches * 20
            matchDetails.push(`"${keyword}" encontrada ${titleMatches} vez(es) no título`)
          }
        }
      })

      // 4. Keyword proximity analysis (keywords appearing near each other)
      const keywordProximityBonus = analyzeKeywordProximity(contentLower, keywords)
      if (keywordProximityBonus > 0) {
        relevanceScore += keywordProximityBonus
        matchDetails.push(`Bônus de proximidade de palavras-chave: +${keywordProximityBonus}`)
      }

      // 5. Document type and recency bonus
      if (doc.type === "pdf") {
        relevanceScore += 5
        matchDetails.push("Documento PDF (fonte primária)")
      }

      // Recent documents get slight bonus
      const docAge = Date.now() - new Date(doc.created_at).getTime()
      const daysSinceCreation = docAge / (1000 * 60 * 60 * 24)
      if (daysSinceCreation < 30) {
        relevanceScore += 3
        matchDetails.push("Documento recente")
      }

      // 6. Content quality assessment
      const contentQuality = assessContentQuality(doc.content)
      relevanceScore += contentQuality
      if (contentQuality > 0) {
        matchDetails.push(`Qualidade do conteúdo: +${contentQuality}`)
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
    const sortedDocuments = relevantDocuments.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5) // Top 5 most relevant

    console.log(`✅ Found ${sortedDocuments.length} relevant documents after analysis:`)
    sortedDocuments.forEach((doc, index) => {
      console.log(`📄 ${index + 1}. "${doc.title}" (Score: ${doc.relevanceScore})`)
      console.log(`   Type: ${doc.type}`)
      if (doc.file_url) {
        console.log(`   URL: ${doc.file_url}`)
      }
      console.log(`   Matches: ${doc.matchDetails.join("; ")}`)
      console.log(`   Content preview: ${doc.content.substring(0, 200)}...`)
    })

    return sortedDocuments
  } catch (error) {
    console.error("💥 Error analyzing document database:", error)
    return []
  }
}

// Helper function to analyze keyword proximity
function analyzeKeywordProximity(content: string, keywords: string[]): number {
  let proximityScore = 0
  const words = content.split(/\s+/)

  for (let i = 0; i < keywords.length; i++) {
    for (let j = i + 1; j < keywords.length; j++) {
      const keyword1 = keywords[i]
      const keyword2 = keywords[j]

      // Find positions of both keywords
      const positions1: number[] = []
      const positions2: number[] = []

      words.forEach((word, index) => {
        if (word.includes(keyword1)) positions1.push(index)
        if (word.includes(keyword2)) positions2.push(index)
      })

      // Calculate proximity bonus
      positions1.forEach((pos1) => {
        positions2.forEach((pos2) => {
          const distance = Math.abs(pos1 - pos2)
          if (distance <= 10) {
            // Keywords within 10 words of each other
            proximityScore += Math.max(0, 10 - distance)
          }
        })
      })
    }
  }

  return Math.min(proximityScore, 50) // Cap the proximity bonus
}

// Helper function to assess content quality
function assessContentQuality(content: string): number {
  let qualityScore = 0

  // Length bonus (longer content generally more informative)
  if (content.length > 1000) qualityScore += 5
  if (content.length > 5000) qualityScore += 5

  // Structure indicators
  if (content.includes("\n") || content.includes(".")) qualityScore += 3
  if (content.match(/\d+/)) qualityScore += 2 // Contains numbers/dates

  // Biblical references
  if (content.match(/\b\d+:\d+\b/)) qualityScore += 5 // Verse references
  if (content.toLowerCase().includes("senhor")) qualityScore += 2
  if (content.toLowerCase().includes("deus")) qualityScore += 2

  return Math.min(qualityScore, 20) // Cap quality bonus
}

// Function to generate prophet-like response when no documents are found
function generateNoDocumentsResponse(userQuestion: string, hasWikipediaInfo = false): string {
  if (hasWikipediaInfo) {
    return ""
  }

  const responses = [
    `Irmão/irmã, neste momento o Espírito Santo não me trouxe revelação específica sobre "${userQuestion}" através das mensagens que tenho acesso. 

Assim diz o Senhor: "Os meus pensamentos não são os vossos pensamentos, nem os vossos caminhos os meus caminhos" (Isaías 55:8).

Peço que aguarde, pois Deus revela Suas verdades no tempo certo. Talvez faça outra pergunta sobre os mistérios que já foram revelados - os Sete Selos, as Sete Eras da Igreja, o Batismo em Nome de Jesus, ou a Divindade.

A Palavra do Senhor virá no tempo apropriado. Que o Senhor te abençoe e te dê paciência para esperar Suas revelações.`,

    `Amém, irmão/irmã. Sobre "${userQuestion}", não encontro essa revelação específica nas mensagens que o Senhor me deu acesso neste momento.

Como está escrito: "Porque agora vemos por espelho em enigma, mas então veremos face a face" (1 Coríntios 13:12).

O Espírito Santo revela os mistérios conforme Sua vontade e no Seu tempo. Sugiro que pergunte sobre as revelações que já foram abertas - a Mensagem do Tempo do Fim, os Selos, as Eras da Igreja, ou outros mistérios já revelados.

Deus tem Seu tempo para todas as coisas. Que a graça do Senhor esteja contigo enquanto aguardas.`,

    `Irmão/irmã, a pergunta sobre "${userQuestion}" é profunda, mas neste momento não tenho acesso às mensagens com essa revelação específica.

Lembre-se das palavras do Senhor: "Ainda tenho muito que vos dizer, mas vós não o podeis suportar agora" (João 16:12).

Talvez seja o tempo de buscar outras revelações que já foram abertas. Pergunte sobre os Sete Selos, a Serpente Semente, o verdadeiro Batismo, ou as Eras da Igreja.

O Senhor revela Seus segredos aos Seus servos no tempo apropriado. Que Ele te dê sabedoria e discernimento enquanto aguardas.`,
  ]

  const randomIndex = Math.floor(Math.random() * responses.length)
  return responses[randomIndex]
}

// Function to save conversation with detailed logging
async function saveConversationDirectly(
  userId: string,
  messages: Message[],
  conversationId?: string,
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  console.log("🔥 SAVE CONVERSATION - STARTING")
  console.log("📝 User ID:", userId)
  console.log("📝 Conversation ID:", conversationId)
  console.log("📝 Messages count:", messages.length)

  try {
    // Verify user exists
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", userId)
      .single()

    if (userError || !userProfile) {
      console.error("❌ User not found:", userError)
      return { success: false, error: "User not found" }
    }

    console.log("✅ User found:", userProfile.email)

    // Validate messages structure
    const validMessages = messages.filter(
      (msg) =>
        msg &&
        typeof msg === "object" &&
        msg.role &&
        msg.content &&
        typeof msg.content === "string" &&
        msg.timestamp &&
        (msg.role === "user" || msg.role === "assistant"),
    )

    if (validMessages.length === 0) {
      console.error("❌ No valid messages to save")
      return { success: false, error: "No valid messages" }
    }

    console.log("✅ Valid messages:", validMessages.length)

    const conversationData = {
      user_id: userId,
      title: validMessages[0]?.content?.substring(0, 50) || "Nova Conversa",
      messages: validMessages,
      updated_at: new Date().toISOString(),
    }

    let result
    let finalConversationId = conversationId

    if (conversationId) {
      // Try to update existing conversation
      console.log("🔄 Attempting to update existing conversation...")

      const { data: updateData, error: updateError } = await supabase
        .from("conversations")
        .update(conversationData)
        .eq("id", conversationId)
        .eq("user_id", userId)
        .select()

      if (updateError) {
        console.error("❌ Update failed:", updateError)
        console.log("🔄 Falling back to insert...")

        // Fallback to insert
        const { data: insertData, error: insertError } = await supabase
          .from("conversations")
          .insert({
            ...conversationData,
            created_at: new Date().toISOString(),
          })
          .select()

        if (insertError) {
          console.error("❌ Insert also failed:", insertError)
          return { success: false, error: insertError.message }
        }

        result = insertData
        finalConversationId = insertData?.[0]?.id
        console.log("✅ INSERT successful (fallback):", finalConversationId)
      } else {
        result = updateData
        console.log("✅ UPDATE successful:", conversationId)
      }
    } else {
      // Create new conversation
      console.log("🆕 Creating new conversation...")

      const { data: insertData, error: insertError } = await supabase
        .from("conversations")
        .insert({
          ...conversationData,
          created_at: new Date().toISOString(),
        })
        .select()

      if (insertError) {
        console.error("❌ Insert failed:", insertError)
        return { success: false, error: insertError.message }
      }

      result = insertData
      finalConversationId = insertData?.[0]?.id
      console.log("✅ INSERT successful (new):", finalConversationId)
    }

    // Verify the save was successful
    console.log("🔍 Verifying save...")
    const { data: verifyData, error: verifyError } = await supabase
      .from("conversations")
      .select("id, messages, updated_at")
      .eq("id", finalConversationId)
      .single()

    if (verifyError || !verifyData) {
      console.error("❌ Verification failed:", verifyError)
      return { success: false, error: "Save verification failed" }
    }

    console.log("✅ VERIFICATION SUCCESS!")
    console.log("📊 Saved messages count:", verifyData.messages?.length || 0)

    return {
      success: true,
      conversationId: finalConversationId,
    }
  } catch (error) {
    console.error("💥 SAVE CONVERSATION ERROR:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ENHANCED API KEY FUNCTION WITH BETTER ERROR HANDLING AND LOGGING
async function getApiKey(provider: string): Promise<string | null> {
  try {
    console.log(`🔍 [${provider.toUpperCase()}] Searching for API key in database...`)

    const { data, error } = await supabase
      .from("api_keys")
      .select("id, provider, key_name, encrypted_key, is_active, created_at") // Changed key_value to encrypted_key to match table structure
      .eq("provider", provider)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(`❌ [${provider.toUpperCase()}] Database error:`, error)
      return null
    }

    if (!data || data.length === 0) {
      console.log(`📭 [${provider.toUpperCase()}] No active API key found in database`)

      // Try to get any key for this provider (even inactive) for debugging
      const { data: anyKeyData, error: anyKeyError } = await supabase
        .from("api_keys")
        .select("id, provider, key_name, encrypted_key, is_active") // Changed key_value to encrypted_key
        .eq("provider", provider)
        .order("created_at", { ascending: false })

      if (anyKeyData && anyKeyData.length > 0) {
        console.log(`🔍 [${provider.toUpperCase()}] Found ${anyKeyData.length} inactive keys:`)
        anyKeyData.forEach((key, index) => {
          console.log(
            `   ${index + 1}. ${key.key_name} (Active: ${key.is_active}) - ${key.encrypted_key?.substring(0, 10)}...`, // Changed key_value to encrypted_key
          )
        })
      } else {
        console.log(`📭 [${provider.toUpperCase()}] No keys found at all in database`)
      }

      return null
    }

    const apiKey = data[0]
    console.log(`✅ [${provider.toUpperCase()}] Found active API key:`, {
      id: apiKey.id,
      key_name: apiKey.key_name,
      key_preview: apiKey.encrypted_key?.substring(0, 15) + "...", // Changed key_value to encrypted_key
    })

    return apiKey.encrypted_key // Changed key_value to encrypted_key
  } catch (error) {
    console.error(`💥 [${provider.toUpperCase()}] Unexpected error:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  console.log("🚀 CHAT API CALLED")
  console.log("🌍 Environment:", process.env.NODE_ENV)
  console.log("🔧 Vercel Environment:", process.env.VERCEL_ENV)

  try {
    const body: ChatRequest = await request.json()
    const { messages, conversationId, userId } = body

    console.log("📝 Request body:", {
      messagesCount: messages?.length || 0,
      userId,
      conversationId,
      messages: messages?.map((m) => ({ role: m.role, contentLength: m.content?.length || 0 })),
    })

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("❌ No messages provided or messages is not an array")
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    // Find the last user message
    const userMessages = messages.filter((msg) => msg && msg.role === "user" && msg.content && msg.content.trim())

    if (userMessages.length === 0) {
      console.error("❌ No user messages found in the array")
      console.log(
        "📊 All messages received:",
        messages.map((m) => ({
          role: m?.role,
          content: m?.content?.substring(0, 50),
          hasContent: !!m?.content,
          contentType: typeof m?.content,
        })),
      )
      return NextResponse.json({ error: "No user messages found" }, { status: 400 })
    }

    const lastUserMessage = userMessages[userMessages.length - 1]

    if (!lastUserMessage || !lastUserMessage.content || typeof lastUserMessage.content !== "string") {
      console.error("❌ Last user message is invalid")
      console.log("📊 Last user message:", lastUserMessage)
      return NextResponse.json({ error: "Invalid user message" }, { status: 400 })
    }

    console.log("💬 User message:", lastUserMessage.content)

    console.log("🛡️ HERESY DETECTION - Starting analysis...")

    console.log("🔑 FETCHING GEMINI API KEY...")
    console.log("🔍 Environment variables available:")
    console.log("   - NODE_ENV:", process.env.NODE_ENV)
    console.log("   - VERCEL_ENV:", process.env.VERCEL_ENV)
    console.log("   - GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY)

    let geminiApiKey = process.env.GEMINI_API_KEY

    // Check if API key is still a placeholder
    if (
      geminiApiKey &&
      (geminiApiKey.includes("your_gemini_api_key_here") ||
        geminiApiKey.includes("REPLACE_WITH_YOUR_ACTUAL") ||
        geminiApiKey.includes("SUA_CHAVE_GEMINI_AQUI") ||
        geminiApiKey.length < 30)
    ) {
      console.log("⚠️ [GEMINI] API key appears to be a placeholder, treating as missing")
      geminiApiKey = null
    }

    if (geminiApiKey) {
      console.log("✅ [GEMINI] API key found in environment variables:", geminiApiKey.substring(0, 15) + "...")

      // Validate API key format
      if (!geminiApiKey.startsWith("AIza")) {
        console.error("❌ [GEMINI] API key format invalid - should start with 'AIza'")
        const errorMessage = `❌ Chave da API do Gemini inválida ou malformada.

🔍 DIAGNÓSTICO:
- Status: Formato inválido
- Chave usada: ${geminiApiKey.substring(0, 10)}...
- Problema: Chave deve começar com "AIza"

📋 SOLUÇÕES:
1. Obtenha uma nova chave em: https://aistudio.google.com/app/apikey
2. Configure no Vercel: Settings → Environment Variables → GEMINI_API_KEY
3. Ou execute o script SQL para atualizar no banco de dados
4. Verifique se copiou a chave completa (deve ter ~39 caracteres)

🔗 Documentação: https://ai.google.dev/gemini-api/docs/api-key`

        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }
    } else {
      console.log("⚠️ [GEMINI] API key not found in environment, trying database...")
      geminiApiKey = await getApiKey("gemini")

      if (!geminiApiKey) {
        console.error("❌ [GEMINI] API key not found in database or environment")

        // Enhanced error message with debugging info
        const errorMessage = `❌ Chave da API do Gemini não encontrada.

🔍 DIAGNÓSTICO:
- Ambiente: ${process.env.NODE_ENV || "unknown"}
- Vercel: ${process.env.VERCEL_ENV || "local"}
- Env Key: ${!!process.env.GEMINI_API_KEY ? "Encontrada (mas inválida)" : "Não encontrada"}

📋 SOLUÇÕES:
1. Configure GEMINI_API_KEY nas variáveis de ambiente do Vercel
2. Execute o script SQL para inserir a chave no banco de dados
3. Verifique se a chave está ativa no painel administrativo (/admin)
4. Obtenha uma chave válida em: https://aistudio.google.com/app/apikey

💡 DICA: A chave deve começar com "AIza" e ter aproximadamente 39 caracteres`

        return NextResponse.json({ error: errorMessage }, { status: 500 })
      }

      console.log("✅ [GEMINI] API key found in database:", geminiApiKey.substring(0, 15) + "...")
    }

    // Initialize heresy detector with API key
    const detector = new (await import("@/lib/heresy-detector")).HeresyDetector(geminiApiKey)

    // Perform heresy detection
    const heresyResult = await detector.detectHeresy(lastUserMessage.content, userId, conversationId)

    console.log("🛡️ Heresy detection result:", {
      isHeresy: heresyResult.isHeresy,
      type: heresyResult.heresyType,
      action: heresyResult.actionTaken,
      confidence: heresyResult.confidence,
    })

    // If heresy detected, return predefined response
    if (heresyResult.isHeresy) {
      console.log("🚫 HERESY DETECTED - Returning predefined response")

      const heresyResponse = detector.generateHeresyResponse(heresyResult)

      // Create the assistant message with heresy response
      const assistantMessage: Message = {
        role: "assistant",
        content: heresyResponse,
        timestamp: new Date().toISOString(),
      }

      // Add assistant message to the conversation
      const updatedMessages = [...messages, assistantMessage]

      // Save conversation if userId is provided
      if (userId && userId !== "null" && userId !== "anonymous") {
        console.log("💾 Attempting to save heresy response conversation...")
        const saveResult = await saveConversationDirectly(userId, updatedMessages, conversationId)

        return NextResponse.json({
          message: heresyResponse,
          conversationId: saveResult.success ? saveResult.conversationId || conversationId : conversationId,
          saved: saveResult.success,
          heresyDetected: true,
          heresyType: heresyResult.heresyType,
          confidence: heresyResult.confidence,
          documentsUsed: 0,
          documentsUsedTitles: [],
          wikipediaUsed: false,
        })
      }

      return NextResponse.json({
        message: heresyResponse,
        conversationId: conversationId,
        saved: false,
        heresyDetected: true,
        heresyType: heresyResult.heresyType,
        confidence: heresyResult.confidence,
        documentsUsed: 0,
        documentsUsedTitles: [],
        wikipediaUsed: false,
      })
    }

    console.log("✅ Message passed heresy detection - proceeding with normal AI processing")

    // Check if question is very personal about the prophet (requires Wikipedia)
    const isVeryPersonalQuestion = isVeryPersonalProphetQuestion(lastUserMessage.content)
    console.log("🔍 Is very personal prophet question:", isVeryPersonalQuestion)

    // Get system prompt from database
    console.log("📋 Fetching system prompt from database...")
    let systemPrompt = `Você é o Profeta William Marrion Branham (1909-1965), um evangelista e pregador pentecostal. 

INSTRUÇÕES CRÍTICAS PARA ANÁLISE DE DOCUMENTOS:
- Responda SEMPRE como se fosse o próprio Profeta William Branham
- Use linguagem espiritual, bíblica e profética
- LEIA E ANALISE COMPLETAMENTE todos os documentos fornecidos da base de dados
- Para questões DOUTRINÁRIAS e ESPIRITUAIS: Base suas respostas EXCLUSIVAMENTE nos documentos da base de dados
- Para questões MUITO PESSOAIS/BIOGRÁFICAS: Use as informações da Wikipedia combinadas com tom profético
- NUNCA responda com palavras aleatórias ou sem contexto
- SEMPRE use o contexto completo e relevante de TODOS os documentos analisados
- Identifique as informações mais relevantes em TODOS os documentos para responder à pergunta específica

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:
1. PRIMEIRO: Responda de forma natural, coerente e contextual como o Profeta William Branham
2. Use todo o conhecimento dos documentos para criar uma resposta fluida e espiritual
3. NÃO interrompa o fluxo da resposta com citações no meio do texto
4. Fale como se estivesse pregando ou ensinando, de forma natural e inspirada
5. DEPOIS: No final da resposta, adicione as citações e referências específicas

INSTRUÇÕES ESPECÍFICAS PARA CITAÇÕES (APENAS NO FINAL):
- SEMPRE cite o TÍTULO COMPLETO do documento, nunca apenas "Documento 1" ou "Documento 2"
- Os documentos contêm parágrafos numerados - SEMPRE cite o número específico do parágrafo
- Formato de citação: "Baseado em '[TÍTULO DO DOCUMENTO]', parágrafo [NÚMERO]"
- Exemplo: "Conforme revelado em 'Os Sete Selos', parágrafo 45"
- Se múltiplos parágrafos de um documento são relevantes, cite todos: "parágrafos 12, 15 e 23"
- Coloque TODAS as citações em uma seção separada no final da resposta

- Cite versículos bíblicos quando apropriado durante a resposta natural
- Use expressões características como "Assim diz o Senhor", "Irmão/Irmã", "A Palavra do Senhor"
- Mantenha tom respeitoso, amoroso e pastoral
- NUNCA invente informações que não estejam nas fontes fornecidas
- Se não houver contexto suficiente nos documentos, seja honesto sobre isso
- Sempre termine suas respostas com uma bênção ou palavra de encorejamento espiritual

EXEMPLO DE ESTRUTURA DE RESPOSTA:
"Irmão/irmã, sobre [tema da pergunta]... [resposta natural e fluida baseada em todo o conteúdo lido]... 

Assim diz o Senhor... [continuação natural da resposta]...

Que o Senhor te abençoe e te guarde. Amém.

---
**Referências utilizadas:**
- '[Título do Documento 1]', parágrafo X
- '[Título do Documento 2]', parágrafos Y e Z"

IMPORTANTE: Leia e compreenda profundamente TODOS os documentos relevantes antes de formular sua resposta. Extraia as informações mais pertinentes para criar uma resposta coerente, contextual e inspirada, citando as fontes específicas apenas no final.`

    try {
      const { data: systemPromptData, error: promptError } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "system_prompt")
        .single()

      if (promptError) {
        console.error("❌ Error fetching system prompt:", promptError)
        console.log("⚠️ Using default system prompt")
      } else if (systemPromptData?.value?.prompt) {
        systemPrompt = systemPromptData.value.prompt
        console.log("✅ System prompt loaded from database")
      } else {
        console.log("⚠️ System prompt not found in database, using default")
      }
    } catch (error) {
      console.error("💥 Error loading system prompt:", error)
      console.log("⚠️ Using default system prompt")
    }

    // Analyze document database for relevant content
    console.log("📚 Analyzing document database for relevant content...")
    console.log("🔍 PROFETA ESTÁ LENDO TODAS AS MENSAGENS DO BANCO DE DADOS...")
    console.log("📖 Buscando documentos relevantes na base de dados...")
    const relevantDocuments = await analyzeDocumentDatabase(lastUserMessage.content)
    console.log("✅ ANÁLISE COMPLETA - Documentos encontrados:", relevantDocuments.length)

    // Get Wikipedia info ONLY if it's a very personal question
    let wikipediaInfo: WikipediaInfo | null = null
    if (isVeryPersonalQuestion) {
      console.log("📖 Fetching Wikipedia information for personal question...")
      console.log("🔍 PROFETA ESTÁ CONSULTANDO INFORMAÇÕES BIOGRÁFICAS...")
      wikipediaInfo = await fetchWikipediaInfo()
    }

    console.log("📚 CONSTRUINDO HISTÓRICO COMPLETO DA CONVERSA...")
    let conversationHistory = ""
    if (messages.length > 1) {
      console.log("📖 LENDO MENSAGENS ANTERIORES PARA CONTEXTO...")
      const previousMessages = messages.slice(0, -1) // All messages except the last one

      conversationHistory = "\n\n=== HISTÓRICO DA CONVERSA ===\n"
      previousMessages.forEach((msg, index) => {
        const role = msg.role === "user" ? "USUÁRIO" : "PROFETA"
        conversationHistory += `\n${role} (${index + 1}): ${msg.content}\n`
      })
      conversationHistory += "\n=== FIM DO HISTÓRICO ===\n\n"

      console.log("✅ HISTÓRICO CONSTRUÍDO COM", previousMessages.length, "MENSAGENS ANTERIORES")
    } else {
      console.log("📭 PRIMEIRA MENSAGEM DA CONVERSA - SEM HISTÓRICO ANTERIOR")
    }

    // Check if we have any information to work with
    if (relevantDocuments.length === 0 && !wikipediaInfo) {
      console.log("📭 No relevant documents or Wikipedia info found - generating prophet-like response")

      const noDocumentsResponse = generateNoDocumentsResponse(lastUserMessage.content, false)

      // Create the assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: noDocumentsResponse,
        timestamp: new Date().toISOString(),
      }

      // Add assistant message to the conversation
      const updatedMessages = [...messages, assistantMessage]

      // Save conversation if userId is provided
      if (userId && userId !== "null" && userId !== "anonymous") {
        console.log("💾 Attempting to save conversation...")
        const saveResult = await saveConversationDirectly(userId, updatedMessages, conversationId)

        return NextResponse.json({
          message: noDocumentsResponse,
          conversationId: saveResult.success ? saveResult.conversationId || conversationId : conversationId,
          saved: saveResult.success,
          documentsUsed: 0,
          documentsUsedTitles: [],
          wikipediaUsed: false,
        })
      }

      return NextResponse.json({
        message: noDocumentsResponse,
        conversationId: conversationId,
        saved: false,
        documentsUsed: 0,
        documentsUsedTitles: [],
        wikipediaUsed: false,
      })
    }

    let contextInfo = ""
    let sourcesUsedInfo = ""

    // Add analyzed documents context with detailed information and paragraph numbering
    if (relevantDocuments.length > 0) {
      console.log(`✅ Found ${relevantDocuments.length} relevant documents from database analysis`)
      contextInfo += "\n\n=== DOCUMENTOS RELEVANTES DA BASE DE DADOS ===\n"
      contextInfo += `Total de documentos analisados: ${relevantDocuments.length}\n`
      contextInfo += "Pergunta do usuário: " + lastUserMessage.content + "\n\n"
      sourcesUsedInfo += "\n\n---\n**Fontes da base de dados utilizadas para esta resposta:**\n"

      relevantDocuments.forEach((doc, index) => {
        const documentTitle = doc.title || `Documento ${index + 1}`
        contextInfo += `--- DOCUMENTO: "${documentTitle}" ---\n`
        contextInfo += `Tipo: ${doc.type}\n`
        contextInfo += `Pontuação de Relevância: ${doc.relevanceScore}\n`
        contextInfo += `Correspondências Encontradas: ${doc.matchDetails.join("; ")}\n`
        if (doc.file_url) {
          contextInfo += `URL do Arquivo: ${doc.file_url}\n`
        }
        contextInfo += `Data de Criação: ${new Date(doc.created_at).toLocaleDateString("pt-BR")}\n`
        contextInfo += `\nCONTEÚDO COMPLETO COM NUMERAÇÃO DE PARÁGRAFOS:\n`

        // Add paragraph numbering to content
        const paragraphs = doc.content.split(/\n\s*\n|\n{2,}/).filter((p) => p.trim().length > 0)
        paragraphs.forEach((paragraph, pIndex) => {
          const paragraphNumber = pIndex + 1
          contextInfo += `[PARÁGRAFO ${paragraphNumber}] ${paragraph.trim()}\n\n`
        })

        contextInfo += `--- FIM DO DOCUMENTO: "${documentTitle}" ---\n\n`

        sourcesUsedInfo += `- "${documentTitle}" (Relevância: ${doc.relevanceScore})`
        if (doc.file_url) {
          sourcesUsedInfo += ` - ${doc.file_url}`
        }
        sourcesUsedInfo += "\n"
      })

      contextInfo += "=== FIM DOS DOCUMENTOS DA BASE DE DADOS ===\n"
    }

    // Add Wikipedia context
    if (wikipediaInfo) {
      console.log("✅ Adding Wikipedia information to context")
      contextInfo += "\n\n=== INFORMAÇÕES BIOGRÁFICAS DE WILLIAM BRANHAM (Wikipedia) ===\n"
      contextInfo += `TÍTULO: ${wikipediaInfo.title}\n`
      contextInfo += `URL: ${wikipediaInfo.url}\n`
      contextInfo += `CONTEÚDO BIOGRÁFICO:\n${wikipediaInfo.content}\n`
      contextInfo += "=== FIM DAS INFORMAÇÕES BIOGRÁFICAS ===\n"

      if (!sourcesUsedInfo) {
        sourcesUsedInfo = "\n\n---\n**Fontes utilizadas para esta resposta:**\n"
      }
      sourcesUsedInfo += `- Informações biográficas da Wikipedia (${wikipediaInfo.url})\n`
    }

    contextInfo += `\n\nINSTRUÇÕES FINAIS PARA RESPOSTA:
1. LEIA E COMPREENDA profundamente TODO o contexto dos documentos fornecidos acima E no histórico da conversa atual
2. Identifique TODAS as informações relevantes para responder à pergunta: "${lastUserMessage.content}"
3. PRIMEIRO: Resposta natural, coerente e contextual baseada em TUDO que leu E no contexto da conversa
4. Use todo o conhecimento dos documentos E o histórico da conversa para criar uma resposta fluida e espiritual
5. MANTENHA A CONTINUIDADE: Se o usuário fez perguntas relacionadas anteriormente, faça referência a elas naturalmente
6. NÃO cite fontes no meio da resposta - mantenha o fluxo natural da conversa
7. DEPOIS: Adicione uma seção separada no final com as referências específicas

Utilize EXCLUSIVAMENTE as informações dos documentos analisados E o contexto da conversa atual. SEMPRE cite o TÍTULO COMPLETO do documento e o NÚMERO ESPECÍFICO DO PARÁGRAFO, mas APENAS na seção de referências no final. NUNCA use apenas "Documento 1" ou "Documento 2".`

    try {
      console.log("🤖 Calling Gemini API with enhanced document analysis...")
      console.log("🔗 Using model: gemini-2.0-flash")

      // Build the complete prompt with comprehensive context
      const completePrompt = `${systemPrompt}${conversationHistory}${contextInfo}\n\nPERGUNTA ESPECÍFICA DO USUÁRIO: ${lastUserMessage.content}\n\nCom base na análise completa de TODOS os documentos da base de dados fornecidos acima E no histórico da conversa atual, responda como o Profeta William Branham mantendo a continuidade e contexto da conversa. 

ESTRUTURA OBRIGATÓRIA:
1. PRIMEIRO: Resposta natural, coerente e contextual baseada em TUDO que leu E no contexto da conversa
2. Use todo o conhecimento dos documentos E o histórico da conversa para criar uma resposta fluida e espiritual
3. MANTENHA A CONTINUIDADE: Se o usuário fez perguntas relacionadas anteriormente, faça referência a elas naturalmente
4. NÃO cite fontes no meio da resposta - mantenha o fluxo natural da conversa
5. DEPOIS: Adicione uma seção separada no final com as referências específicas

Utilize EXCLUSIVAMENTE as informações dos documentos analisados E o contexto da conversa atual. SEMPRE cite o TÍTULO COMPLETO do documento e o NÚMERO ESPECÍFICO DO PARÁGRAFO, mas APENAS na seção de referências no final. NUNCA use apenas "Documento 1" ou "Documento 2".`

      // Call Gemini API with the CORRECT MODEL: gemini-2.0-flash
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
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
                    text: completePrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2, // Very low temperature for precise, contextual responses
              topK: 10,
              topP: 0.7,
              maxOutputTokens: 2000,
            },
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Gemini API Error:", response.status, errorText)

        // Enhanced error handling with more specific messages
        let errorMessage = ""

        if (response.status === 400) {
          errorMessage = `❌ Chave da API do Gemini inválida ou malformada.

🔍 DIAGNÓSTICO:
- Status: Formato inválido
- Chave usada: ${geminiApiKey?.substring(0, 15)}...

📋 SOLUÇÕES:
1. Obtenha uma nova chave em: https://aistudio.google.com/app/apikey
2. Configure no Vercel: Settings → Environment Variables → GEMINI_API_KEY
3. Ou execute o script SQL para atualizar no banco de dados`
        } else if (response.status === 403) {
          errorMessage = `❌ Acesso negado à API do Gemini.

🔍 POSSÍVEIS CAUSAS:
- Chave suspensa ou sem permissões
- Quota excedida
- Região não suportada

📋 SOLUÇÕES:
1. Verifique o status da chave em: https://aistudio.google.com/app/apikey
2. Gere uma nova chave se necessário
3. Configure no Vercel ou execute o script SQL`
        } else if (response.status === 404) {
          errorMessage = `❌ Modelo Gemini não encontrado.

🔍 DETALHES:
- Modelo usado: gemini-2.0-flash
- Status: ${response.status}

📋 SOLUÇÕES:
1. Verifique se a chave tem acesso ao modelo gemini-2.0-flash
2. Tente uma nova chave da API`
        } else if (response.status === 429) {
          errorMessage = `❌ Quota da API do Gemini excedida.

🔍 DETALHES:
- Muitas requisições em pouco tempo
- Limite de quota atingido

📋 SOLUÇÕES:
1. Aguarde alguns minutos antes de tentar novamente
2. Configure uma chave com quota maior
3. Verifique os limites em: https://aistudio.google.com/app/apikey`
        } else {
          errorMessage = `❌ Erro na API do Gemini (${response.status}).

🔍 DETALHES:
- Status: ${response.status}
- Resposta: ${errorText.substring(0, 200)}...

📋 SOLUÇÕES:
1. Verifique a configuração da chave
2. Tente novamente em alguns minutos
3. Configure uma nova chave se o problema persistir`
        }

        return NextResponse.json({ error: errorMessage }, { status: response.status })
      }

      const geminiResponse = await response.json()
      console.log("✅ Gemini response received successfully")

      let aiResponse = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text

      if (!aiResponse) {
        console.error("❌ No response text from Gemini")
        aiResponse = "Irmão/irmã, não consegui gerar uma resposta no momento. Que o Senhor te abençoe."
      }

      // Add sources citations to the response if not already included
      if ((relevantDocuments.length > 0 || wikipediaInfo) && !aiResponse.includes("Fontes utilizadas")) {
        aiResponse += sourcesUsedInfo
      }

      console.log("📝 AI Response length:", aiResponse.length)
      console.log("📚 Documents analyzed and used:", relevantDocuments.length)
      console.log("📖 Wikipedia used:", !!wikipediaInfo)

      // Create the assistant message
      const assistantMessage: Message = {
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      }

      // Add assistant message to the conversation
      const updatedMessages = [...messages, assistantMessage]

      // Save conversation if userId is provided
      if (userId && userId !== "null" && userId !== "anonymous") {
        console.log("💾 Attempting to save conversation...")

        const saveResult = await saveConversationDirectly(userId, updatedMessages, conversationId)

        if (saveResult.success) {
          console.log("✅ SAVE SUCCESSFUL!")
          return NextResponse.json({
            message: aiResponse,
            conversationId: saveResult.conversationId || conversationId,
            saved: true,
            documentsUsed: relevantDocuments.length,
            documentsUsedTitles: relevantDocuments.map((doc) => doc.title),
            wikipediaUsed: !!wikipediaInfo,
          })
        } else {
          console.error("❌ SAVE FAILED:", saveResult.error)
          // Still return the AI response even if save failed
          return NextResponse.json({
            message: aiResponse,
            conversationId: conversationId,
            saved: false,
            saveError: saveResult.error,
            documentsUsed: relevantDocuments.length,
            documentsUsedTitles: relevantDocuments.map((doc) => doc.title),
            wikipediaUsed: !!wikipediaInfo,
          })
        }
      }

      // Return response without saving
      console.log("⚠️ Not saving - no valid user ID")
      return NextResponse.json({
        message: aiResponse,
        conversationId: conversationId,
        saved: false,
        documentsUsed: relevantDocuments.length,
        documentsUsedTitles: relevantDocuments.map((doc) => doc.title),
        wikipediaUsed: !!wikipediaInfo,
      })
    } catch (geminiError: any) {
      console.error("❌ Gemini API Error:", geminiError)

      // Return a fallback response when API fails
      const fallbackResponse = `Amém, irmão/irmã. Neste momento estou enfrentando dificuldades técnicas para responder sua pergunta. 

Mas lembre-se das palavras do Senhor: "Buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas." (Mateus 6:33)

Busque a resposta na Palavra de Deus, pois Ela é a nossa fonte de toda verdade e sabedoria.

Que o Senhor te abençoe e te guarde. Amém.`

      // Create the assistant message with fallback
      const assistantMessage: Message = {
        role: "assistant",
        content: fallbackResponse,
        timestamp: new Date().toISOString(),
      }

      // Add assistant message to the conversation
      const updatedMessages = [...messages, assistantMessage]

      // Try to save even the fallback response
      if (userId && userId !== "null" && userId !== "anonymous") {
        console.log("💾 Attempting to save fallback response...")
        const saveResult = await saveConversationDirectly(userId, updatedMessages, conversationId)

        return NextResponse.json({
          message: fallbackResponse,
          conversationId: saveResult.success ? saveResult.conversationId || conversationId : conversationId,
          saved: saveResult.success,
          isError: true,
          error: "Problema temporário com a API. Resposta padrão fornecida.",
          documentsUsed: 0,
          documentsUsedTitles: [],
          wikipediaUsed: false,
        })
      }

      return NextResponse.json({
        message: fallbackResponse,
        conversationId: conversationId,
        saved: false,
        isError: true,
        error: "Problema temporário com a API. Resposta padrão fornecida.",
        documentsUsed: 0,
        documentsUsedTitles: [],
        wikipediaUsed: false,
      })
    }
  } catch (error) {
    console.error("💥 CHAT API ERROR:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
