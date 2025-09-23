import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY environment variable is not set")
      return NextResponse.json(
        {
          error: "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    if (!geminiApiKey.startsWith("AIza")) {
      console.error("Invalid Gemini API key format")
      return NextResponse.json(
        {
          error: "Invalid Gemini API key format. Please check your GEMINI_API_KEY environment variable.",
        },
        { status: 500 },
      )
    }

    // Convert audio file to base64
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString("base64")

    console.log("[v0] Making request to Gemini API with key:", geminiApiKey.substring(0, 10) + "...")

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
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
                    mime_type: "audio/webm",
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
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", response.status, response.statusText, errorText)

      if (response.status === 400 && errorText.includes("API key not valid")) {
        return NextResponse.json(
          {
            error: "Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable.",
            details: "The API key appears to be invalid or expired.",
          },
          { status: 400 },
        )
      }

      return NextResponse.json(
        {
          error: "Failed to transcribe audio",
          details: errorText,
        },
        { status: response.status },
      )
    }

    const result = await response.json()

    if (!result.candidates || result.candidates.length === 0) {
      console.error("No candidates in response:", result)
      return NextResponse.json({ error: "No transcription candidates received" }, { status: 500 })
    }

    const transcription = result.candidates[0]?.content?.parts?.[0]?.text

    if (!transcription) {
      console.error("No transcription text in response:", result)
      return NextResponse.json({ error: "No transcription received" }, { status: 500 })
    }

    return NextResponse.json({ text: transcription.trim() })
  } catch (error) {
    console.error("Speech-to-text error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
