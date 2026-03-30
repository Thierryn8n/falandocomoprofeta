import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { createAbacatePayProduct, listAbacatePayProducts, AbacatePayProduct } from '@/lib/abacate-pay'

// Usar service role key para operações administrativas
const supabase = getSupabaseAdmin()

// GET - Listar produtos do Abacate Pay
export async function GET() {
  try {
    // Buscar configuração do Abacate Pay
    const { data: configData, error: configError } = await supabase
      .from('payment_methods_config')
      .select('config_data')
      .eq('method_name', 'abacate_pay')
      .eq('is_enabled', true)
      .single()

    if (configError || !configData) {
      return NextResponse.json(
        { error: 'Abacate Pay não está configurado ou habilitado' },
        { status: 400 }
      )
    }

    // Listar produtos diretamente do Abacate Pay
    const abacatePayProducts = await listAbacatePayProducts()

    return NextResponse.json({
      success: true,
      data: {
        products: abacatePayProducts
      }
    })

  } catch (error) {
    console.error('Erro ao listar produtos do Abacate Pay:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Sincronizar produto local com Abacate Pay
export async function POST(request: NextRequest) {
  try {
    const { product_id, sync_all } = await request.json()

    // Buscar configuração do Abacate Pay
    const { data: configData, error: configError } = await getSupabaseAdmin()
      .from('payment_methods_config')
      .select('config_data')
      .eq('method_name', 'abacate_pay')
      .eq('is_enabled', true)
      .single()

    if (configError || !configData) {
      return NextResponse.json(
        { error: 'Abacate Pay não está configurado ou habilitado' },
        { status: 400 }
      )
    }

    if (sync_all) {
      // Sincronizar todos os produtos
      const { data: localProducts, error: productsError } = await getSupabaseAdmin()
        .from('products')
        .select('*')
        .eq('status', 'active')

      if (productsError) {
        return NextResponse.json(
          { error: 'Erro ao buscar produtos locais' },
          { status: 500 }
        )
      }

      const syncResults = []

      for (const product of localProducts || []) {
        try {
          const abacatePayProduct: AbacatePayProduct = {
            id: product.external_id,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: 'BRL',
            metadata: {
              local_id: product.id,
              created_at: product.created_at,
              sync_date: new Date().toISOString()
            }
          }

          const result = await createAbacatePayProduct(abacatePayProduct)
          
          syncResults.push({
            local_id: product.id,
            external_id: product.external_id,
            name: product.name,
            status: 'success',
            abacate_pay_id: result.id
          })

        } catch (error) {
          syncResults.push({
            local_id: product.id,
            external_id: product.external_id,
            name: product.name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          synced_products: syncResults,
          total: localProducts?.length || 0,
          successful: syncResults.filter(r => r.status === 'success').length,
          failed: syncResults.filter(r => r.status === 'error').length
        }
      })

    } else if (product_id) {
      // Sincronizar produto específico
      const { data: product, error: productError } = await getSupabaseAdmin()
        .from('products')
        .select('*')
        .eq('id', product_id)
        .single()

      if (productError || !product) {
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        )
      }

      const abacatePayProduct: AbacatePayProduct = {
        id: product.external_id,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: 'BRL',
        metadata: {
          local_id: product.id,
          created_at: product.created_at,
          sync_date: new Date().toISOString()
        }
      }

      const result = await createAbacatePayProduct(abacatePayProduct)

      return NextResponse.json({
        success: true,
        data: {
          local_product: product,
          abacate_pay_product: result
        }
      })

    } else {
      return NextResponse.json(
        { error: 'product_id ou sync_all é obrigatório' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erro ao sincronizar produto:', error)
    
    if (error instanceof Error && error.message.includes('Erro ao criar produto')) {
      return NextResponse.json(
        { error: `Abacate Pay: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}