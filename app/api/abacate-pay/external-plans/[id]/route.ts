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
  interval: 'monthly' | 'yearly' | 'one_time'
  features: string[]
  external_link: string
  external_id: string
  provider: string
  status: 'active' | 'inactive'
  ui_config?: {
    customTitle?: string
    customDescription?: string
    backgroundColor?: string
    textColor?: string
    buttonColor?: string
    icon?: string
    highlight?: boolean
  }
}

// PUT - Atualizar plano externo específico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID do plano é obrigatório' },
        { status: 400 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}
    
    if (body.name) updateData.name = body.name
    if (body.description) updateData.description = body.description
    if (body.price !== undefined) updateData.price = parseFloat(body.price.toString())
    if (body.currency) updateData.currency = body.currency
    if (body.interval) updateData.interval = body.interval
    if (body.features) updateData.features = body.features
    if (body.external_link) {
      try {
        new URL(body.external_link)
        updateData.external_link = body.external_link
      } catch {
        return NextResponse.json(
          { error: 'Link externo deve ser uma URL válida' },
          { status: 400 }
        )
      }
    }
    if (body.external_id) updateData.external_id = body.external_id
    if (body.provider) updateData.provider = body.provider
    if (body.status) updateData.status = body.status

    // Atualizar metadados de UI se fornecidos
    if (body.ui_config) {
      const currentPlan = await supabase
        .from('external_payment_links')
        .select('metadata')
        .eq('id', id)
        .single()

      const currentMetadata = currentPlan.data?.metadata || {}
      updateData.metadata = {
        ...currentMetadata,
        ...body.ui_config
      }
    }

    // Atualizar timestamp
    updateData.updated_at = new Date().toISOString()

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

    if (!updatedPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
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

// DELETE - Remover plano externo específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do plano é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o plano existe antes de deletar
    const { data: existingPlan, error: checkError } = await supabase
      .from('external_payment_links')
      .select('id, name')
      .eq('id', id)
      .single()

    if (checkError || !existingPlan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Deletar o plano
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
      message: 'Plano externo removido com sucesso',
      deletedPlan: existingPlan
    })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Buscar plano externo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do plano é obrigatório' },
        { status: 400 }
      )
    }

    const { data: plan, error } = await supabase
      .from('external_payment_links')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(plan)

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}