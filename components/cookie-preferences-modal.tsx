'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Cookie, Shield, BarChart3, Target, Check } from 'lucide-react'
import { useCookieConsent } from '@/hooks/use-cookie-consent'
import Link from 'next/link'

interface CookiePreferencesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CookiePreferencesModal({ open, onOpenChange }: CookiePreferencesModalProps) {
  const { consent, saveConsent, acceptAll } = useCookieConsent()
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    if (consent) {
      setPreferences({
        essential: true,
        analytics: consent.analytics,
        marketing: consent.marketing
      })
    }
  }, [consent])

  const handleSave = () => {
    saveConsent({
      essential: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      version: '1.0.0'
    })
    onOpenChange(false)
  }

  const cookieTypes = [
    {
      id: 'essential',
      title: 'Essenciais',
      description: 'Necessários para o funcionamento básico do site. Incluem autenticação, segurança e preferências básicas.',
      icon: Shield,
      required: true,
      details: ['Login e autenticação', 'Segurança', 'Preferências de idioma', 'Salvamento de progresso']
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Nos ajudam a entender como você usa o site, para melhorar nossos serviços.',
      icon: BarChart3,
      required: false,
      details: ['Google Analytics', 'Métricas de uso', 'Performance do site', 'Relatórios de erro']
    },
    {
      id: 'marketing',
      title: 'Marketing',
      description: 'Usados para personalizar anúncios e conteúdo promocional.',
      icon: Target,
      required: false,
      details: ['Anúncios personalizados', 'Remarketing', 'Testes A/B', 'Integração com redes sociais']
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Cookie className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <DialogTitle className="text-xl">Preferências de Cookies</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Gerencie suas preferências de cookies abaixo. Os cookies essenciais 
            não podem ser desativados pois são necessários para o funcionamento do site.
            <Link href="/cookies" className="text-orange-600 hover:underline ml-1">
              Saiba mais sobre cookies
            </Link>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {cookieTypes.map((type) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <type.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">{type.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences[type.id as keyof typeof preferences]}
                  onCheckedChange={(checked) => {
                    if (!type.required) {
                      setPreferences(prev => ({
                        ...prev,
                        [type.id]: checked
                      }))
                    }
                  }}
                  disabled={type.required}
                />
              </div>

              <AnimatePresence>
                {preferences[type.id as keyof typeof preferences] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 pl-12">
                      <p className="text-xs font-medium text-gray-500 mb-2">Cookies utilizados:</p>
                      <ul className="space-y-1">
                        {type.details.map((detail, idx) => (
                          <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {type.required && (
                <p className="text-xs text-orange-600 dark:text-orange-400 pl-12">
                  * Sempre ativo - necessário para o funcionamento
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="sm:flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-orange-600 hover:bg-orange-700 gap-2 sm:flex-1"
          >
            <Check className="h-4 w-4" />
            Salvar Preferências
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
