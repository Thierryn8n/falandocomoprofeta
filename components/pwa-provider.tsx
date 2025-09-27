"use client"

import { PWAInstallPopup } from '@/components/pwa-install-popup'
import { usePWAInstall } from '@/hooks/use-pwa-install'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { showPopup, hideInstallPopup, installPWA } = usePWAInstall()

  return (
    <>
      {children}
      {showPopup && (
        <PWAInstallPopup
          onClose={hideInstallPopup}
          onInstall={installPWA}
        />
      )}
    </>
  )
}