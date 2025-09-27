"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface PaymentSystemConfig {
  id?: string
  active_system: 'abacate_pay' | 'mercado_pago'
  abacate_pay_enabled: boolean
  mercado_pago_enabled: boolean
  allow_system_switch?: boolean
  created_at?: string
  updated_at?: string
}

export function usePaymentSystemConfig() {
  const [config, setConfig] = useState<PaymentSystemConfig>({
    active_system: 'abacate_pay',
    abacate_pay_enabled: true,
    mercado_pago_enabled: false,
    allow_system_switch: true
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('payment_system_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setConfig(data)
      }
    } catch (err) {
      console.error('Erro ao carregar configuração do sistema de pagamento:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateConfig = useCallback(async (newConfig: Partial<PaymentSystemConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig }

      // Verificar se já existe um registro
      const { data: existingConfig } = await supabase
        .from('payment_system_config')
        .select('id')
        .limit(1)
        .single()

      if (existingConfig) {
        // Atualizar registro existente
        const { data, error } = await supabase
          .from('payment_system_config')
          .update({
            active_system: updatedConfig.active_system,
            abacate_pay_enabled: updatedConfig.abacate_pay_enabled,
            mercado_pago_enabled: updatedConfig.mercado_pago_enabled,
            allow_system_switch: updatedConfig.allow_system_switch,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id)
          .select()
          .single()

        if (error) throw error
        setConfig(data)
      } else {
        // Criar novo registro
        const { data, error } = await supabase
          .from('payment_system_config')
          .insert({
            active_system: updatedConfig.active_system,
            abacate_pay_enabled: updatedConfig.abacate_pay_enabled,
            mercado_pago_enabled: updatedConfig.mercado_pago_enabled,
            allow_system_switch: updatedConfig.allow_system_switch
          })
          .select()
          .single()

        if (error) throw error
        setConfig(data)
      }

      return true
    } catch (err) {
      console.error('Erro ao atualizar configuração do sistema de pagamento:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração')
      throw err
    }
  }, [config])

  // Funções utilitárias
  const isAbacatePayActive = useCallback(() => {
    return config.active_system === 'abacate_pay' && config.abacate_pay_enabled
  }, [config])

  const isMercadoPagoActive = useCallback(() => {
    return config.active_system === 'mercado_pago' && config.mercado_pago_enabled
  }, [config])

  const getActiveSystemName = useCallback(() => {
    return config.active_system === 'abacate_pay' ? 'Abacate Pay' : 'Mercado Pago'
  }, [config])

  const canSwitchSystems = useCallback(() => {
    return config.allow_system_switch && 
           config.abacate_pay_enabled && 
           config.mercado_pago_enabled
  }, [config])

  useEffect(() => {
    loadConfig()
  }, [])

  return {
    config,
    loading,
    error,
    loadConfig,
    updateConfig,
    isAbacatePayActive,
    isMercadoPagoActive,
    getActiveSystemName,
    canSwitchSystems,
    refetch: loadConfig
  }
}