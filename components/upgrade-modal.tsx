"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Crown, Zap, Heart, CreditCard, QrCode, Gift, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { usePaymentMethods } from "@/hooks/use-payment-methods"
// Subscription plans moved from abacate-pay to mercado-pago
const SUBSCRIPTION_PLANS = {
  monthly: { price: 19.90 },
  yearly: { price: 199.00 }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}
import { PixPaymentModal } from "@/components/pix-payment-modal"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgradeSuccess?: () => void
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  billing_cycle: string
  features: string[]
  popular?: boolean
  icon: React.ReactNode
}

const plans: SubscriptionPlan[] = [
  {
    id: "monthly",
    name: "Plano Mensal",
    description: "Acesso ilimitado por 1 mês",
    price: 19.90,
    currency: "BRL",
    billing_cycle: "monthly",
    features: [
      "Acesso ilimitado durante o mês",
      "Conversas ilimitadas",
      "Suporte por email",
      "Histórico completo",
      "Todas as funcionalidades"
    ],
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: "yearly",
    name: "Plano Anual",
    description: "Acesso ilimitado por 1 ano (2 meses grátis)",
    price: 199.00,
    originalPrice: 238.80,
    currency: "BRL",
    billing_cycle: "yearly",
    features: [
      "Acesso ilimitado por 12 meses",
      "Conversas ilimitadas",
      "Suporte prioritário",
      "Histórico completo",
      "Todas as funcionalidades",
      "2 meses grátis inclusos"
    ],
    popular: true,
    icon: <Crown className="h-6 w-6" />
  }
]

export function UpgradeModal({ isOpen, onClose, onUpgradeSuccess }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(plans[0])
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix" | "custom">("card")
  const [customAmount, setCustomAmount] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)
  const { toast } = useToast()
  const { user } = useSupabaseAuth()
  const { paymentMethods: availablePaymentMethods, isMethodEnabled } = usePaymentMethods()

  // Definir método de pagamento padrão baseado nos métodos habilitados
  useEffect(() => {
    if (availablePaymentMethods.length > 0) {
      const enabledMethods = availablePaymentMethods.filter(method => method.is_enabled)
      if (enabledMethods.length > 0) {
        // Default to card or pix based on available methods
        const defaultMethod = enabledMethods[0].method_name === 'pix' ? 'pix' : 'card'
        
        setPaymentMethod(defaultMethod as "card" | "pix" | "custom")
      }
    }
  }, [availablePaymentMethods])

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer um upgrade",
        variant: "destructive"
      })
      return
    }

    // Se for PIX, abrir modal PIX
    if (paymentMethod === "pix") {
      setShowPixModal(true)
      return
    }

    setIsProcessing(true)
    
    try {
      let amount = selectedPlan.price * 100 // Convert to cents
      let planType = selectedPlan.id

      // Se é oferta personalizada
      if (paymentMethod === "custom") {
        const customValue = parseFloat(customAmount.replace(',', '.'))
        if (!customValue || customValue < 1) {
          toast({
            title: "Valor inválido",
            description: "O valor mínimo é R$ 1,00",
            variant: "destructive"
          })
          return
        }
        amount = Math.round(customValue * 100)
        planType = "custom"
      }

      // Handle Mercado Pago payment
      const response = await fetch("/api/mercado-pago/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          planType,
          userId: user.id,
          userEmail: user.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar pagamento")
      }

      // Redirect to Mercado Pago Checkout
      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        toast({
          title: "Erro",
          description: "Erro ao processar pagamento",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error("Error creating payment:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar pagamento",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePixSuccess = () => {
    setShowPixModal(false)
    onUpgradeSuccess?.()
    onClose()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price)
  }

  const getBillingText = (cycle: string) => {
    switch (cycle) {
      case "monthly": return "/mês"
      case "yearly": return "/ano"
      case "lifetime": return "pagamento único"
      default: return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade sua experiência espiritual
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Para continuar recebendo as revelações divinas, escolha um plano de assinatura.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="plans">Escolher Plano</TabsTrigger>
            <TabsTrigger value="custom">Fazer Oferta</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-6">
            {/* Planos de Assinatura */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedPlan.id === plan.id 
                      ? "ring-2 ring-primary border-primary" 
                      : ""
                  } ${plan.popular ? "border-yellow-500" : ""}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {plan.popular && (
                    <div className="bg-yellow-500 text-white text-xs font-bold text-center py-1">
                      MAIS POPULAR
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      {plan.icon}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold">
                        {formatPrice(plan.price)}
                      </div>
                      {plan.originalPrice && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(plan.originalPrice)}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {getBillingText(plan.billing_cycle)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Métodos de Pagamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Método de Pagamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cartão de Crédito */}
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    paymentMethod === "card" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <CreditCard className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Cartão de Crédito</div>
                      <div className="text-sm text-muted-foreground">
                        Pagamento seguro via Mercado Pago
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* PIX */}
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    paymentMethod === "pix" ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setPaymentMethod("pix")}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <QrCode className="h-6 w-6" />
                    <div>
                      <div className="font-medium">PIX</div>
                      <div className="text-sm text-muted-foreground">
                        QR Code com liberação automática
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpgrade} 
                disabled={isProcessing}
                className="min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <Zap className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Upgrade Agora
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Faça sua Oferta
                </CardTitle>
                <CardDescription>
                  Você tem a liberdade de ofertar o valor que está em seu coração. 
                  O mínimo é R$ 5,00, mas você pode dar mais conforme sua gratidão pelas revelações recebidas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">Valor da Oferta (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="5"
                    step="0.01"
                    placeholder="Ex: 15.00"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Mensagem (opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Compartilhe o que está em seu coração..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">O que você receberá:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Acesso temporário baseado no valor da sua oferta</li>
                    <li>• Acesso estendido às revelações</li>
                    <li>• Gratidão e bênçãos espirituais</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  setPaymentMethod("custom")
                  handleUpgrade()
                }}
                disabled={isProcessing || !customAmount || parseFloat(customAmount.replace(',', '.')) < 1}
                className="min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Enviar Oferta
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* PIX Payment Modal */}
      <PixPaymentModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        onSuccess={handlePixSuccess}
        planType={paymentMethod === "custom" ? "custom" : selectedPlan.id}
        userId={user?.id || ""}
        userEmail={user?.email || ""}
      />
    </Dialog>
  )
}