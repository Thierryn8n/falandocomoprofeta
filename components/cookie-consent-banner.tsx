'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Cookie, Settings, X, Check } from 'lucide-react'
import { TermsAcceptanceModal } from './terms-acceptance-modal'
import { useCookieConsent } from '@/hooks/use-cookie-consent'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CookieConsentBannerProps {
  theme?: any
}

export function CookieConsentBanner({ theme }: CookieConsentBannerProps) {
  const { showBanner, acceptAll, acceptEssential, setShowBanner } = useCookieConsent()
  const [showTerms, setShowTerms] = useState(false)

  if (!showBanner) return null

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className={cn("max-w-4xl mx-auto rounded-2xl shadow-2xl overflow-hidden", theme?.card, theme?.border)}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={cn("p-3 rounded-full shrink-0", theme?.card)}>
                    <Cookie className={cn("h-6 w-6", theme?.muted)} />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn("text-lg font-semibold mb-2", theme?.text)}>
                      Utilizamos cookies
                    </h3>
                    <p className={cn("text-sm leading-relaxed", theme?.muted)}>
                      Usamos cookies para melhorar sua experiência, personalizar conteúdo 
                      e analisar nosso tráfego. Os cookies essenciais são necessários para 
                      o funcionamento do site. 
                      <Link 
                        href="/politica-privacidade" 
                        className={cn("hover:underline ml-1", theme?.text)}
                        onClick={() => setShowBanner(false)}
                      >
                        Saiba mais
                      </Link>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBanner(false)}
                    className={cn("p-2 rounded-full transition-colors", theme?.button)}
                  >
                    <X className={cn("h-5 w-5", theme?.muted)} />
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowTerms(true)}
                    className={cn("gap-2", theme?.button)}
                  >
                    <Settings className="h-4 w-4" />
                    Personalizar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={acceptEssential}
                    className={cn(theme?.button)}
                  >
                    Apenas Essenciais
                  </Button>
                  <Button
                    onClick={acceptAll}
                    className={cn("gap-2", theme?.button)}
                  >
                    <Check className="h-4 w-4" />
                    Aceitar Todos
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className={cn("h-1", theme?.card)}>
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 30, ease: 'linear' }}
                  className={cn("h-full", theme?.primary)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TermsAcceptanceModal
        externalOpen={showTerms}
        onExternalOpenChange={setShowTerms}
        theme={theme}
      />
    </>
  )
}
