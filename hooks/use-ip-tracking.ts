"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface IpTrackingResult {
  isTracking: boolean
  isTracked: boolean
  error: string | null
}

export function useIpTracking(): IpTrackingResult {
  const [isTracking, setIsTracking] = useState(false)
  const [isTracked, setIsTracked] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trackUserIp = async () => {
      // Verificar se já foi rastreado nesta sessão
      const sessionTracked = sessionStorage.getItem('ip_tracked')
      if (sessionTracked === 'true') {
        setIsTracked(true)
        return
      }

      setIsTracking(true)
      setError(null)

      try {
        // Obter token de autenticação se disponível
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        // Preparar headers
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }

        // Adicionar token se disponível
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        // Fazer chamada para capturar IP
        const response = await fetch('/api/geolocation', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            timestamp: new Date().toISOString()
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.success) {
          // Marcar como rastreado nesta sessão
          sessionStorage.setItem('ip_tracked', 'true')
          setIsTracked(true)
          
          console.log('IP tracking successful:', result.message)
          
          // Se foi excluído (admin), também marcar como rastreado
          if (result.excluded) {
            console.log('Admin user excluded from IP tracking')
          }
        } else {
          throw new Error(result.error || 'Failed to track IP')
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        console.error('Error tracking IP:', errorMessage)
        
        // Não bloquear a aplicação por erro de tracking
        // Marcar como "rastreado" para evitar tentativas repetidas
        sessionStorage.setItem('ip_tracked', 'error')
      } finally {
        setIsTracking(false)
      }
    }

    // Executar tracking após um pequeno delay para não bloquear o carregamento inicial
    const timeoutId = setTimeout(trackUserIp, 1000)

    return () => clearTimeout(timeoutId)
  }, [])

  return {
    isTracking,
    isTracked,
    error
  }
}