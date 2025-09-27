import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, model } = await req.json()

    switch (provider) {
      case "openai":
        return await testOpenAI(apiKey, model)
      case "gemini":
        return await testGemini(apiKey, model)
      case "psyche":
        return await testPsyche(apiKey, model)
      case "tts":
        return await testTTS(apiKey)
      default:
        return NextResponse.json({ success: false, error: "Provider não suportado" })
    }
  } catch (error) {
    console.error("Erro ao testar API:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" })
  }
}

async function testOpenAI(apiKey: string, model: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 5,
      }),
    })

    if (response.ok) {
      return NextResponse.json({ success: true, message: "OpenAI conectado com sucesso" })
    } else {
      return NextResponse.json({ success: false, error: "Chave de API inválida" })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro de conexão com OpenAI" })
  }
}

async function testGemini(apiKey: string, model: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Test connection",
              },
            ],
          },
        ],
      }),
    })

    if (response.ok) {
      return NextResponse.json({ success: true, message: "Gemini conectado com sucesso" })
    } else {
      const errorData = await response.json()
      return NextResponse.json({ success: false, error: errorData.error?.message || "Chave de API inválida" })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro de conexão com Gemini" })
  }
}

async function testPsyche(apiKey: string, model: string) {
  try {
    // Fazendo uma chamada real para a API do Psyche
    const response = await fetch(`https://api.psyche.ai/v1/models/${model}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt: "Teste de conexão com a API"
      })
    })
    
    if (response.ok) {
      return NextResponse.json({ success: true, message: "Psyche AI conectado com sucesso" })
    } else {
      const errorData = await response.json()
      return NextResponse.json({ success: false, error: errorData.error?.message || "Erro na conexão com Psyche AI" })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro de conexão com Psyche AI" })
  }
}

async function testTTS(apiKey: string) {
  try {
    // Fazendo uma chamada real para a API do ElevenLabs
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "xi-api-key": apiKey
      }
    })
    
    if (response.ok) {
      return NextResponse.json({ success: true, message: "TTS conectado com sucesso" })
    } else {
      const errorData = await response.json()
      return NextResponse.json({ success: false, error: errorData.detail?.message || "Chave de API inválida para TTS" })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro de conexão com serviço TTS" })
  }
}
