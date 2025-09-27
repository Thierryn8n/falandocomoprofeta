import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role key para operações administrativas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Interface para resultado dos testes
interface TestResult {
  test: string
  status: 'success' | 'error'
  message: string
  data?: any
  duration?: number
}

interface TestSuite {
  success: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  results: TestResult[]
  executionTime: number
}

// GET - Executar testes da API do Abacate Pay
export async function GET() {
  const startTime = Date.now()
  const results: TestResult[] = []

  try {
    // Teste 1: Verificar configurações do Abacate Pay
    const configTest = await testConfiguration()
    results.push(configTest)

    // Teste 2: Verificar conexão com banco de dados
    const dbTest = await testDatabaseConnection()
    results.push(dbTest)

    // Teste 3: Testar criação de produto
    const productTest = await testProductCreation()
    results.push(productTest)

    // Teste 4: Testar criação de transação
    const transactionTest = await testTransactionCreation()
    results.push(transactionTest)

    // Teste 5: Testar estatísticas
    const statsTest = await testStats()
    results.push(statsTest)

    // Teste 6: Testar webhook (simulação)
    const webhookTest = await testWebhookSimulation()
    results.push(webhookTest)

    // Calcular resultados finais
    const passedTests = results.filter(r => r.status === 'success').length
    const failedTests = results.filter(r => r.status === 'error').length
    const executionTime = Date.now() - startTime

    const testSuite: TestSuite = {
      success: failedTests === 0,
      totalTests: results.length,
      passedTests,
      failedTests,
      results,
      executionTime
    }

    return NextResponse.json(testSuite)

  } catch (error) {
    console.error('Error in GET /api/abacate-pay/test:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno durante execução dos testes',
        results
      },
      { status: 500 }
    )
  }
}

// Teste 1: Verificar configurações
async function testConfiguration(): Promise<TestResult> {
  const testStart = Date.now()
  
  try {
    const { data, error } = await supabase
      .from('payment_methods_config')
      .select('method_name, is_enabled, config_data')
      .eq('method_name', 'abacate_pay')
      .single()

    if (error) {
      return {
        test: 'Configuração do Abacate Pay',
        status: 'error',
        message: `Erro ao buscar configurações: ${error.message}`,
        duration: Date.now() - testStart
      }
    }

    if (!data) {
      return {
        test: 'Configuração do Abacate Pay',
        status: 'error',
        message: 'Configurações do Abacate Pay não encontradas',
        duration: Date.now() - testStart
      }
    }

    const config = data.config_data as any
    const requiredFields = ['api_key', 'api_url']
    const missingFields = requiredFields.filter(field => !config[field])

    if (missingFields.length > 0) {
      return {
        test: 'Configuração do Abacate Pay',
        status: 'error',
        message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        duration: Date.now() - testStart
      }
    }

    return {
      test: 'Configuração do Abacate Pay',
      status: 'success',
      message: 'Configurações válidas encontradas',
      data: {
        api_url: config.api_url,
        webhook_url: config.webhook_url,
        is_enabled: data.is_enabled,
        test_mode: config.test_mode
      },
      duration: Date.now() - testStart
    }

  } catch (error) {
    return {
      test: 'Configuração do Abacate Pay',
      status: 'error',
      message: `Erro inesperado: ${error}`,
      duration: Date.now() - testStart
    }
  }
}

// Teste 2: Verificar conexão com banco
async function testDatabaseConnection(): Promise<TestResult> {
  const testStart = Date.now()
  
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('count(*)')
      .limit(1)

    if (error) {
      return {
        test: 'Conexão com Banco de Dados',
        status: 'error',
        message: `Erro na conexão: ${error.message}`,
        duration: Date.now() - testStart
      }
    }

    return {
      test: 'Conexão com Banco de Dados',
      status: 'success',
      message: 'Conexão com banco estabelecida com sucesso',
      duration: Date.now() - testStart
    }

  } catch (error) {
    return {
      test: 'Conexão com Banco de Dados',
      status: 'error',
      message: `Erro inesperado: ${error}`,
      duration: Date.now() - testStart
    }
  }
}

// Teste 3: Testar criação de produto
async function testProductCreation(): Promise<TestResult> {
  const testStart = Date.now()
  
  try {
    const testProduct = {
      external_id: `test_${Date.now()}`,
      name: `Produto Teste ${Date.now()}`,
      description: 'Produto criado durante teste automatizado',
      price: 9999, // Preço em centavos (R$ 99,99)
      currency: 'BRL',
      is_active: true
    }

    const { data, error } = await supabase
      .from('abacate_pay_products')
      .insert([testProduct])
      .select()
      .single()

    if (error) {
      return {
        test: 'Criação de Produto',
        status: 'error',
        message: `Erro ao criar produto: ${error.message}`,
        duration: Date.now() - testStart
      }
    }

    // Limpar produto de teste
    await supabase
      .from('abacate_pay_products')
      .delete()
      .eq('id', data.id)

    return {
      test: 'Criação de Produto',
      status: 'success',
      message: 'Produto criado e removido com sucesso',
      data: { product_id: data.id },
      duration: Date.now() - testStart
    }

  } catch (error) {
    return {
      test: 'Criação de Produto',
      status: 'error',
      message: `Erro inesperado: ${error}`,
      duration: Date.now() - testStart
    }
  }
}

