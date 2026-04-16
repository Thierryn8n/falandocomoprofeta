import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Sistema Anti-Fraude
interface FraudCheck {
  score: number // 0-100, menor é melhor
  flags: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

interface AnalysisResult {
  approved: boolean
  reason?: string
  fraudScore: number
  extractedData: {
    payerName?: string
    amount?: number
    pixKey?: string
    date?: string
    transactionId?: string
    bankName?: string
  }
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { donationId, receiptUrl, fileType, expectedAmount, expectedPayerName, expectedPixKey } = body

    // 1. Verificar se já existe análise para este comprovante
    const { data: existingAnalysis } = await supabaseAdmin
      .from('receipt_analysis')
      .select('*')
      .eq('receipt_url', receiptUrl)
      .eq('status', 'approved')
      .single()

    if (existingAnalysis) {
      // Comprovante já usado antes - possível fraude
      await logFraudAttempt(donationId, 'RECEIPT_REUSE', {
        originalDonation: existingAnalysis.donation_id,
        currentDonation: donationId
      })
      
      await updateDonationStatus(donationId, 'rejected', 'Comprovante já utilizado em outra doação')
      
      return NextResponse.json({
        approved: false,
        reason: 'Este comprovante já foi utilizado anteriormente',
        fraudScore: 95,
        confidence: 0.95
      })
    }

    // 2. Análise por IA (GPT-4 Vision)
    const analysis = await analyzeReceiptWithAI(receiptUrl, fileType)
    
    if (!analysis.extractedData) {
      await updateDonationStatus(donationId, 'rejected', 'Não foi possível ler o comprovante')
      return NextResponse.json({
        approved: false,
        reason: 'Não foi possível extrair dados do comprovante',
        fraudScore: 50,
        confidence: 0
      })
    }

    // 3. Verificações Anti-Fraude
    const fraudCheck = performFraudChecks(analysis, {
      expectedAmount,
      expectedPayerName,
      expectedPixKey,
      extractedData: analysis.extractedData
    })

    // 4. Salvar análise no banco
    await supabaseAdmin.from('receipt_analysis').insert({
      donation_id: donationId,
      receipt_url: receiptUrl,
      extracted_data: analysis.extractedData,
      confidence_score: analysis.confidence,
      fraud_score: fraudCheck.score,
      fraud_flags: fraudCheck.flags,
      risk_level: fraudCheck.riskLevel,
      ai_raw_response: analysis.rawResponse,
      status: fraudCheck.riskLevel === 'low' && analysis.confidence > 0.7 ? 'approved' : 'manual_review'
    })

    // 5. Decisão final
    if (fraudCheck.riskLevel === 'high' || fraudCheck.score > 70) {
      await updateDonationStatus(donationId, 'rejected', `Fraude detectada: ${fraudCheck.flags.join(', ')}`)
      return NextResponse.json({
        approved: false,
        reason: `Verificação de segurança: ${fraudCheck.flags[0]}`,
        fraudScore: fraudCheck.score,
        confidence: analysis.confidence
      })
    }

    if (fraudCheck.riskLevel === 'medium' || analysis.confidence < 0.7) {
      await updateDonationStatus(donationId, 'manual_review', 'Necessita revisão manual')
      return NextResponse.json({
        approved: false,
        reason: 'Comprovante enviado para revisão manual. Entraremos em contato em breve.',
        fraudScore: fraudCheck.score,
        confidence: analysis.confidence
      })
    }

    // 6. Aprovação automática
    await updateDonationStatus(donationId, 'approved', 'Pagamento validado por IA')
    await activateUserSubscription(donationId)

