import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: products, error } = await getSupabaseAdmin()
      .from('mercado_pago_products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar produtos do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
    }

    return NextResponse.json(products || [])
  } catch (error) {
    console.error('Erro ao buscar produtos do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const product = await request.json()
    const supabase = createClient()

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

    const { data, error } = await getSupabaseAdmin()
      .from('mercado_pago_products')
      .insert({
        title: product.title,
        description: product.description || '',
        price: product.price,
        currency: product.currency || 'BRL',
        category_id: product.category_id || '',
        picture_url: product.picture_url || '',
        status: product.status || 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar produto do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao processar produto do Mercado Pago:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const product = await request.json()
    const supabase = createClient()

    if (!product.id) {
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

    const { data, error } = await getSupabaseAdmin()
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
      .eq('id', product.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar produto do Mercado Pago:', error)
      return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao processar atualização do produto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { error } = await getSupabaseAdmin()
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