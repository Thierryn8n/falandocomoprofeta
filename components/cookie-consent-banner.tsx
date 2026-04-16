'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Cookie, Settings, X, Check } from 'lucide-react'
import { TermsAcceptanceModal } from './terms-acceptance-modal'
import { useCookieConsent } from '@/hooks/use-cookie-consent'
import Link from 'next/link'

export function CookieConsentBanner() {
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
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full shrink-0">
                    <Cookie className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      Utilizamos cookies
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      Usamos cookies para melhorar sua experiência, personalizar conteúdo 
                      e analisar nosso tráfego. Os cookies essenciais são necessários para 
                      o funcionamento do site. 
                      <Link 
                        href="/politica-privacidade" 
                        className="text-orange-600 hover:underline ml-1"
                        onClick={() => setShowBanner(false)}
                      >
                        Saiba mais
                      </Link>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowTerms(true)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Personalizar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={acceptEssential}
                  >
                    Apenas Essenciais
                  </Button>
                  <Button
                    onClick={acceptAll}
                    className="bg-orange-600 hover:bg-orange-700 gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Aceitar Todos
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-gray-100 dark:bg-gray-800">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 30, ease: 'linear' }}
                  className="h-full bg-orange-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TermsAcceptanceModal
        externalOpen={showTerms}
        onExternalOpenChange={setShowTerms}
      />
    </>
  )
}
