'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, Heart, MessageCircle, X, ArrowRight, Sparkles } from 'lucide-react'
import { useDonationPackages } from '@/hooks/use-donation-packages'
import { useQuestionLimits } from '@/hooks/use-question-limits'
import Link from 'next/link'
import { toast } from 'sonner'

const iconMap: Record<string, React.ReactNode> = {
  'message-circle': <MessageCircle className="h-5 w-5" />,
  'message-square': <MessageCircle className="h-5 w-5" />,
  'sparkles': <Sparkles className="h-5 w-5" />,
  'crown': <Gift className="h-5 w-5" />,
  'gift': <Gift className="h-5 w-5" />,
  'heart': <Heart className="h-5 w-5" />
}

const colorMap: Record<string, string> = {
  'amber': 'bg-amber-500 hover:bg-amber-600',
  'slate': 'bg-slate-500 hover:bg-slate-600',
  'yellow': 'bg-yellow-500 hover:bg-yellow-600',
  'emerald': 'bg-emerald-500 hover:bg-emerald-600',
  'blue': 'bg-blue-500 hover:bg-blue-600',
  'purple': 'bg-purple-500 hover:bg-purple-600'
}

interface DonationModalProps {
  trigger?: 'on-mount' | 'on-new-chat' | 'manual'
  forceShow?: boolean
  onClose?: () => void
}

export function DonationModal({ trigger = 'on-mount', forceShow = false, onClose }: DonationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const { packages, loading } = useDonationPackages()
  const { limits } = useQuestionLimits()

  // Verificar se deve mostrar o modal
  useEffect(() => {
    // Não mostrar se:
    // - Já mostrou uma vez
    // - É admin
    // - Não tem limites carregados
    if (hasShown || limits?.is_admin || !limits) return

    // Mostrar quando:
    // - Forçado
    // - Usuário tem <= 10 perguntas restantes
    // - É novo usuário (nunca interagiu)
    const shouldShow = forceShow || 
                       (limits.remaining <= 10 && limits.remaining > 0) ||
                       (trigger === 'on-mount' && limits.current_count === 0)

    if (shouldShow) {
      // Delay para não aparecer imediatamente
      const timer = setTimeout(() => {
        setIsOpen(true)
        setHasShown(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [limits, hasShown, forceShow, trigger])

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  // Não mostrar para admins ou enquanto carrega
  if (limits?.is_admin || loading) return null

  // Pegar os 2 pacotes mais populares
  const featuredPackages = packages.slice(0, 2)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
            Apoie o Falandocomoprofeta
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {limits && limits.remaining <= 5 ? (
              <span className="text-amber-600 font-medium">
                Você tem apenas {limits.remaining} perguntas restantes hoje.
              </span>
            ) : (
              'Sua doação ajuda a manter o app funcionando e melhorar nossos serviços.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Destaques */}
          <div className="grid gap-3">
            {featuredPackages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${colorMap[pkg.cardColor] || colorMap.emerald} text-white`}>
                        {iconMap[pkg.icon] || <Gift className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{pkg.name}</p>
                        <p className="text-sm text-muted-foreground">
                          +{pkg.questionsAdded} perguntas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-lg">
                        R$ {pkg.price.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-2 pt-2">
            <Link href="/donate" onClick={handleClose}>
              <Button className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                <Gift className="h-4 w-4" />
                Ver Todos os Pacotes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={handleClose}
            >
              <X className="h-4 w-4 mr-2" />
              Continuar sem doar
            </Button>
          </div>

          {/* Info */}
          <p className="text-xs text-center text-muted-foreground">
            Pagamentos seguros via Mercado Pago. 
            Perguntas adicionadas automaticamente após confirmação.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook para controlar quando mostrar o modal
export function useDonationModal() {
  const [showOnNewChat, setShowOnNewChat] = useState(false)

  const triggerNewChatModal = () => {
    setShowOnNewChat(true)
  }

  return {
    showOnNewChat,
    setShowOnNewChat,
    triggerNewChatModal
  }
}
