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
  const [lastFetch, setLastFetch] = useState<number>(0)

  const fetchConfigs = useCallback(async (forceRefresh = false) => {
    try {
      // Cache for 5 minutes to reduce data usage
      const now = Date.now()
      if (!forceRefresh && configs.length > 0 && (now - lastFetch) < 300000) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error } = await supabase.from("app_config").select("*").order("created_at", { ascending: false })

      if (error) throw error

      setConfigs(data || [])
      setLastFetch(now)
    } catch (err) {
      console.error("Error fetching app configs:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }, [configs.length, lastFetch])

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
    // Safety timeout to ensure loading always stops
    const safetyTimeout = setTimeout(() => {
      console.log("[AppConfig] Safety timeout, forcing loading false")
      setLoading(false)
    }, 3000)
    
    fetchConfigs().then(() => {
      clearTimeout(safetyTimeout)
    })
    
    return () => clearTimeout(safetyTimeout)
  }, [])

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
