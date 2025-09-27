import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role key para operações administrativas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('Fetching payment methods configuration...')

    const { data: paymentMethods, error } = await supabase
      .from('payment_methods_config')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching payment methods:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar métodos de pagamento' },
        { status: 500 }
      )
    }

    console.log('Payment methods fetched successfully:', paymentMethods?.length || 0)
    return NextResponse.json(paymentMethods || [])

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { methodName, isEnabled, configData } = await request.json()

    console.log('Updating payment method:', { methodName, isEnabled })

    if (!methodName) {
      return NextResponse.json(
        { error: 'Nome do método é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o método existe
    const { data: existingMethod, error: fetchError } = await supabase
      .from('payment_methods_config')
      .select('*')
      .eq('method_name', methodName)
      .single()

    if (fetchError || !existingMethod) {
      console.error('Payment method not found:', methodName)
      return NextResponse.json(
        { error: 'Método de pagamento não encontrado' },
        { status: 404 }
      )
    }

    console.log('Existing method found:', existingMethod)

    // Preparar dados para atualização
    const updateData: any = {}
    if (typeof isEnabled === 'boolean') {
      updateData.is_enabled = isEnabled
    }
    if (configData) {
      updateData.config_data = configData
    }

    // Atualizar método de pagamento
    const { data: updatedMethod, error: updateError } = await supabase
      .from('payment_methods_config')
      .update(updateData)
      .eq('method_name', methodName)
      .select('*')

    if (updateError) {
      console.error('Error updating payment method:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar método de pagamento' },
        { status: 500 }
      )
    }

    if (!updatedMethod || updatedMethod.length === 0) {
      console.error('Update operation completed but no data returned')
      return NextResponse.json(
        { error: 'Operação de atualização completada mas nenhum dado retornado' },
        { status: 500 }
      )
    }

    console.log('Payment method updated successfully:', updatedMethod[0])
    return NextResponse.json({
      message: 'Método de pagamento atualizado com sucesso',
      method: updatedMethod[0]
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}