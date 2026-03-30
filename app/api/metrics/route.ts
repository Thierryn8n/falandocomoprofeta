import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    console.log("📊 [METRICS API] Starting metrics calculation...")

    // 1. Usuários online (últimos 30 minutos) - EXCLUINDO ADMINISTRADORES
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    
    const { data: onlineUsersData, error: onlineError } = await getSupabaseAdmin()
      .from("user_sessions")
      .select(`
        id,
        user_id,
        profiles!inner (
          role
        )
      `)
      .gte("last_activity", thirtyMinutesAgo)
      .neq("profiles.role", "admin") // Excluir administradores

    if (onlineError) {
      console.error("❌ [METRICS API] Error fetching online users:", onlineError)
    }

    const onlineUsers = onlineUsersData?.length || 0
    console.log(`👥 [METRICS API] Online users (excluding admins): ${onlineUsers}`)

    // 2. Visitas de hoje - EXCLUINDO ADMINISTRADORES
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const { data: todayVisitsData, error: todayError } = await getSupabaseAdmin()
      .from("site_visits")
      .select(`
        id,
        user_id,
        profiles (
          role
        )
      `)
      .gte("created_at", todayStart.toISOString())
      .or("user_id.is.null,profiles.role.neq.admin") // Incluir anônimos OU usuários não-admin

    if (todayError) {
      console.error("❌ [METRICS API] Error fetching today visits:", todayError)
    }

    const todayVisits = todayVisitsData?.length || 0
    console.log(`📅 [METRICS API] Today visits (excluding admins): ${todayVisits}`)

    // 3. Total de visitas (desde o início) - EXCLUINDO ADMINISTRADORES
    const { data: totalVisitsData, error: totalError } = await getSupabaseAdmin()
      .from("site_visits")
      .select(`
        id,
        user_id,
        profiles (
          role
        )
      `)
      .or("user_id.is.null,profiles.role.neq.admin") // Incluir anônimos OU usuários não-admin

    if (totalError) {
      console.error("❌ [METRICS API] Error fetching total visits:", totalError)
    }

    const totalVisits = totalVisitsData?.length || 0
    console.log(`📈 [METRICS API] Total visits (excluding admins): ${totalVisits}`)

    // 4. Usuários únicos online (para evitar duplicatas de sessão)
    const uniqueOnlineUsers = new Set(
      onlineUsersData?.map(session => session.user_id).filter(Boolean) || []
    ).size

    console.log(`🔢 [METRICS API] Unique online users: ${uniqueOnlineUsers}`)

    const metrics = {
      onlineUsers: uniqueOnlineUsers, // Usuários únicos online
      todayVisits,
      totalVisits,
      timestamp: new Date().toISOString(),
      excludesAdmins: true
    }

    console.log("✅ [METRICS API] Metrics calculated successfully:", metrics)

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error("❌ [METRICS API] Error calculating metrics:", error)
    return NextResponse.json(
      { 
        error: "Failed to calculate metrics",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}

// Função auxiliar para limpar sessões antigas (pode ser chamada periodicamente)
export async function POST(request: NextRequest) {
  try {
    console.log("🧹 [METRICS API] Cleaning old sessions...")

    // Limpar sessões mais antigas que 1 hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { error } = await getSupabaseAdmin()
      .from("user_sessions")
      .delete()
      .lt("last_activity", oneHourAgo)

    if (error) {
      console.error("❌ [METRICS API] Error cleaning sessions:", error)
      return NextResponse.json({ error: "Failed to clean sessions" }, { status: 500 })
    }

    console.log("✅ [METRICS API] Old sessions cleaned successfully")
    return NextResponse.json({ success: true, message: "Sessions cleaned" })

  } catch (error) {
    console.error("❌ [METRICS API] Error in session cleanup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}