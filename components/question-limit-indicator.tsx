'use client'

import { useQuestionLimits } from '@/hooks/use-question-limits'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AlertCircle, MessageCircle, Gift, Crown } from 'lucide-react'
import Link from 'next/link'

export function QuestionLimitIndicator() {
  const { limits, loading, hasReachedLimit, showWarning } = useQuestionLimits()

  if (loading || !limits) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 animate-pulse">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Carregando...</span>
      </div>
    )
  }

  // Se for admin, mostrar badge especial
  if (limits.is_admin) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
        <Crown className="h-4 w-4 text-amber-500" />
        <span className="text-xs font-medium text-amber-600">Admin - Ilimitado</span>
      </div>
    )
  }

  const percentage = Math.min(100, (limits.current_count / limits.max_allowed) * 100)
  const isLow = limits.remaining <= 5
  const isCritical = limits.remaining <= 2

  // Se atingiu o limite, mostrar modal de bloqueio
  if (hasReachedLimit) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            variant="destructive" 
            size="sm"
            className="gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Limite Atingido
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Limite Diário Atingido
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p>
                Você usou todas as suas <strong>50 perguntas</strong> disponíveis por hoje.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Próximo reset:</strong>{' '}
                  {new Date(limits.reset_at).toLocaleString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <p className="text-sm">
                Faça uma <strong>doação</strong> para continuar usando o app sem limites hoje!
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Link href="/donate" className="w-full">
              <Button className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                <Gift className="h-4 w-4" />
                Fazer Doação e Continuar
              </Button>
            </Link>
            <Link href="/upgrade" className="w-full">
              <Button variant="outline" className="w-full">
                Ver Planos de Assinatura
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Indicador normal com progresso
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
            ${isCritical 
              ? 'bg-red-100 hover:bg-red-200 border border-red-300' 
              : isLow 
                ? 'bg-amber-100 hover:bg-amber-200 border border-amber-300' 
                : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }
          `}
        >
          <MessageCircle className={`h-4 w-4 ${
            isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'
          }`} />
          <span className={`text-xs font-medium ${
            isCritical ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-emerald-700'
          }`}>
            {limits.remaining} restantes
          </span>
          
          {/* Barra de progresso mini */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden ml-1">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Suas Perguntas Diárias
          </DialogTitle>
          <DialogDescription className="pt-4">
            Você tem <strong>{limits.remaining}</strong> de <strong>{limits.max_allowed}</strong> perguntas disponíveis para hoje.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {/* Barra de progresso grande */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {limits.current_count} usadas
              </span>
              <span className="font-medium">
                {limits.remaining} restantes
              </span>
            </div>
            <Progress 
              value={percentage} 
              className={`h-3 ${
                isCritical ? '[&>div]:bg-red-500' : 
                isLow ? '[&>div]:bg-amber-500' : 
                '[&>div]:bg-emerald-500'
              }`}
            />
          </div>
          
          {/* Aviso de baixo limite */}
          {showWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Você está com poucas perguntas restantes. 
                Considere fazer uma doação para continuar sem interrupções.
              </p>
            </div>
          )}
          
          {/* Info de reset */}
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p>
              <strong>Reset em:</strong>{' '}
              {new Date(limits.reset_at).toLocaleString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-xs mt-1">
              O limite é resetado automaticamente à meia-noite.
            </p>
          </div>
          
          {/* Botões de ação */}
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/donate" className="w-full">
              <Button className="w-full gap-2">
                <Gift className="h-4 w-4" />
                Adicionar Mais Perguntas
              </Button>
            </Link>
            <Link href="/upgrade" className="w-full">
              <Button variant="outline" className="w-full">
                Ver Planos Mensais
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
