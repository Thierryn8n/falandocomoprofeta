"use client"

import { useState, useEffect } from 'react'
import { X, Download, Share, Plus, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { cn } from '@/lib/utils'

interface PWAInstallPopupProps {
  onClose: () => void
  onInstall?: () => void
  theme?: any
}

export function PWAInstallPopup({ onClose, onInstall, theme }: PWAInstallPopupProps) {
  const { isAndroid, isIOS, isStandalone } = useMobileDetection()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt && isAndroid) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA instalado com sucesso')
        onInstall?.()
      }
      
      setDeferredPrompt(null)
    }
    onClose()
  }

  const getInstallInstructions = () => {
    if (isAndroid) {
      return {
        title: "Instalar App no Android",
        description: "Adicione este app à sua tela inicial para acesso rápido",
        steps: [
          "Toque no menu do navegador (⋮)",
          "Selecione 'Adicionar à tela inicial'",
          "Confirme a instalação"
        ],
        icon: <Smartphone className="h-6 w-6 text-green-600" />
      }
    } else if (isIOS) {
      return {
        title: "Instalar App no iPhone/iPad",
        description: "Adicione este app à sua tela inicial usando o Safari",
        steps: [
          "Toque no botão de compartilhar",
          "Role para baixo e toque em 'Adicionar à Tela de Início'",
          "Toque em 'Adicionar' para confirmar"
        ],
        icon: <Share className="h-6 w-6 text-blue-600" />
      }
    }
    
    return null
  }

  const instructions = getInstallInstructions()

  if (!instructions || isStandalone) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className={cn("w-full max-w-md mx-auto", theme?.card)}>
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            {instructions.icon}
            <div>
              <CardTitle className={cn("text-lg", theme?.text)}>{instructions.title}</CardTitle>
              <CardDescription className={cn(theme?.muted)}>{instructions.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className={cn("p-4 rounded-lg", theme?.card)}>
            <h4 className={cn("font-medium mb-2 flex items-center gap-2", theme?.text)}>
              <Download className="h-4 w-4" />
              Como instalar:
            </h4>
            <ol className="space-y-2 text-sm">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className={cn(theme?.text)}>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {isAndroid && deferredPrompt && (
            <Button onClick={handleInstallClick} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Instalar App
            </Button>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Vantagens do App:
            </h5>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Acesso rápido pela tela inicial</li>
              <li>• Funciona offline</li>
              <li>• Experiência nativa</li>
              <li>• Notificações push</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Agora não
            </Button>
            {isIOS && (
              <Button onClick={onClose} className="flex-1">
                Entendi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}