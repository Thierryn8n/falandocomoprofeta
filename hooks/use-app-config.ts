"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

interface AppConfig {
  id: string
  key: string
  value: any
  description?: string
  admin_id: string
  created_at: string
  updated_at: string
}

export function useAppConfig() {
  const [configs, setConfigs] = useState<AppConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.from("app_config").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setConfigs(data || [])
    } catch (err) {
      console.error("Error fetching app configs:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getConfigValue = useCallback(
    (key: string, defaultValue: any = null) => {
      const config = configs.find((c) => c.key === key)
      return config?.value || defaultValue
    },
    [configs],
  )

  const updateConfig = useCallback(
    async (key: string, value: any, description?: string) => {
      try {
        // Verificar se já existe
        const existingConfig = configs.find((c) => c.key === key)

        if (existingConfig) {
          // Atualizar existente
          const { data, error } = await supabase
            .from("app_config")
            .update({
              value,
              description,
              updated_at: new Date().toISOString(),
            })
            .eq("key", key)
            .select()
            .single()

          if (error) throw error

          setConfigs((prev) => prev.map((config) => (config.key === key ? data : config)))
          return data
        } else {
          // Criar novo
          const { data, error } = await supabase
            .from("app_config")
            .insert({
              key,
              value,
              description,
            })
            .select()
            .single()

          if (error) throw error

          setConfigs((prev) => [data, ...prev])
          return data
        }
      } catch (err) {
        console.error("Error updating config:", err)
        throw err
      }
    },
    [configs],
  )

  const deleteConfig = useCallback(async (key: string) => {
    try {
      const { error } = await supabase.from("app_config").delete().eq("key", key)

      if (error) throw error

      setConfigs((prev) => prev.filter((config) => config.key !== key))
      return true
    } catch (err) {
      console.error("Error deleting config:", err)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  return {
    configs,
    loading,
    error,
    getConfigValue,
    updateConfig,
    deleteConfig,
    refetch: fetchConfigs,
  }
}
