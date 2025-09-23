"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

interface RadioConfig {
  enabled: boolean
  radioUrl: string
  radioName: string
  autoPlay: boolean
  volume: number
  showForGuests: boolean
  showForUsers: boolean
  position: "bottom-left" | "bottom-right" | "top-left" | "top-right"
  isPlaying: boolean
}

const defaultRadioConfig: RadioConfig = {
  enabled: true,
  radioUrl: "https://www.radios.com.br/aovivo/radio-web-voz-do-cristianismo-vivo/228506",
  radioName: "Rádio Web Voz do Cristianismo Vivo",
  autoPlay: true,
  volume: 0.7,
  showForGuests: true,
  showForUsers: true,
  position: "bottom-right",
  isPlaying: false,
}

export function useRadioConfig(user?: User | null) {
  const [radioConfig, setRadioConfig] = useState<RadioConfig>(defaultRadioConfig)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar se é primeira visita (não logado)
  const isFirstVisit = useCallback((): boolean => {
    const hasVisited = localStorage.getItem("radio_has_visited")
    return !hasVisited
  }, [])

  // Verificar se é primeiro login
  const isFirstLogin = useCallback(async (currentUser?: User | null): Promise<boolean> => {
    if (!currentUser) return false

    try {
      const { data, error } = await supabase.from("app_config").select("value").eq("key", "radio_settings").single()

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao verificar primeiro login:", error)
        return false
      }

      // Se não tem configuração salva, é primeiro login
      return !data?.value?.hasOwnProperty("isPlaying")
    } catch (error) {
      console.error("Erro ao verificar primeiro login:", error)
      return false
    }
  }, [])

  // Carregar configurações do banco (configurações gerais da rádio)
  const fetchRadioConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.from("app_config").select("value").eq("key", "radio_settings").single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      let baseConfig = defaultRadioConfig
      if (data?.value) {
        baseConfig = { ...defaultRadioConfig, ...data.value }
      }

      // Determinar estado inicial do play
      let playingState = false

      if (!user) {
        // Usuário não logado
        if (isFirstVisit()) {
          // Primeira visita: iniciar automaticamente
          playingState = true
          localStorage.setItem("radio_has_visited", "true")
          localStorage.setItem("radio_playing_state", "true")
          console.log("🎵 Primeira visita - iniciando automaticamente")
        } else {
          // Visitas subsequentes: usar estado salvo
          const localState = localStorage.getItem("radio_playing_state")
          playingState = localState === "true"
          console.log("🎵 Visitante recorrente - estado local:", playingState)
        }
      } else {
        // Usuário logado
        const firstLogin = await isFirstLogin(user)
        if (firstLogin) {
          // Primeiro login: iniciar automaticamente
          playingState = true
          console.log("🎵 Primeiro login - iniciando automaticamente")
        } else {
          // Login recorrente: usar estado salvo
          playingState = baseConfig.isPlaying || false
          console.log("🎵 Login recorrente - estado do banco:", playingState)
        }
      }

      const finalConfig = { ...baseConfig, isPlaying: playingState }
      setRadioConfig(finalConfig)
      console.log("✅ Configuração da rádio carregada:", finalConfig)
    } catch (err) {
      console.error("❌ Erro ao carregar configuração da rádio:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      setRadioConfig(defaultRadioConfig)
    } finally {
      setLoading(false)
    }
  }, [user, isFirstVisit, isFirstLogin])

  // Salvar estado do play
  const savePlayingState = useCallback(
    async (isPlaying: boolean) => {
      try {
        console.log("💾 Salvando estado do play:", isPlaying, user ? "(banco)" : "(local)")

        if (!user) {
          // Usuário não logado: salvar no localStorage
          localStorage.setItem("radio_playing_state", isPlaying.toString())
          setRadioConfig((prev) => ({ ...prev, isPlaying }))
          console.log("✅ Estado salvo localmente:", isPlaying)
        } else {
          // Usuário logado: salvar no banco
          const { data: existingConfig } = await supabase
            .from("app_config")
            .select("value")
            .eq("key", "radio_settings")
            .single()

          const currentConfig = existingConfig?.value || defaultRadioConfig
          const updatedConfig = { ...currentConfig, isPlaying }

          if (existingConfig) {
            // Atualizar configuração existente
            const { error } = await supabase
              .from("app_config")
              .update({
                value: updatedConfig,
                updated_at: new Date().toISOString(),
              })
              .eq("key", "radio_settings")

            if (error) throw error
          } else {
            // Criar nova configuração
            const { error } = await supabase.from("app_config").insert({
              key: "radio_settings",
              value: updatedConfig,
              description: "Configurações do player de rádio",
            })

            if (error) throw error
          }

          setRadioConfig((prev) => ({ ...prev, isPlaying }))
          console.log("✅ Estado salvo no banco:", isPlaying)
        }
      } catch (err) {
        console.error("❌ Erro ao salvar estado do play:", err)
      }
    },
    [user],
  )

  // Migrar estado do localStorage para o banco quando fizer login
  const migrateLocalStateToDatabase = useCallback(async () => {
    if (!user) return

    try {
      const localState = localStorage.getItem("radio_playing_state")
      if (localState !== null) {
        const isPlaying = localState === "true"
        console.log("🔄 Migrando estado local para banco:", isPlaying)

        await savePlayingState(isPlaying)
        localStorage.removeItem("radio_playing_state")

        console.log("✅ Estado migrado e localStorage limpo")
      }
    } catch (error) {
      console.error("❌ Erro ao migrar estado:", error)
    }
  }, [user, savePlayingState])

  // Atualizar configurações gerais da rádio (apenas admin)
  const updateRadioConfig = useCallback(
    async (newConfig: Partial<RadioConfig>) => {
      try {
        const updatedConfig = { ...radioConfig, ...newConfig }

        // Não alterar o estado do play nas configurações gerais
        delete updatedConfig.isPlaying

        const { data: existingConfig } = await supabase
          .from("app_config")
          .select("id")
          .eq("key", "radio_settings")
          .single()

        if (existingConfig) {
          const { error } = await supabase
            .from("app_config")
            .update({
              value: updatedConfig,
              updated_at: new Date().toISOString(),
            })
            .eq("key", "radio_settings")

          if (error) throw error
        } else {
          const { error } = await supabase.from("app_config").insert({
            key: "radio_settings",
            value: updatedConfig,
            description: "Configurações do player de rádio",
          })

          if (error) throw error
        }

        setRadioConfig((prev) => ({ ...prev, ...updatedConfig }))
        return updatedConfig
      } catch (err) {
        console.error("❌ Erro ao atualizar configuração da rádio:", err)
        throw err
      }
    },
    [radioConfig],
  )

  // Carregar configurações quando o hook é inicializado ou usuário muda
  useEffect(() => {
    fetchRadioConfig()
  }, [fetchRadioConfig])

  // Migrar estado local para banco quando usuário faz login
  useEffect(() => {
    if (user) {
      migrateLocalStateToDatabase()
    }
  }, [user, migrateLocalStateToDatabase])

  return {
    radioConfig,
    loading,
    error,
    updateRadioConfig,
    savePlayingState,
    refetch: fetchRadioConfig,
  }
}
