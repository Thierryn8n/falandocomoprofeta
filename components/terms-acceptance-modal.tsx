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
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Shield, Check, ExternalLink, AlertTriangle } from 'lucide-react'
import { useTerms } from '@/hooks/use-terms'
import Link from 'next/link'

interface TermsAcceptanceModalProps {
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
}

export function TermsAcceptanceModal({ externalOpen, onExternalOpenChange }: TermsAcceptanceModalProps) {
  const { showModal, acceptTerms, declineTerms, isLoading, TERMS_VERSION, setShowModal } = useTerms()
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [analyticsCookies, setAnalyticsCookies] = useState(false)
  const [marketingCookies, setMarketingCookies] = useState(false)
  const [showConfirmDecline, setShowConfirmDecline] = useState(false)

  // Usar controle externo se fornecido, senão usar o interno
  const isOpen = externalOpen !== undefined ? externalOpen : showModal
  const setIsOpen = onExternalOpenChange || setShowModal

  const canAccept = acceptedTerms && acceptedPrivacy

  const handleAccept = () => {
    acceptTerms({
      analytics: analyticsCookies,
      marketing: marketingCookies
    })
  }

  if (isLoading && externalOpen === undefined) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden [&>button]:hidden p-4">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <DialogTitle className="text-xl text-center">
            Termos de Uso e Privacidade
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Aceite para continuar usando a plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Resumo dos Termos */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              Você concorda em:
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-5">
              <li>• Usar a plataforma de forma ética</li>
              <li>• Respeitar as Regras de Conduta</li>
              <li>• Permitir o uso de dados (LGPD)</li>
              <li>• Aceitar cookies essenciais</li>
            </ul>
          </div>

          {/* Documentos */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-2 border rounded-lg">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="terms" className="text-xs font-medium cursor-pointer">
                  Aceito os{' '}
                  <Link 
                    href="/termos-de-uso" 
                    target="_blank"
                    className="text-orange-600 hover:underline inline-flex items-center gap-1"
                  >
                    Termos de Uso
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </label>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 border rounded-lg">
              <Checkbox
                id="privacy"
                checked={acceptedPrivacy}
                onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="privacy" className="text-xs font-medium cursor-pointer">
                  Aceito a{' '}
                  <Link 
                    href="/politica-privacidade" 
                    target="_blank"
                    className="text-orange-600 hover:underline inline-flex items-center gap-1"
                  >
                    Política de Privacidade
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </label>
              </div>
            </div>

            <div className="border-t pt-3 mt-3">
              <p className="text-xs font-medium mb-2">Cookies opcionais:</p>
              
              <div className="flex items-start gap-2 p-2 border rounded-lg mb-2">
                <Checkbox
                  id="analytics"
                  checked={analyticsCookies}
                  onCheckedChange={(checked) => setAnalyticsCookies(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="analytics" className="text-xs cursor-pointer">
                    Cookies de Analytics (Google Analytics)
                  </label>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 border rounded-lg">
                <Checkbox
                  id="marketing"
                  checked={marketingCookies}
                  onCheckedChange={(checked) => setMarketingCookies(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="marketing" className="text-xs cursor-pointer">
                    Cookies de Marketing (Propagandas)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="space-y-2 pt-3 border-t">
            <Button
              onClick={handleAccept}
              disabled={!canAccept}
              className="w-full bg-orange-600 hover:bg-orange-700 gap-2"
              size="sm"
            >
              <Check className="h-4 w-4" />
              Aceitar e Continuar
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowConfirmDecline(true)}
              className="w-full text-gray-500 hover:text-red-600 text-sm"
              size="sm"
            >
              Recusar e Sair
            </Button>
          </div>
        </div>

        {/* Diálogo de Confirmação de Recusa */}
        <Dialog open={showConfirmDecline} onOpenChange={setShowConfirmDecline}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-red-600">
                Atenção!
              </DialogTitle>
              <DialogDescription className="text-center">
                Você está prestes a sair da plataforma.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sem aceitar os Termos de Uso e a Política de Privacidade, você não 
                poderá usar o Flando Como Profeta. Isso é necessário para:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1 ml-2">
                <li>Proteger sua privacidade e dados</li>
                <li>Garantir um ambiente seguro para todos</li>
                <li>Cumprir as leis de proteção de dados (LGPD)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDecline(false)}
              >
                Voltar e Aceitar
              </Button>
              <Button
                variant="ghost"
                onClick={declineTerms}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Confirmar Saída
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
