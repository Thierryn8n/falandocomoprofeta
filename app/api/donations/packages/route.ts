import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET - Listar pacotes de doação ativos
export async function GET(request: NextRequest) {
  try {
    // Buscar pacotes ativos ordenados
    const { data: packages, error } = await supabaseAdmin
      .from('donation_packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[API Donations Packages] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch packages', details: error.message },
        { status: 500 }
      )
    }

    // Formatar resposta
    const formattedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      questionsAdded: pkg.questions_added,
      cardColor: pkg.card_color,
      icon: pkg.icon,
      // Calcular economia
      costPerQuestion: (pkg.price / pkg.questions_added).toFixed(2)
    }))

    return NextResponse.json({
      packages: formattedPackages
    })

  } catch (error) {
    console.error('[API Donations Packages] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
