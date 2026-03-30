"use client"

import { useEffect, useCallback, useState } from "react"
import { supabase } from "@/lib/supabase"

let globalSessionId: string | null = null
let heartbeatInterval: NodeJS.Timeout | null = null

export function useSessionTracking() {
  const [sessionId, setSessionId] = useState<string | null>(globalSessionId)

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const createSession = useCallback(async () => {
    try {
      if (globalSessionId) return globalSessionId

      globalSessionId = generateSessionId()
      setSessionId(globalSessionId)

      // Create session record
      const { error: sessionError } = await supabase.from("user_sessions").insert({
        session_id: globalSessionId,
        user_id: null,
        is_logged_in: false,
        last_activity: new Date().toISOString(),
      })

      if (sessionError) {
        console.error("Error creating session:", sessionError)
      }

      return globalSessionId
    } catch (error) {
      console.error("Error in createSession:", error)
      return null
    }
  }, [])

  const endSession = useCallback(async () => {
    try {
      if (!globalSessionId) return

      await supabase.from("user_sessions").delete().eq("session_id", globalSessionId)

      globalSessionId = null
      setSessionId(null)
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
    } catch (error) {
      console.error("Error in endSession:", error)
    }
  }, [])

  useEffect(() => {
    // Initialize session once
    if (!globalSessionId) {
      createSession()
    }

    return () => {
      // Cleanup only on unmount
    }
  }, [createSession])

  return {
    sessionId,
    endSession,
  }
}
