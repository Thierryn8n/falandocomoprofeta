import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const { cardCustomization } = await request.json()

    if (!cardCustomization || typeof cardCustomization !== 'object') {
      return NextResponse.json(
        { error: 'Personalização dos cards é obrigatória' },
        { status: 400 }
      )
    }

    // Atualizar cada plano com sua respectiva personalização
    const updatePromises = Object.entries(cardCustomization).map(async ([planType, customization]) => {
      const custom = customization as { title?: string; description?: string; color?: string }
      
      const { error } = await getSupabaseAdmin()
        .from('subscription_plans')
        .update({ 
          card_title: custom.title || null,
          card_description: custom.description || null,
          card_color: custom.color || null,
          updated_at: new Date().toISOString()
        })
        .eq('plan_type', planType)

      if (error) {
        console.error(`Erro ao atualizar personalização do plano ${planType}:`, error)
        throw error
      }
    })

    await Promise.all(updatePromises)

    return NextResponse.json({ 
      message: 'Personalização dos cards atualizada com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao atualizar personalização dos cards:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}