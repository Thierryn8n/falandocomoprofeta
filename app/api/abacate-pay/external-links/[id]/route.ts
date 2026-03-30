import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// PUT - Atualizar link externo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const {
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
      metadata
    } = body

    // Validações básicas
    if (!name || !external_link) {
      return NextResponse.json(
        { error: 'Nome e link externo são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: link, error } = await getSupabaseAdmin()
      .from('external_payment_links')
      .update({
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
        updated_at: new Date().toISOString()
      })
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
    console.error('Error in PUT /api/abacate-pay/external-links/[id]:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar link externo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
    console.error('Error in DELETE /api/abacate-pay/external-links/[id]:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}