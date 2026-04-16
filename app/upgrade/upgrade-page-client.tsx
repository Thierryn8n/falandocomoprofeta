'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Zap, Heart, CreditCard, QrCode, ArrowLeft, Star, Calendar } from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { useSubscriptionPlans } from '@/hooks/use-subscription-plans'
import { toast } from 'sonner'

interface SubscriptionPlan {
  id: string
  plan_type: 'monthly' | 'yearly'
  price: number
  features: string[]
  is_active: boolean
  mercado_pago_price_id?: string
  mercado_pago_payment_link?: string
  card_color?: string
  card_title?: string
  card_description?: string
}

export default function UpgradePageClient() {
  const router = useRouter()
  const { user } = useSupabaseAuth()
  const { plans, loading, error } = useSubscriptionPlans()
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price)
  }

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'monthly':
        return <Calendar className="h-6 w-6" />
      case 'yearly':
        return <Crown className="h-6 w-6" />
      default:
        return <Heart className="h-6 w-6" />
    }
  }

  const getPlanName = (planType: string) => {
    return planType === 'monthly' ? 'Plano Mensal' : 'Plano Anual'
  }

  const getDefaultDescription = (planType: string) => {
    return planType === 'monthly' 
      ? 'Acesso completo por 1 mês' 
      : 'Acesso completo por 1 ano com desconto'
  }

  const getPlanDescription = (planType: string) => {
    switch (planType) {
      case 'monthly':
        return 'Acesso ilimitado por 1 mês'
      case 'yearly':
        return 'Acesso ilimitado por 1 ano (2 meses grátis)'
      default:
        return 'Acesso ilimitado'
    }
  }

  const getOriginalPrice = (planType: string, price: number) => {
    if (planType === 'yearly') {
      return price * 12 / 10 // Assuming 20% discount for yearly
    }
    return undefined
  }

  const getSavings = (planType: string, price: number) => {
    if (planType === 'yearly') {
      const originalPrice = getOriginalPrice(planType, price)
      if (originalPrice) {
        const savings = originalPrice - price
        return `Economize ${formatPrice(savings)}`
      }
    }
    return undefined
  }

  const handleMercadoPagoCheckout = async (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error('Você precisa estar logado para fazer uma assinatura')
      return
    }
    
    setProcessingPlan(plan.id)
    
    try {
      // Criar pagamento via Mercado Pago
      const response = await fetch('/api/mercado-pago/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.price * 100, // Convert to cents
          planType: plan.plan_type,
          userId: user.id,
          userEmail: user.email,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar checkout')
      }
      
      if (data.initPoint) {
        window.open(data.initPoint, '_blank')
        toast.success('Redirecionando para pagamento...')
      } else {
        throw new Error('URL de checkout não encontrada')
      }
    } catch (error) {
      console.error('Erro no checkout Mercado Pago:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento')
    } finally {
      setProcessingPlan(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff8100] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando planos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar planos: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Escolha seu <span className="text-[#ff8100]">Plano</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
              Desbloqueie todo o potencial da nossa plataforma com acesso completo a todas as funcionalidades.
            </p>
          </div>
        {/* Grid de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg ${
                plan.plan_type === 'yearly' 
                  ? 'border-[#ff8100] shadow-lg scale-105' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-[#ff8100]/50'
              }`}
              style={{
                borderColor: plan.card_color || (plan.plan_type === 'yearly' ? '#ff8100' : '#e5e7eb')
              }}
            >
              {/* Badge Popular */}
              {plan.plan_type === 'yearly' && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-[#ff8100] to-[#ff6b00] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                {/* Ícone */}
                <div className="flex justify-center mb-3">
                  <div className={`p-2 rounded-lg ${
                    plan.plan_type === 'yearly' 
                      ? 'bg-[#ff8100] text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {getPlanIcon(plan.plan_type)}
                  </div>
                </div>

                {/* Nome do Plano */}
                <h3 className="text-lg font-bold mb-2">
                  {plan.card_title || (plan.plan_type === 'monthly' ? 'Plano Mensal' : 'Plano Anual')}
                </h3>

                {/* Descrição */}
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {plan.card_description || (plan.plan_type === 'monthly' 
                    ? 'Acesso completo por 1 mês' 
                    : 'Acesso completo por 1 ano com desconto'
                  )}
                </p>

                {/* Preço */}
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold" style={{ color: plan.card_color || '#ff8100' }}>
                      R$ {plan.price}
                    </span>
                    {plan.plan_type === 'yearly' && (
                      <span className="text-sm text-gray-500 line-through">
                        R$ {(parseFloat(plan.price) * 1.5).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {plan.plan_type === 'monthly' ? 'por mês' : 'por ano'}
                  </p>
                  {plan.plan_type === 'yearly' && (
                    <p className="text-xs text-green-600 font-semibold mt-1">
                      Economize 33%
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Botão */}
                <Button
                  onClick={() => handleMercadoPagoCheckout(plan)}
                  disabled={processingPlan === plan.id}
                  className={`w-full py-2 text-sm font-semibold transition-all duration-300 ${
                    plan.plan_type === 'yearly'
                      ? 'bg-gradient-to-r from-[#ff8100] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff5500] text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 border-2 border-[#ff8100] text-[#ff8100] hover:bg-[#ff8100] hover:text-white'
                  }`}
                >
                  {processingPlan === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    'Assinar Agora'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Garantia e Suporte */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-[#ff8100]/5 to-[#ff8100]/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3">Garantia de Satisfação</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              Oferecemos suporte completo e garantia de satisfação. 
              Cancele a qualquer momento sem complicações.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}