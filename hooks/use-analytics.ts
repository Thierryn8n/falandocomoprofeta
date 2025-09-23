"use client"

import { useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function useAnalytics() {
  const trackEvent = useCallback(
    async (eventType: string, metadata?: any, userId?: string, conversationId?: string) => {
      try {
        const { error } = await supabase.from("analytics").insert({
          event_type: eventType,
          user_id: userId,
          conversation_id: conversationId,
          metadata,
        })

        if (error) {
          console.error("Error tracking event:", error)
        }
      } catch (error) {
        console.error("Error tracking event:", error)
      }
    },
    [],
  )

  const getAnalytics = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      let query = supabase.from("analytics").select("*").order("created_at", { ascending: false })

      if (startDate) {
        query = query.gte("created_at", startDate)
      }

      if (endDate) {
        query = query.lte("created_at", endDate)
      }

      const { data, error } = await query

      if (!error) {
        return data
      }
    } catch (error) {
      console.error("Error getting analytics:", error)
    }

    return []
  }, [])

  return {
    trackEvent,
    getAnalytics,
  }
}
