"use client"

import { useState, useEffect } from 'react'
import { useMobileDetection } from './use-mobile-detection'

interface PWAInstallState {
  showPopup: boolean
  canInstall: boolean
  isInstalled: boolean
  deferredPrompt: any
}

export function usePWAInstall() {
  const { isMobile, isAndroid, isIOS, isStandalone, canInstallPWA } = useMobileDetection()
  const [state, setState] = useState<PWAInstallState>({
    showPopup: false,
    canInstall: false,
    isInstalled: false,
    deferredPrompt: null
  })

  useEffect(() => {
    // Verificar se já foi instalado ou se o popup já foi mostrado
    const hasShownPopup = localStorage.getItem('pwa-popup-shown')
    const isInstalled = isStandalone
    
    // Configurar estado inicial
    setState(prev => ({
      ...prev,
      canInstall: canInstallPWA,
      isInstalled,
      showPopup: false // Inicialmente false, será mostrado após delay
    }))

    // Listener para o evento beforeinstallprompt (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setState(prev => ({
        ...prev,
        deferredPrompt: e,
        canInstall: true
      }))
    }

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        showPopup: false
      }))
      localStorage.setItem('pwa-installed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Mostrar popup após delay se for mobile e não foi mostrado antes
    if (isMobile && canInstallPWA && !isInstalled && !hasShownPopup) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, showPopup: true }))
      }, 3000) // Mostrar após 3 segundos

      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isMobile, canInstallPWA, isStandalone])

  const showInstallPopup = () => {
    setState(prev => ({ ...prev, showPopup: true }))
  }

  const hideInstallPopup = () => {
    setState(prev => ({ ...prev, showPopup: false }))
    localStorage.setItem('pwa-popup-shown', 'true')
  }

  const installPWA = async () => {
    if (state.deferredPrompt && isAndroid) {
      try {
        state.deferredPrompt.prompt()
        const { outcome } = await state.deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          console.log('PWA instalado com sucesso')
          setState(prev => ({
            ...prev,
            isInstalled: true,
            showPopup: false,
            deferredPrompt: null
          }))
          localStorage.setItem('pwa-installed', 'true')
          return true
        }
      } catch (error) {
        console.error('Erro ao instalar PWA:', error)
      }
    }
    
    hideInstallPopup()
    return false
  }

  const resetPopupState = () => {
    localStorage.removeItem('pwa-popup-shown')
    localStorage.removeItem('pwa-installed')
  }

  return {
    ...state,
    isMobile,
    isAndroid,
    isIOS,
    showInstallPopup,
    hideInstallPopup,
    installPWA,
    resetPopupState
  }
}