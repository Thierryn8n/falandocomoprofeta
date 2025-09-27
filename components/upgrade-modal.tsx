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
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/abacate-pay"
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
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix" | "abacate_pay" | "custom">("card")
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
        // Priorizar Abacate Pay se habilitado, senão usar o primeiro método habilitado
    const abacatePayEnabled = enabledMethods.find(method => method.method_name === 'abacate_pay')
    const defaultMethod = abacatePayEnabled ? 'card' : 
          enabledMethods[0].method_name === 'pix' ? 'pix' :
          enabledMethods[0].method_name === 'abacate_pay' ? 'abacate_pay' : 'card'
        
        setPaymentMethod(defaultMethod as "card" | "pix" | "abacate_pay" | "custom")
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

    // Se for Abacate Pay, processar pagamento via Abacate Pay
    if (paymentMethod === "abacate_pay") {
      await handleAbacatePayPayment()
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

      // Handle Abacate Pay payment (apenas se Abacate Pay estiver habilitado)
      if (!isMethodEnabled('abacate_pay')) {
        toast({
          title: "Método indisponível",
          description: "Pagamento via Abacate Pay não está disponível no momento",
          variant: "destructive"
        })
        return
      }

      const response = await fetch("/api/abacate-pay/create-payment-intent", {
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

      // Redirect to Abacate Pay Checkout or handle payment
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
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

  const handleAbacatePayPayment = async () => {
    setIsProcessing(true)
    
    try {
      const amount = selectedPlan.price
      
      // Obter configuração do Abacate Pay
      const abacatePayMethod = availablePaymentMethods.find(method => method.method_name === 'abacate_pay')
      const config = abacatePayMethod?.config_data || {}
      
      if (!config.api_key) {
        toast({
          title: "Configuração incompleta",
          description: "Abacate Pay não está configurado corretamente",
          variant: "destructive"
        })
        return
      }

      // Criar cobrança via Abacate Pay usando a nova API de billing
      const response = await fetch("/api/abacate-pay/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          planType: selectedPlan.id,
          userId: user.id,
          userEmail: user.email,
          apiKey: config.api_key
        })
      })

      if (!response.ok) {
        throw new Error("Erro ao criar cobrança via Abacate Pay")
      }

      const result = await response.json()
      
      if (result.success && result.billingUrl) {
        // Redirecionar para a URL de cobrança do Abacate Pay
        window.open(result.billingUrl, '_blank')
        
        toast({
          title: "Cobrança criada!",
          description: "Você será redirecionado para completar o pagamento",
        })
        
        // Fechar modal após um breve delay
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        throw new Error(result.error || "Erro ao criar cobrança")
      }

    } catch (error) {
      console.error("Abacate Pay billing error:", error)
      toast({
        title: "Erro na cobrança",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
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
                {/* Abacate Pay/Cartão de Crédito */}
                {isMethodEnabled('abacate_pay') && (
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
                          Pagamento seguro via Abacate Pay
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* PIX */}
                {isMethodEnabled('pix') && (
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
                )}

                {/* Abacate Pay */}
                {isMethodEnabled('abacate_pay') && (
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      paymentMethod === "abacate_pay" ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setPaymentMethod("abacate_pay")}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <Heart className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="font-medium">Abacate Pay</div>
                        <div className="text-sm text-muted-foreground">
                          Pagamento rápido e seguro
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
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