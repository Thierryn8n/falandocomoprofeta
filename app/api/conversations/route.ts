import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

// Service role client for server-side operations (bypasses RLS)
const supabaseService = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
  audioUrl?: string
}

interface ConversationRequest {
  user_id: string
  conversation_id?: string | null
  messages: Message[]
  audio_url?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversationRequest = await request.json()
    const { user_id, conversation_id, messages, audio_url } = body

    console.log("🔥 CONVERSATIONS API - Starting save process")
    console.log("📝 User ID:", user_id)
    console.log("📝 Conversation ID:", conversation_id)
    console.log("📝 Messages count:", messages.length)
    console.log("🎵 Audio URL:", audio_url)
    console.log("📝 Request body:", { user_id, conversation_id, messages: messages?.length, audio_url })
    console.log("🎵 Audio URL received:", audio_url)

    // Validate required fields
    if (!user_id || !messages || messages.length === 0) {
      console.error("❌ Missing required fields")
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify user exists
    const { data: userProfile, error: userError } = await getSupabaseAdmin()
      .from("profiles")
      .select("id, email")
      .eq("id", user_id)
      .single()

    if (userError || !userProfile) {
      console.error("❌ User not found:", userError)
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    console.log("✅ User found:", userProfile.email)

    // Validate messages structure
    const validMessages = messages.filter(
      (msg) =>
        msg &&
        typeof msg === "object" &&
        msg.role &&
        msg.content &&
        typeof msg.content === "string" &&
        msg.timestamp &&
        (msg.role === "user" || msg.role === "assistant")
    )

    if (validMessages.length === 0) {
      console.error("❌ No valid messages to save")
      return NextResponse.json(
        { success: false, error: "No valid messages" },
        { status: 400 }
      )
    }

    console.log("✅ Valid messages:", validMessages.length)

    // Generate title from first user message
    const firstUserMessage = validMessages.find(msg => msg.role === "user")
    const title = firstUserMessage 
      ? firstUserMessage.content.substring(0, 50).trim() + (firstUserMessage.content.length > 50 ? "..." : "")
      : "Nova Conversa"

    let finalConversationId = conversation_id

    if (conversation_id) {
      // Update existing conversation
      console.log("📝 Updating existing conversation:", conversation_id)
      console.log("🎵 Audio URL to save:", audio_url)
      
      const { data: updateData, error: updateError } = await getSupabaseAdmin()Service
        .from("conversations")
        .update({
          messages: validMessages,
          updated_at: new Date().toISOString(),
          title: title,
          audio_url: audio_url
        })
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .select()
        .single()

      if (updateError) {
        console.error("❌ Error updating conversation:", updateError)
        return NextResponse.json(
          { success: false, error: "Failed to update conversation" },
          { status: 500 }
        )
      }

      console.log("✅ Conversation updated successfully")
    } else {
      // Create new conversation
      console.log("📝 Creating new conversation")
      console.log("🎵 Audio URL to save:", audio_url)
      
      const newConversationId = crypto.randomUUID()
      finalConversationId = newConversationId

      const { data: insertData, error: insertError } = await getSupabaseAdmin()Service
        .from("conversations")
        .insert({
          id: newConversationId,
          user_id: user_id,
          title: title,
          messages: validMessages,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          audio_url: audio_url
        })
        .select()
        .single()

      if (insertError) {
        console.error("❌ Error creating conversation:", insertError)
        return NextResponse.json(
          { success: false, error: "Failed to create conversation" },
          { status: 500 }
        )
      }

      console.log("✅ New conversation created successfully")
    }

    // Verify the save was successful
    const { data: verifyData, error: verifyError } = await getSupabaseAdmin()Service
      .from("conversations")
      .select("id, messages")
      .eq("id", finalConversationId)
      .eq("user_id", user_id)
      .single()

    if (verifyError || !verifyData) {
      console.error("❌ Save verification failed:", verifyError)
      return NextResponse.json(
        { success: false, error: "Save verification failed" },
        { status: 500 }
      )
    }

    console.log("✅ VERIFICATION SUCCESS!")
    console.log("📊 Saved messages count:", verifyData.messages?.length || 0)

    return NextResponse.json({
      success: true,
      conversationId: finalConversationId,
      messagesCount: verifyData.messages?.length || 0
    })

  } catch (error) {
    console.error("💥 CONVERSATIONS API ERROR:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get("user_id")

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id parameter" },
        { status: 400 }
      )
    }

    const { data: conversations, error } = await getSupabaseAdmin()Service
      .from("conversations")
      .select("*")
      .eq("user_id", user_id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching conversations:", error)
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversations })

  } catch (error) {
    console.error("GET conversations error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}