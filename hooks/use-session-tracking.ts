"use client"

import { useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

let sessionId: string | null = null
let heartbeatInterval: NodeJS.Timeout | null = null

export function useSessionTracking() {
  const { user } = useSupabaseAuth()

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const createSession = useCallback(async () => {
    try {
      if (sessionId) return sessionId

      sessionId = generateSessionId()

      // Create session record with only existing columns
      const { error: sessionError } = await supabase.from("user_sessions").insert({
        session_id: sessionId,
        user_id: user?.id || null,
        is_logged_in: !!user,
        last_activity: new Date().toISOString(),
      })

      if (sessionError) {
        console.error("Error creating session:", sessionError)
        return null
      }

      // Create site visit record
      const { error: visitError } = await supabase.from("site_visits").insert({
        session_id: sessionId,
        user_id: user?.id || null,
        is_logged_in: !!user,
        ip_address: null,
        user_agent: navigator.userAgent,
      })

      if (visitError) {
        console.error("Error creating visit record:", visitError)
      }

      return sessionId
    } catch (error) {
      console.error("Error in createSession:", error)
      return null
    }
  }, [user])

  const updateSession = useCallback(async () => {
    try {
      if (!sessionId) return

      const { error } = await supabase
        .from("user_sessions")
        .update({
          last_activity: new Date().toISOString(),
          is_logged_in: !!user,
          user_id: user?.id || null,
        })
        .eq("session_id", sessionId)

      if (error) {
        console.error("Error updating session:", error)
      }
    } catch (error) {
      console.error("Error in updateSession:", error)
    }
  }, [user])

  const endSession = useCallback(async () => {
    try {
      if (!sessionId) return

      const { error } = await supabase.from("user_sessions").delete().eq("session_id", sessionId)

      if (error) {
        console.error("Error ending session:", error)
      }

      sessionId = null
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
    } catch (error) {
      console.error("Error in endSession:", error)
    }
  }, [])

  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval) return

    // Update session every 5 seconds
    heartbeatInterval = setInterval(updateSession, 5000)
  }, [updateSession])

  useEffect(() => {
    // Initialize session when component mounts
    createSession().then((id) => {
      if (id) {
        startHeartbeat()
      }
    })

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateSession()
      }
    }

    // Handle page unload
    const handleBeforeUnload = () => {
      endSession()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      endSession()
    }
  }, [createSession, updateSession, endSession, startHeartbeat])

  return {
    sessionId,
    endSession,
  }
}