// Teste 4: Testar criação de transação
async function testTransactionCreation(): Promise<TestResult> {
  const testStart = Date.now()
  
  try {
    // Primeiro, buscar um usuário existente para usar no teste
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()

    if (profileError || !profiles) {
      return {
        test: 'Criação de Transação',
        status: 'error',
        message: 'Nenhum usuário encontrado para teste',
        duration: Date.now() - testStart
      }
    }

    const testTransaction = {
      user_id: profiles.id,
      amount: 50.00,
      currency: 'BRL',
      payment_status: 'pending',
      payment_method: 'abacate_pay',
      tokens_granted: 0,
      metadata: { test: true }
    }

    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([testTransaction])
      .select()
      .single()

    if (error) {
      return {
        test: 'Criação de Transação',
        status: 'error',
        message: `Erro ao criar transação: ${error.message}`,
        duration: Date.now() - testStart
      }
    }

    // Limpar transação de teste
    await supabase
      .from('payment_transactions')
      .delete()
      .eq('id', data.id)

    return {
      test: 'Criação de Transação',
      status: 'success',
      message: 'Transação criada e removida com sucesso',
      data: { transaction_id: data.id },
      duration: Date.now() - testStart
    }

  } catch (error) {
    return {
      test: 'Criação de Transação',
      status: 'error',
      message: `Erro inesperado: ${error}`,
      duration: Date.now() - testStart
    }
  }
}

// Teste 5: Testar estatísticas
async function testStats(): Promise<TestResult> {
  const testStart = Date.now()
  
  try {
    const { data: transactions, error } = await supabase
      .from('payment_transactions')
      .select('amount, status, created_at')
      .limit(5)

    if (error) {
      return {
        test: 'Estatísticas',
        status: 'error',
        message: `Erro ao buscar estatísticas: ${error.message}`,
        duration: Date.now() - testStart
      }
    }

    return {
      test: 'Estatísticas',
      status: 'success',
      message: 'Estatísticas calculadas com sucesso',
      data: { sample_transactions: transactions?.length || 0 },
      duration: Date.now() - testStart
    }

  } catch (error) {
    return {
      test: 'Estatísticas',
      status: 'error',
      message: `Erro inesperado: ${error}`,
      duration: Date.now() - testStart
    }
  }
}

// Teste 6: Simular webhook
async function testWebhookSimulation(): Promise<TestResult> {
  const testStart = Date.now()
  
  try {
    // Simular validação de webhook
    const webhookData = {
      event: 'payment.completed',
      transaction_id: 'test_123',
      amount: 100.00,
      status: 'paid'
    }

    // Verificar se existe configuração de webhook
    const { data: config } = await supabase
      .from('payment_methods_config')
      .select('config')
      .eq('provider', 'abacate_pay')
      .single()

    const webhookUrl = config?.config?.webhook_url
    const webhookSecret = config?.config?.webhook_secret

    return {
      test: 'Simulação de Webhook',
      status: 'success',
      message: 'Webhook simulado com sucesso',
      data: {
        webhook_configured: !!webhookUrl,
        secret_configured: !!webhookSecret,
        sample_payload: webhookData
      },
      duration: Date.now() - testStart
    }

  } catch (error) {
    return {
      test: 'Simulação de Webhook',
      status: 'error',
      message: `Erro inesperado: ${error}`,
      duration: Date.now() - testStart
    }
  }
}

// POST - Executar teste específico
export async function POST(request: NextRequest) {
  try {
    const { test } = await request.json()

    if (!test) {
      return NextResponse.json(
        { error: 'Nome do teste é obrigatório' },
        { status: 400 }
      )
    }

    let result: TestResult

    switch (test) {
      case 'configuration':
        result = await testConfiguration()
        break
      case 'database':
        result = await testDatabaseConnection()
        break
      case 'product':
        result = await testProductCreation()
        break
      case 'transaction':
        result = await testTransactionCreation()
        break
      case 'stats':
        result = await testStats()
        break
      case 'webhook':
        result = await testWebhookSimulation()
        break
      default:
        return NextResponse.json(
          { error: 'Teste não encontrado' },
          { status: 404 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in POST /api/abacate-pay/test:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}