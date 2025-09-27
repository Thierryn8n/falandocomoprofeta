"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useSupabaseAuth } from "./use-supabase-auth"

export function useQuestionCounter() {
  const { user } = useSupabaseAuth()
  const [questionCount, setQuestionCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar o contador atual
  const fetchQuestionCount = async () => {
    if (!user?.id) {
      setQuestionCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Chama a função do banco para obter o contador
      const { data, error } = await supabase.rpc('get_user_question_count', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Erro ao buscar contador de perguntas:', error)
        setError(error.message)
        return
      }

      // A função retorna um array com um objeto, extrair total_questions
      if (data && Array.isArray(data) && data.length > 0) {
        setQuestionCount(data[0].total_questions || 0)
      } else {
        setQuestionCount(0)
      }
    } catch (err) {
      console.error('Erro ao buscar contador:', err)
      setError('Erro ao carregar contador de perguntas')
    } finally {
      setLoading(false)
    }
  }

  // Função para incrementar o contador
  const incrementQuestionCount = async () => {
    if (!user?.id) return

    try {
      const { error } = await supabase.rpc('increment_question_count', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Erro ao incrementar contador:', error)
        return false
      }

      // Atualiza o estado local
      setQuestionCount(prev => prev + 1)
      return true
    } catch (err) {
      console.error('Erro ao incrementar contador:', err)
      return false
    }
  }

  // Carrega o contador quando o usuário muda
  useEffect(() => {
    fetchQuestionCount()
  }, [user?.id])

  return {
    questionCount,
    loading,
    error,
    incrementQuestionCount,
    refreshQuestionCount: fetchQuestionCount
  }
}