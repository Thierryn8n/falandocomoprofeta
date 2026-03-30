import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Clean old sessions (older than 5 minutes)
    const { error } = await getSupabaseAdmin().rpc("clean_old_sessions")

    if (error) {
      console.error("Error cleaning sessions:", error)
      return NextResponse.json({ error: "Failed to clean sessions" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Sessions cleaned successfully" })
  } catch (error) {
    console.error("Error in session cleanup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Get current online users count
    const { data: onlineUsers, error } = await getSupabaseAdmin()
      .from("user_sessions")
      .select("id")
      .gte("last_activity", new Date(Date.now() - 30 * 1000).toISOString())

    if (error) {
      console.error("Error getting online users:", error)
      return NextResponse.json({ error: "Failed to get online users" }, { status: 500 })
    }

    return NextResponse.json({
      onlineUsers: onlineUsers?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in session status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
