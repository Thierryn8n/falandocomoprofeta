"use client"

import { useIpTracking } from '@/hooks/use-ip-tracking'

export function IpTracker() {
  const { isTracking, isTracked, error } = useIpTracking()

  // Este componente não renderiza nada visível
  // Apenas executa o rastreamento de IP em background
  
  // Em desenvolvimento, você pode descomentar as linhas abaixo para debug
  // console.log('IP Tracking Status:', { isTracking, isTracked, error })

  return null
}