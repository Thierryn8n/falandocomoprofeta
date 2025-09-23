import { supabase } from "@/lib/supabase"

interface AIVerificationResult {
  geminiConfigured: boolean
  elevenlabsConfigured: boolean
  supabaseConfigured: boolean
  databaseConnected: boolean
  errors: string[]
  warnings: string[]
}

export async function verifyAIConfiguration(): Promise<AIVerificationResult> {
  const result: AIVerificationResult = {
    geminiConfigured: false,
    elevenlabsConfigured: false,
    supabaseConfigured: false,
    databaseConnected: false,
    errors: [],
    warnings: [],
  }

  try {
    // Check Gemini API configuration
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey && geminiApiKey.length > 10) {
      result.geminiConfigured = true
    } else {
      result.errors.push("GEMINI_API_KEY não configurada ou inválida")
    }

    // Check ElevenLabs API configuration
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY
    if (elevenlabsApiKey && elevenlabsApiKey.length > 10) {
      result.elevenlabsConfigured = true
    } else {
      result.warnings.push("ELEVENLABS_API_KEY não configurada - funcionalidade de áudio desabilitada")
    }

    // Check Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseAnonKey) {
      result.supabaseConfigured = true

      // Test database connection
      try {
        const { data, error } = await supabase.from("profiles").select("count").limit(1)

        if (!error) {
          result.databaseConnected = true
        } else {
          result.errors.push(`Erro de conexão com banco: ${error.message}`)
        }
      } catch (dbError) {
        result.errors.push(`Erro ao testar conexão: ${dbError}`)
      }
    } else {
      result.errors.push("Configuração do Supabase incompleta")
    }

    return result
  } catch (error) {
    result.errors.push(`Erro na verificação: ${error}`)
    return result
  }
}
