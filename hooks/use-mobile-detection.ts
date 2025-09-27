"use client"

import { useEffect, useState } from 'react'

interface MobileDetectionResult {
  isMobile: boolean
  isAndroid: boolean
  isIOS: boolean
  isStandalone: boolean
  canInstallPWA: boolean
  userAgent: string
}

export function useMobileDetection(): MobileDetectionResult {
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isAndroid: false,
    isIOS: false,
    isStandalone: false,
    canInstallPWA: false,
    userAgent: ''
  })

  useEffect(() => {
    const detectMobileDevice = () => {
      if (typeof window === 'undefined') return

      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ''
      
      // Detectar Android
      const isAndroid = /android/i.test(userAgent)
      
      // Detectar iOS (iPhone, iPad, iPod)
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
      
      // Detectar se é mobile (Android ou iOS)
      const isMobile = isAndroid || isIOS
      
      // Detectar se já está rodando como PWA (standalone mode)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://')
      
      // Verificar se pode instalar PWA
      let canInstallPWA = false
      
      if (isAndroid) {
        // Android pode instalar se não estiver em standalone e suportar beforeinstallprompt
        canInstallPWA = !isStandalone && 'serviceWorker' in navigator
      } else if (isIOS) {
        // iOS pode instalar se não estiver em standalone e estiver no Safari
        const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent)
        canInstallPWA = !isStandalone && isSafari
      }

      setDetection({
        isMobile,
        isAndroid,
        isIOS,
        isStandalone,
        canInstallPWA,
        userAgent
      })
    }

    // Detectar imediatamente
    detectMobileDevice()

    // Detectar mudanças na orientação (pode afetar display-mode)
    const handleOrientationChange = () => {
      setTimeout(detectMobileDevice, 100)
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)

    // Cleanup
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
    }
  }, [])

  return detection
}