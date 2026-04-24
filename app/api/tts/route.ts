import { NextRequest, NextResponse } from "next/server"
import textToSpeech from "@google-cloud/text-to-speech"

// Google Cloud Text-to-Speech API
// Requer GOOGLE_TTS_API_KEY no .env.local

const client = new textToSpeech.TextToSpeechClient({
  apiKey: process.env.GOOGLE_TTS_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text, voice = "pt-BR-Neural2-B", speed = 1 } = await request.json()

    // Verificar se API Key está configurada
    if (!process.env.GOOGLE_TTS_API_KEY) {
      console.log("[API TTS] GOOGLE_TTS_API_KEY não configurada")
      return NextResponse.json({
        success: false,
        error: "API Key não configurada",
        message: "Adicione GOOGLE_TTS_API_KEY ao .env.local",
        useFallback: true,
      })
    }

    console.log("[API TTS] Gerando áudio para voz:", voice)

    const request_tts = {
      input: { text },
      voice: {
        languageCode: "pt-BR",
        name: voice,
        ssmlGender: "NEUTRAL" as const,
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
        speakingRate: speed,
        pitch: 0,
      },
    }

    const [response] = await client.synthesizeSpeech(request_tts)
    const audioBase64 = response.audioContent?.toString("base64")

    if (!audioBase64) {
      throw new Error("Áudio não gerado")
    }

    console.log("[API TTS] Áudio gerado com sucesso")

    return NextResponse.json({
      success: true,
      audioBase64,
      voice,
    })

  } catch (error) {
    console.error("[API TTS] Erro:", error)
    return NextResponse.json({
      success: false,
      error: "Erro ao gerar áudio",
      message: error instanceof Error ? error.message : "Erro desconhecido",
      useFallback: true,
    })
  }
}
