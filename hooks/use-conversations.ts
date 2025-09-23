"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase, type Conversation } from "@/lib/supabase"
import { useSupabaseAuth } from "./use-supabase-auth"

export function useConversations() {
  const { user } = useSupabaseAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          messages (*)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (!error) {
        setConversations(data || [])
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const createConversation = useCallback(
    async (title: string) => {
      if (!user) return null

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title,
        })
        .select()
        .single()

      if (!error) {
        setConversations((prev) => [data, ...prev])
        return data
      }

      return null
    },
    [user],
  )

  const updateConversation = useCallback(async (id: string, updates: Partial<Conversation>) => {
    const { data, error } = await supabase.from("conversations").update(updates).eq("id", id).select().single()

    if (!error) {
      setConversations((prev) => prev.map((conv) => (conv.id === id ? { ...conv, ...data } : conv)))
      return data
    }

    return null
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id)

    if (!error) {
      setConversations((prev) => prev.filter((conv) => conv.id !== id))
      return true
    }

    return false
  }, [])

  const addMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })
      .select()
      .single()

    if (!error) {
      // Update conversation's updated_at
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)

      // Update local state
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: [...(conv.messages || []), data],
              updated_at: new Date().toISOString(),
            }
          }
          return conv
        }),
      )

      return data
    }

    return null
  }, [])

  return {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    addMessage,
    refetch: loadConversations,
  }
}
