import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role key para operações administrativas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Interface para o cliente do Abacate Pay
interface AbacatePayCustomer {
  id: string
  metadata: {
    name?: string
    cellphone?: string
    taxId?: string
    email: string
  }
}

// Interface para criar cliente
interface CreateCustomerRequest {
  name?: string
  cellphone?: string
  email: string
  taxId?: string
  apiKey: string
}

// Interface para buscar cliente
interface GetCustomerRequest {
  email: string
  apiKey: string
}

export async function POST(request: NextRequest) {
  try {
    const { name, cellphone, email, taxId, apiKey } = await request.json() as CreateCustomerRequest

    if (!email || !apiKey) {
      return NextResponse.json(
        { error: 'Email e API Key são obrigatórios' },
        { status: 400 }
      )
    }

    // Primeiro, verificar se o cliente já existe no nosso banco
    const { data: existingCustomer } = await supabase
      .from('abacate_pay_customers')
      .select('*')
      .eq('email', email)
      .single()

    if (existingCustomer) {
      return NextResponse.json({
        success: true,
        customer: {
          id: existingCustomer.abacate_customer_id,
          metadata: {
            name: existingCustomer.name,
            cellphone: existingCustomer.cellphone,
            taxId: existingCustomer.tax_id,
            email: existingCustomer.email
          }
        },
        isExisting: true
      })
    }

    // Criar cliente no Abacate Pay
    const abacateCustomer = await createAbacatePayCustomer({
      name,
      cellphone,
      email,
      taxId,
      apiKey
    })

    if (!abacateCustomer.success) {
      return NextResponse.json(
        { error: abacateCustomer.error || 'Erro ao criar cliente no Abacate Pay' },
        { status: 400 }
      )
    }

    // Salvar cliente no nosso banco de dados
    const { data: savedCustomer, error: saveError } = await supabase
      .from('abacate_pay_customers')
      .insert({
        abacate_customer_id: abacateCustomer.customer.id,
        email: email,
        name: name || null,
        cellphone: cellphone || null,
        tax_id: taxId || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving customer:', saveError)
      // Mesmo com erro ao salvar, retornamos o cliente criado no Abacate Pay
    }

    return NextResponse.json({
      success: true,
      customer: abacateCustomer.customer,
      isExisting: false
    })

  } catch (error) {
    console.error('Customer creation error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const apiKey = searchParams.get('apiKey')

    if (!email || !apiKey) {
      return NextResponse.json(
        { error: 'Email e API Key são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar cliente no nosso banco primeiro
    const { data: localCustomer } = await supabase
      .from('abacate_pay_customers')
      .select('*')
      .eq('email', email)
      .single()

    if (localCustomer) {
      return NextResponse.json({
        success: true,
        customer: {
          id: localCustomer.abacate_customer_id,
          metadata: {
            name: localCustomer.name,
            cellphone: localCustomer.cellphone,
            taxId: localCustomer.tax_id,
            email: localCustomer.email
          }
        }
      })
    }

    // Se não encontrar localmente, buscar no Abacate Pay
    const abacateCustomers = await listAbacatePayCustomers(apiKey)
    
    if (!abacateCustomers.success) {
      return NextResponse.json(
        { error: abacateCustomers.error || 'Erro ao buscar clientes no Abacate Pay' },
        { status: 400 }
      )
    }

    // Procurar cliente pelo email
    const customer = abacateCustomers.customers.find(
      (c: AbacatePayCustomer) => c.metadata.email === email
    )

    if (customer) {
      // Salvar cliente encontrado no nosso banco
      await supabase
        .from('abacate_pay_customers')
        .insert({
          abacate_customer_id: customer.id,
          email: customer.metadata.email,
          name: customer.metadata.name || null,
          cellphone: customer.metadata.cellphone || null,
          tax_id: customer.metadata.taxId || null,
          created_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: true,
        customer: customer
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Cliente não encontrado'
    }, { status: 404 })

  } catch (error) {
    console.error('Customer search error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para criar cliente no Abacate Pay
async function createAbacatePayCustomer({
  name,
  cellphone,
  email,
  taxId,
  apiKey
}: CreateCustomerRequest) {
  try {
    const response = await fetch('https://api.abacatepay.com/v1/customer/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name || undefined,
        cellphone: cellphone || undefined,
        email: email,
        taxId: taxId || undefined
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Abacate Pay Customer API error:', errorData)
      return {
        success: false,
        error: errorData.message || `Erro na API do Abacate Pay: ${response.status}`
      }
    }

    const customerData = await response.json()
    
    if (customerData.error) {
      return {
        success: false,
        error: customerData.error
      }
    }

    return {
      success: true,
      customer: customerData.data
    }

  } catch (error) {
    console.error('Error calling Abacate Pay Customer API:', error)
    return {
      success: false,
      error: 'Erro na comunicação com Abacate Pay'
    }
  }
}

// Função para listar clientes do Abacate Pay
async function listAbacatePayCustomers(apiKey: string) {
  try {
    const response = await fetch('https://api.abacatepay.com/v1/customer/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Abacate Pay Customer List API error:', errorData)
      return {
        success: false,
        error: errorData.message || `Erro na API do Abacate Pay: ${response.status}`
      }
    }

    const customersData = await response.json()
    
    if (customersData.error) {
      return {
        success: false,
        error: customersData.error
      }
    }

    return {
      success: true,
      customers: customersData.data || []
    }

  } catch (error) {
    console.error('Error calling Abacate Pay Customer List API:', error)
    return {
      success: false,
      error: 'Erro na comunicação com Abacate Pay'
    }
  }
}