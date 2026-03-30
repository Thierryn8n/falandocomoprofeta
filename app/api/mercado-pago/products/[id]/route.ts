import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const product = await request.json()
    const supabase = createClient()
    const { id: productId } = await params

    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Validação básica
    if (!product.title || !product.price) {
      return NextResponse.json(
        { error: 'Título e preço são obrigatórios' },
        { status: 400 }
      )
    }

    if (product.price <= 0) {
      return NextResponse.json(
        { error: 'Preço deve ser maior que zero' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('mercado_pago_products')
      .update({
        title: product.title,
        description: product.description || '',
        price: product.price,
        currency: product.currency || 'BRL',
        category_id: product.category_id || '',
        picture_url: product.picture_url || '',
        status: product.status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar produto do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao processar atualização do produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id: productId } = await params

    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('mercado_pago_products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Erro ao deletar produto do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao processar deleção do produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}