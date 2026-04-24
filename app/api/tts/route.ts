import { NextRequest, NextResponse } from "next/server"

// Fallback para Web Speech API no cliente
// Esta API pode ser expandida para usar Google Cloud TTS

export async function POST(request: NextRequest) {
  try {
    const { text, voice = "pt-BR-Neural2-B", speed = 1 } = await request.json()

    // Por padrão, retornamos um erro indicando que precisa configurar o Google TTS
    // Descomente e configure abaixo quando tiver a API Key
    
    /* 
    // ===== CONFIGURAÇÃO GOOGLE CLOUD TTS =====
    // 1. Instale: npm install @google-cloud/text-to-speech
    // 2. Descomente este código
    // 3. Adicione GOOGLE_TTS_API_KEY ao .env.local
    
    import textToSpeech from "@google-cloud/text-to-speech"
    
    const client = new textToSpeech.TextToSpeechClient({
      apiKey: process.env.GOOGLE_TTS_API_KEY,
    })

    const request_tts = {
      input: { text },
      voice: {
        languageCode: "pt-BR",
        name: voice,
        ssmlGender: "NEUTRAL",
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
        speakingRate: speed,
        pitch: 0,
      },
    }

    const [response] = await client.synthesizeSpeech(request_tts)
    const audioBase64 = response.audioContent?.toString("base64")

    return NextResponse.json({
      success: true,
      audioBase64,
      voice,
    })
    */

    // Retorna informações sobre como configurar
    return NextResponse.json({
      success: false,
      error: "Google TTS não configurado",
      message: "Veja o tutorial TUTORIAL_GOOGLE_TTS.md",
      useFallback: true,
    })

  } catch (error) {
    console.error("TTS Error:", error)
    return NextResponse.json(
      { success: false, error: "Erro ao processar TTS" },
      { status: 500 }
    )
  }
}
