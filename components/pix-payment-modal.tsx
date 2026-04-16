'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, CheckCircle, Clock, QrCode, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

// Função local para formatar valor PIX
function formatPixAmount(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount / 100)
}

interface PixPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  planType: string
  userId: string
  userEmail: string
}

interface PixPaymentData {
  id: string
  amount: number
  qrCode: string
  qrCodeImage: string
  pixKey: string
  expiresAt: string
}

export function PixPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  planType,
  userId,
  userEmail
}: PixPaymentModalProps) {
  const [step, setStep] = useState<'amount' | 'payment' | 'waiting'>('amount')
  const [customAmount, setCustomAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isChecking, setIsChecking] = useState(false)

  // Timer for payment expiration
  useEffect(() => {
    if (paymentData && step === 'waiting') {
      const expiresAt = new Date(paymentData.expiresAt).getTime()
      
      const timer = setInterval(() => {
        const now = Date.now()
        const remaining = Math.max(0, expiresAt - now)
        setTimeLeft(remaining)
        
        if (remaining === 0) {
          clearInterval(timer)
          toast.error('Pagamento expirado. Tente novamente.')
          setStep('amount')
          setPaymentData(null)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [paymentData, step])

  // Auto-check payment status
  useEffect(() => {
    if (paymentData && step === 'waiting' && !isChecking) {
      const checkInterval = setInterval(async () => {
        await checkPaymentStatus()
      }, 5000) // Check every 5 seconds

      return () => clearInterval(checkInterval)
    }
  }, [paymentData, step, isChecking])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleCreatePayment = async () => {
    if (planType === 'custom' && !customAmount) {
      toast.error('Digite um valor para continuar')
      return
    }

    setIsLoading(true)
    
    try {
      const amount = planType === 'custom' 
        ? Math.round(parseFloat(customAmount.replace(',', '.')) * 100)
        : getPlanAmount(planType)

      if (amount < 100) {
        toast.error('Valor mínimo é R$ 1,00')
        return
      }

      const response = await fetch('/api/pix/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          planType,
          userId,
          userEmail
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento')
      }

      setPaymentData(data.payment)
      setStep('payment')
      
      // Start waiting after showing QR code
      setTimeout(() => {
        setStep('waiting')
      }, 2000)

    } catch (error) {
      console.error('Error creating PIX payment:', error)
      toast.error('Erro ao criar pagamento PIX')
    } finally {
      setIsLoading(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (!paymentData || isChecking) return

    setIsChecking(true)
    
    try {
      const response = await fetch('/api/pix/check-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentData.id,
          userId
        })
      })

      const data = await response.json()

      if (data.status === 'paid') {
        toast.success('Pagamento confirmado! Acesso ativado em sua conta.')
        onSuccess()
        onClose()
      }

    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const copyPixKey = () => {
    if (paymentData) {
      navigator.clipboard.writeText(paymentData.pixKey)
      toast.success('Chave PIX copiada!')
    }
  }

  const copyQRCode = () => {
    if (paymentData) {
      navigator.clipboard.writeText(paymentData.qrCode)
      toast.success('Código PIX copiado!')
    }
  }

  const getPlanAmount = (plan: string): number => {
    const amounts = {
      monthly: 2900, // R$ 29,00
      yearly: 29900, // R$ 299,00
      lifetime: 99900 // R$ 999,00
    }
    return amounts[plan as keyof typeof amounts] || 0
  }

  const getPlanDescription = (plan: string): string => {
    const descriptions = {
      monthly: 'Plano Mensal - Acesso ilimitado',
      yearly: 'Plano Anual - Acesso ilimitado',
      lifetime: 'Plano Vitalício - Acesso ilimitado',
      custom: 'Valor personalizado'
    }
    return descriptions[plan as keyof typeof descriptions] || 'Plano personalizado'
  }

  const handleClose = () => {
    setStep('amount')
    setPaymentData(null)
    setCustomAmount('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Pagamento PIX
          </DialogTitle>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{getPlanDescription(planType)}</CardTitle>
                {planType !== 'custom' && (
                  <CardDescription>
                    {formatPixAmount(getPlanAmount(planType))}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>

            {planType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="text"
                  placeholder="10,00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                {customAmount && parseFloat(customAmount.replace(',', '.')) >= 5 && (
                  <p className="text-sm text-muted-foreground">
                    Você receberá acesso temporário baseado no valor da oferta
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleCreatePayment} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar PIX
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && paymentData && (
          <div className="space-y-4">
            <div className="text-center">
              <img 
                src={paymentData.qrCodeImage} 
                alt="QR Code PIX" 
                className="mx-auto mb-4 rounded-lg border"
              />
              <p className="text-sm text-muted-foreground mb-2">
                Escaneie o QR Code ou copie a chave PIX
              </p>
              <Badge variant="secondary" className="mb-4">
                {formatPixAmount(paymentData.amount)}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <div className="flex gap-2">
                <Input 
                  value={paymentData.pixKey} 
                  readOnly 
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={copyPixKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código PIX</Label>
              <div className="flex gap-2">
                <Input 
                  value={paymentData.qrCode} 
                  readOnly 
                  className="flex-1 text-xs"
                />
                <Button size="sm" variant="outline" onClick={copyQRCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'waiting' && paymentData && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              <span>Aguardando pagamento...</span>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Tempo restante: {formatTime(timeLeft)}
              </p>
              <Badge variant="secondary">
                {formatPixAmount(paymentData.amount)}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={checkPaymentStatus}
                disabled={isChecking}
                className="flex-1"
              >
                {isChecking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Verificar
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              O pagamento será verificado automaticamente a cada 5 segundos
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}