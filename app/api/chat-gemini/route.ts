import type { NextRequest } from "next/server"

export const maxDuration = 30

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
    const { messages } = await req.json()

    // Usar variável de ambiente para a API key
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("GEMINI_API_KEY não encontrada nas variáveis de ambiente")
      return new Response("Erro de configuração da API", { status: 500 })
    }

    // Construir o histórico de mensagens para o Gemini
    const contents = messages.map((message: any) => ({
      parts: [{ text: message.role === "system" ? SYSTEM_PROMPT : message.content }],
    }))

    // Adicionar o system prompt no início
    contents.unshift({
      parts: [{ text: SYSTEM_PROMPT }],
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
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao gerar resposta"

    return new Response(generatedText, {
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Erro na API do Gemini:", error)
    return new Response("Erro interno do servidor", { status: 500 })
  }
}
