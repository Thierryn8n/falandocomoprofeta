'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSupabaseAuth } from './use-supabase-auth'
import { supabase } from '@/lib/supabase'

interface QuestionLimitData {
  current_count: number
  max_allowed: number
  remaining: number
  can_ask: boolean
  is_admin: boolean
  reset_at: string
}

interface UseQuestionLimitsReturn {
  limits: QuestionLimitData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  checkCanAsk: () => Promise<boolean>
  hasReachedLimit: boolean
  showWarning: boolean // true quando restam <= 5 perguntas
}

export function useQuestionLimits(): UseQuestionLimitsReturn {
  const { user } = useSupabaseAuth()
  const [session, setSession] = useState<any>(null)
  const [limits, setLimits] = useState<QuestionLimitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const fetchLimits = useCallback(async () => {
    if (!user || !session?.access_token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/limits', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch limits')
      }

      const data = await response.json()
      setLimits(data)
    } catch (err) {
      console.error('[useQuestionLimits] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Set default limits on error
      setLimits({
        current_count: 0,
        max_allowed: 50,
        remaining: 50,
        can_ask: true,
        is_admin: false,
        reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    } finally {
      setLoading(false)
    }
  }, [user, session])

  const checkCanAsk = useCallback(async (): Promise<boolean> => {
    if (!user || !session?.access_token) {
      return false
    }

    try {
      const response = await fetch('/api/user/limits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()
      
      // Refresh limits after check
      await fetchLimits()
      
      return data.can_ask
    } catch (err) {
      console.error('[useQuestionLimits] Check error:', err)
      return false
    }
  }, [user, session, fetchLimits])

  // Initial fetch
  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchLimits()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user, fetchLimits])

  const hasReachedLimit = limits ? !limits.can_ask && !limits.is_admin : false
  const showWarning = limits ? limits.remaining <= 5 && limits.remaining > 0 && !limits.is_admin : false

  return {
    limits,
    loading,
    error,
    refresh: fetchLimits,
    checkCanAsk,
    hasReachedLimit,
    showWarning
  }
}