    return NextResponse.json({
      approved: true,
      fraudScore: fraudCheck.score,
      confidence: analysis.confidence,
      extractedData: analysis.extractedData
    })

  } catch (error) {
    console.error('Error analyzing receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function analyzeReceiptWithAI(receiptUrl: string, fileType: string): Promise<AnalysisResult & { rawResponse?: string }> {
  try {
    // Para imagens, usar GPT-4 Vision
    if (fileType.startsWith('image/')) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Você é um analisador de comprovantes PIX especializado em detectar fraudes.
            
Extraia as seguintes informações do comprovante:
1. Nome do pagador (payerName)
2. Valor exato (amount) - apenas números
3. Chave PIX destino (pixKey)
4. Data e hora da transação (date)
5. ID da transação / Código de autorização (transactionId)
6. Nome do banco (bankName)

Retorne APENAS um JSON válido no formato:
{
  "payerName": "string",
  "amount": number,
  "pixKey": "string",
  "date": "string",
  "transactionId": "string",
  "bankName": "string",
  "isPixComprovante": boolean,
  "confidence": number (0-1)
}

Se não for um comprovante PIX válido, retorne isPixComprovante: false.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analise este comprovante PIX:' },
              {
                type: 'image_url',
                image_url: {
                  url: receiptUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })

      const content = response.choices[0].message.content
      
      try {
        // Extrair JSON da resposta
        const jsonMatch = content?.match(/\{[\s\S]*\}/)
        const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : null

        if (!parsedData || !parsedData.isPixComprovante) {
          return {
            approved: false,
            reason: 'Não é um comprovante PIX válido',
            fraudScore: 100,
            confidence: 0,
            extractedData: {},
            rawResponse: content || ''
          }
        }

        return {
          approved: true,
          fraudScore: 0,
          confidence: parsedData.confidence || 0.5,
          extractedData: {
            payerName: parsedData.payerName,
            amount: typeof parsedData.amount === 'string' 
              ? parseFloat(parsedData.amount.replace(/[^\d.,]/g, '').replace(',', '.'))
              : parsedData.amount,
            pixKey: parsedData.pixKey,
            date: parsedData.date,
            transactionId: parsedData.transactionId,
            bankName: parsedData.bankName
          },
          rawResponse: content
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError)
        return {
          approved: false,
          reason: 'Erro ao interpretar comprovante',
          fraudScore: 50,
          confidence: 0,
          extractedData: {},
          rawResponse: content || ''
        }
      }
    }

    // Para PDFs, usar abordagem diferente (extract text first)
    return {
      approved: false,
      reason: 'Análise de PDF requer processamento adicional',
      fraudScore: 50,
      confidence: 0,
      extractedData: {}
    }

  } catch (error) {
    console.error('AI analysis error:', error)
    return {
      approved: false,
      reason: 'Erro na análise por IA',
      fraudScore: 50,
      confidence: 0,
      extractedData: {}
    }
  }
}

function performFraudChecks(
  analysis: AnalysisResult,
  expected: {
    expectedAmount: number
    expectedPayerName: string
    expectedPixKey: string
    extractedData: AnalysisResult['extractedData']
  }
): FraudCheck {
  const flags: string[] = []
  let score = 0

  // Check 1: Valor correto
  if (expected.extractedData.amount) {
    const amountDiff = Math.abs(expected.extractedData.amount - expected.expectedAmount)
    if (amountDiff > 0.01) {
      flags.push('VALOR_INCORRETO')
      score += 30
    }
  } else {
    flags.push('VALOR_NAO_ENCONTRADO')
    score += 40
  }

  // Check 2: Nome do pagador (fuzzy match)
  if (expected.extractedData.payerName) {
    const payerSimilarity = calculateSimilarity(
      expected.extractedData.payerName.toLowerCase(),
      expected.expectedPayerName.toLowerCase()
    )
    if (payerSimilarity < 0.7) {
      flags.push('NOME_PAGADOR_DIVERGENTE')
      score += 25
    }
  } else {
    flags.push('NOME_NAO_ENCONTRADO')
    score += 20
  }

  // Check 3: Chave PIX
  if (expected.extractedData.pixKey) {
    if (!expected.extractedData.pixKey.includes(expected.expectedPixKey)) {
      flags.push('CHAVE_PIX_DIVERGENTE')
      score += 35
    }
  }

  // Check 4: Data da transação (não pode ser no futuro)
  if (expected.extractedData.date) {
    const txDate = new Date(expected.extractedData.date)
    const now = new Date()
    if (txDate > now) {
      flags.push('DATA_FUTURA')
      score += 50
    }
    // Não pode ter mais de 7 dias
    const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 7) {
      flags.push('COMPROVANTE_ANTIGO')
      score += 15
    }
  }

  // Check 5: Confiança da IA
  if (analysis.confidence < 0.6) {
    flags.push('BAIXA_CONFIANCA_IA')
    score += 20
  }

  // Determinar nível de risco
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (score > 50) riskLevel = 'high'
  else if (score > 25) riskLevel = 'medium'

  return {
    score,
    flags,
    riskLevel
  }
}

function calculateSimilarity(str1: string, str2: string): number {
  // Implementação simples de similaridade (Levenshtein-like)
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

async function logFraudAttempt(donationId: string, type: string, details: object) {
  await supabaseAdmin.from('fraud_attempts').insert({
    donation_id: donationId,
    attempt_type: type,
    details: details,
    detected_at: new Date().toISOString()
  })
}

async function updateDonationStatus(donationId: string, status: string, notes: string) {
  await supabaseAdmin
    .from('user_donations')
    .update({
      status: status,
      notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', donationId)
}

async function activateUserSubscription(donationId: string) {
  // Buscar doação
  const { data: donation } = await supabaseAdmin
    .from('user_donations')
    .select('payer_email, amount')
    .eq('id', donationId)
    .single()

  if (!donation) return

  // Buscar usuário
  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', donation.payer_email)
    .single()

  if (!user) return

  // Ativar assinatura (exemplo: 1 mês para cada R$ 10)
  const months = Math.floor(donation.amount / 10)
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  await supabaseAdmin.from('user_subscriptions').insert({
    user_id: user.id,
    status: 'active',
    plan: 'donation',
    amount: donation.amount,
    currency: 'BRL',
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    metadata: {
      donation_id: donationId,
      source: 'pix_direct'
    }
  })
}
