import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ExternalPlan {
  id?: string
  name: string
  description: string
  price: number
  currency: string
  external_link: string
  status: 'active' | 'inactive'
}

// GET - Buscar todos os planos externos
export async function GET() {
  try {
    const { data: plans, error } = await supabase
      .from('external_payment_links')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar planos externos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar planos externos' },
        { status: 500 }
      )
    }

    return NextResponse.json(plans || [])
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo plano externo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, currency, external_link, status } = body as ExternalPlan

    // Validações básicas
    if (!name || !description || !price || !external_link) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, description, price, external_link' },
        { status: 400 }
      )
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: 'O preço deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Validar URL do link externo
    try {
      new URL(external_link)
    } catch {
      return NextResponse.json(
        { error: 'Link externo deve ser uma URL válida' },
        { status: 400 }
      )
    }

    const planData = {
      name,
      description,
      price: parseFloat(price.toString()),
      currency: currency || 'BRL',
      external_link,
      status: status || 'active'
    }

    const { data: newPlan, error } = await supabase
      .from('external_payment_links')
      .insert([planData])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar plano externo:', error)
      return NextResponse.json(
        { error: 'Erro ao criar plano externo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Plano externo criado com sucesso',
      plan: newPlan 
    }, { status: 201 })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar plano externo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, price, currency, external_link, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do plano é obrigatório' },
        { status: 400 }
      )
    }

    const updateData: Partial<ExternalPlan> = {}
    
    if (name) updateData.name = name
    if (description) updateData.description = description
    if (price) updateData.price = parseFloat(price.toString())
    if (currency) updateData.currency = currency
    if (external_link) {
      try {
        new URL(external_link)
        updateData.external_link = external_link
      } catch {
        return NextResponse.json(
          { error: 'Link externo deve ser uma URL válida' },
          { status: 400 }
        )
      }
    }
    if (status) updateData.status = status

    const { data: updatedPlan, error } = await supabase
      .from('external_payment_links')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar plano externo:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar plano externo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Plano externo atualizado com sucesso',
      plan: updatedPlan 
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover plano externo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do plano é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('external_payment_links')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao remover plano externo:', error)
      return NextResponse.json(
        { error: 'Erro ao remover plano externo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Plano externo removido com sucesso' 
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}