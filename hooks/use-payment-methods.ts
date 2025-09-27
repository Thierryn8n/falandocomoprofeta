"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface PaymentMethod {
  id: string
  method_name: string
  is_enabled: boolean
  display_name: string
  description: string
  icon_name: string
  config_data: any
  sort_order: number
}

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/payment-methods')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar métodos de pagamento')
      }

      const data = await response.json()
      setPaymentMethods(data)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Error loading payment methods:', err)
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentMethod = async (methodName: string, isEnabled: boolean, configData?: any) => {
    try {
      const response = await fetch('/api/payment-methods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          methodName,
          isEnabled,
          configData
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar método de pagamento')
      }

      const result = await response.json()
      
      // Atualizar estado local
      setPaymentMethods(prev => 
        prev.map(method => 
          method.method_name === methodName 
            ? { ...method, is_enabled: isEnabled, config_data: configData || method.config_data }
            : method
        )
      )

      toast({
        title: "Sucesso",
        description: result.message || "Método de pagamento atualizado com sucesso",
      })

      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar método de pagamento'
      setError(errorMessage)
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
      
      throw err
    }
  }

  const getEnabledMethods = () => {
    return paymentMethods.filter(method => method.is_enabled)
  }

  const getMethodByName = (methodName: string) => {
    return paymentMethods.find(method => method.method_name === methodName)
  }

  const isMethodEnabled = (methodName: string) => {
    const method = getMethodByName(methodName)
    return method?.is_enabled || false
  }

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  return {
    paymentMethods,
    loading,
    error,
    loadPaymentMethods,
    updatePaymentMethod,
    getEnabledMethods,
    getMethodByName,
    isMethodEnabled,
    refetch: loadPaymentMethods
  }
}