import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET - Listar links externos
export async function GET() {
  try {
    const { data: links, error } = await getSupabaseAdmin()
      .from('external_payment_links')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching external links:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar links externos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: links || []
    })

  } catch (error) {
    console.error('Error in GET /api/abacate-pay/external-links:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo link externo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      currency = 'BRL',
      interval,
      features = [],
      external_link,
      external_id,
      provider,
      status = 'active',
      sort_order = 0,
      metadata = {}
    } = body

    // Validações básicas
    if (!name || !external_link || !provider) {
      return NextResponse.json(
        { error: 'Nome, link externo e provedor são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: link, error } = await getSupabaseAdmin()
      .from('external_payment_links')
      .insert({
        name,
        description,
        price,
        currency,
        interval,
        features,
        external_link,
        external_id,
        provider,
        status,
        sort_order,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating external link:', error)
      return NextResponse.json(
        { error: 'Erro ao criar link externo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: link
    })

  } catch (error) {
    console.error('Error in POST /api/abacate-pay/external-links:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar link externo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para atualização' },
        { status: 400 }
      )
    }

    // Adicionar timestamp de atualização
    updateData.updated_at = new Date().toISOString()

    const { data: link, error } = await getSupabaseAdmin()
      .from('external_payment_links')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating external link:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar link externo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: link
    })

  } catch (error) {
    console.error('Error in PUT /api/abacate-pay/external-links:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar link externo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para exclusão' },
        { status: 400 }
      )
    }

    const { error } = await getSupabaseAdmin()
      .from('external_payment_links')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting external link:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar link externo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Link externo deletado com sucesso'
    })

  } catch (error) {
    console.error('Error in DELETE /api/abacate-pay/external-links:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}