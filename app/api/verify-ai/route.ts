import { verifyAIConfiguration } from "@/lib/ai-verification"

export async function GET() {
  try {
    const verification = await verifyAIConfiguration()

    return Response.json({
      success: true,
      verification,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Erro na verificação da IA:", error)

    return Response.json(
      {
        success: false,
        error: "Erro ao verificar configuração da IA",
        details: error,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return GET() // Mesmo comportamento para POST
}
