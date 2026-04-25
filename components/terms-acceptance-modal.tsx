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
import { cn } from '@/lib/utils'

interface TermsAcceptanceModalProps {
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
  theme?: any
}

export function TermsAcceptanceModal({ externalOpen, onExternalOpenChange, theme }: TermsAcceptanceModalProps) {
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
      <DialogContent className={cn("max-w-md max-h-[85vh] overflow-hidden [&>button]:hidden p-4", theme?.card)}>
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={cn("p-2 rounded-full", theme?.card)}>
              <FileText className={cn("h-6 w-6", theme?.muted)} />
            </div>
          </div>
          <DialogTitle className={cn("text-xl text-center", theme?.text)}>
            Termos de Uso e Privacidade
          </DialogTitle>
          <DialogDescription className={cn("text-center text-sm", theme?.muted)}>
            Aceite para continuar usando a plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Resumo dos Termos */}
          <div className={cn("rounded-lg p-3 space-y-2", theme?.card)}>
            <h4 className={cn("font-medium text-sm flex items-center gap-2", theme?.text)}>
              <Shield className={cn("h-4 w-4", theme?.muted)} />
              Você concorda em:
            </h4>
            <ul className={cn("text-xs space-y-1 ml-5", theme?.muted)}>
              <li>• Usar a plataforma de forma ética</li>
              <li>• Respeitar as Regras de Conduta</li>
              <li>• Permitir o uso de dados (LGPD)</li>
              <li>• Aceitar cookies essenciais</li>
            </ul>
          </div>

          {/* Documentos */}
          <div className="space-y-3">
            <div className={cn("flex items-start gap-2 p-2 border rounded-lg", theme?.border)}>
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="terms" className={cn("text-xs font-medium cursor-pointer", theme?.text)}>
                  Aceito os{' '}
                  <Link 
                    href="/termos-de-uso" 
                    target="_blank"
                    className={cn("hover:underline inline-flex items-center gap-1", theme?.text)}
                  >
                    Termos de Uso
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </label>
              </div>
            </div>

            <div className={cn("flex items-start gap-2 p-2 border rounded-lg", theme?.border)}>
              <Checkbox
                id="privacy"
                checked={acceptedPrivacy}
                onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label htmlFor="privacy" className={cn("text-xs font-medium cursor-pointer", theme?.text)}>
                  Aceito a{' '}
                  <Link 
                    href="/politica-privacidade" 
                    target="_blank"
                    className={cn("hover:underline inline-flex items-center gap-1", theme?.text)}
                  >
                    Política de Privacidade
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </label>
              </div>
            </div>

            <div className={cn("border-t pt-3 mt-3", theme?.border)}>
              <p className={cn("text-xs font-medium mb-2", theme?.text)}>Cookies opcionais:</p>
              
              <div className={cn("flex items-start gap-2 p-2 border rounded-lg mb-2", theme?.border)}>
                <Checkbox
                  id="analytics"
                  checked={analyticsCookies}
                  onCheckedChange={(checked) => setAnalyticsCookies(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="analytics" className={cn("text-xs cursor-pointer", theme?.text)}>
                    Cookies de Analytics (Google Analytics)
                  </label>
                </div>
              </div>

              <div className={cn("flex items-start gap-2 p-2 border rounded-lg", theme?.border)}>
                <Checkbox
                  id="marketing"
                  checked={marketingCookies}
                  onCheckedChange={(checked) => setMarketingCookies(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="marketing" className={cn("text-xs cursor-pointer", theme?.text)}>
                    Cookies de Marketing (Propagandas)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className={cn("space-y-2 pt-3 border-t", theme?.border)}>
            <Button
              onClick={handleAccept}
              disabled={!canAccept}
              className={cn("w-full gap-2", theme?.button)}
              size="sm"
            >
              <Check className="h-4 w-4" />
              Aceitar e Continuar
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowConfirmDecline(true)}
              className={cn("w-full text-sm", theme?.button)}
              size="sm"
            >
              Recusar e Sair
            </Button>
          </div>
        </div>

        {/* Diálogo de Confirmação de Recusa */}
        <Dialog open={showConfirmDecline} onOpenChange={setShowConfirmDecline}>
          <DialogContent className={cn("max-w-md", theme?.card)}>
            <DialogHeader>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <DialogTitle className="text-center text-red-600">
                Atenção!
              </DialogTitle>
              <DialogDescription className={cn("text-center", theme?.muted)}>
                Você está prestes a sair da plataforma.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className={cn("text-sm", theme?.muted)}>
                Sem aceitar os Termos de Uso e a Política de Privacidade, você não 
                poderá usar o Flando Como Profeta. Isso é necessário para:
              </p>
              <ul className={cn("text-sm list-disc list-inside space-y-1 ml-2", theme?.muted)}>
                <li>Proteger sua privacidade e dados</li>
                <li>Garantir um ambiente seguro para todos</li>
                <li>Cumprir as leis de proteção de dados (LGPD)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDecline(false)}
                className={cn(theme?.button)}
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
