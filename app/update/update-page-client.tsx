'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ExternalLink, 
  CreditCard, 
  Zap, 
  Crown, 
  Star, 
  Copy,
  Package,
  Calendar,
  MessageCircle,
  DollarSign
} from 'lucide-react'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface ExternalPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval?: 'monthly' | 'yearly' | 'one_time'
  features?: string[]
  external_link: string
  created_at: string
  status: 'active' | 'inactive'
  sort_order?: number
  metadata?: {
    color?: string
    icon?: string
    iconColor?: string
    backgroundColor?: string
    borderColor?: string
    highlight?: boolean
  }
}

interface PaymentSystemConfig {
  activeSystem: 'abacate_pay' | 'mercado_pago'
  systemConfig: {
    useExternalSystem?: boolean
    apiKey?: string
    apiSecret?: string
    publicKey?: string
    environment?: 'sandbox' | 'production'
  }
  plans: ExternalPlan[]
  abacatePayEnabled: boolean
  mercadoPagoEnabled: boolean
}

export default function UpdatePageClient() {
  const { user } = useSupabaseAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [externalPlans, setExternalPlans] = useState<ExternalPlan[]>([])
  const [paymentConfig, setPaymentConfig] = useState<PaymentSystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const iconOptions = [
    { value: 'Calendar', label: 'Calendário', icon: Calendar },
    { value: 'Crown', label: 'Coroa', icon: Crown },
    { value: 'MessageCircle', label: 'Mensagem', icon: MessageCircle },
    { value: 'Package', label: 'Pacote', icon: Package },
    { value: 'Star', label: 'Estrela', icon: Star },
    { value: 'Zap', label: 'Raio', icon: Zap },
    { value: 'DollarSign', label: 'Dólar', icon: DollarSign }
  ]

  useEffect(() => {
    loadPlansAndConfig()
  }, [])

  const loadPlansAndConfig = async () => {
    try {
      setLoading(true)
      
      // Carregar configuração do sistema de pagamento ativo
      const response = await fetch('/api/payment-system/active')
      if (response.ok) {
        const data = await response.json()
        setPaymentConfig(data)
        setExternalPlans(data.plans || [])
      } else {
        console.error('Erro ao carregar configuração do sistema de pagamento:', response.status)
        setError('Erro ao carregar configuração do sistema de pagamento')
        setExternalPlans([])
      }
    } catch (err) {
      console.error('Erro ao carregar planos:', err)
      setError('Erro ao carregar planos')
      setExternalPlans([])
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      })
    }
  }

  const handleExternalPlanClick = (externalLink: string) => {
    window.open(externalLink, '_blank', 'noopener,noreferrer')
  }

  const formatPrice = (price: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName)
    return iconOption ? iconOption.icon : Package
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando planos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadPlansAndConfig}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Planos de Assinatura</h1>
          <p className="text-muted-foreground">
            {paymentConfig?.activeSystem === 'abacate_pay' && paymentConfig?.systemConfig?.useExternalSystem
              ? 'Escolha um plano através do sistema externo Abacate Pay'
              : paymentConfig?.activeSystem === 'mercado_pago'
              ? 'Escolha um plano através do Mercado Pago'
              : 'Escolha um plano para continuar usando nossos serviços'
            }
          </p>
        </div>

        {/* Status do Sistema */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Status do Sistema de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={paymentConfig?.activeSystem === 'abacate_pay' ? "default" : "secondary"}>
                  {paymentConfig?.activeSystem === 'abacate_pay' 
                    ? (paymentConfig?.systemConfig?.useExternalSystem ? 'Abacate Pay Externo' : 'Abacate Pay Interno')
                    : 'Mercado Pago'
                  }
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {paymentConfig?.activeSystem === 'abacate_pay' 
                    ? (paymentConfig?.systemConfig?.useExternalSystem 
                        ? 'Pagamentos processados via Abacate Pay'
                        : 'Pagamentos processados internamente'
                      )
                    : 'Pagamentos processados via Mercado Pago'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planos Disponíveis */}
        {((paymentConfig?.activeSystem === 'abacate_pay' && paymentConfig?.systemConfig?.useExternalSystem) || 
          paymentConfig?.activeSystem === 'mercado_pago') && externalPlans.length > 0 ? (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Planos Externos Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {externalPlans.map((plan) => {
                const IconComponent = getIconComponent(plan.metadata?.icon || 'package')
                const isHighlighted = plan.metadata?.highlight
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative transition-all hover:shadow-lg ${
                      isHighlighted 
                        ? 'border-2 border-primary shadow-lg' 
                        : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: plan.metadata?.backgroundColor || undefined,
                      borderColor: plan.metadata?.borderColor || undefined,
                    }}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">
                          Destaque
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-3">
                        <div 
                          className="p-3 rounded-full"
                          style={{
                            backgroundColor: plan.metadata?.iconColor || 'hsl(var(--primary))',
                            color: 'white'
                          }}
                        >
                          <IconComponent className="h-6 w-6" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {plan.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      
                      <CardDescription className="text-sm mb-3">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Preço */}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-1">
                          {formatPrice(plan.price, plan.currency)}
                        </div>
                        {plan.interval && (
                          <p className="text-sm text-muted-foreground">
                            Por {plan.interval}
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      {plan.features && plan.features.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium text-sm mb-2">Recursos:</h4>
                            <ul className="space-y-1">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-center text-sm">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* Botões de Ação */}
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          className="flex-1 min-w-[120px]" 
                          onClick={() => handleExternalPlanClick(plan.external_link)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Assinar
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2"
                            onClick={() => copyToClipboard(plan.external_link)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2"
                            onClick={() => handleExternalPlanClick(plan.external_link)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : paymentConfig?.activeSystem === 'abacate_pay' && !paymentConfig?.systemConfig?.useExternalSystem ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Sistema Interno Ativo</h2>
            <p className="text-muted-foreground mb-6">
              O sistema de pagamento interno está ativo. Acesse a página de upgrade para ver os planos disponíveis.
            </p>
            <Button onClick={() => router.push('/upgrade')}>
              Ver Planos Internos
            </Button>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">Nenhum Plano Configurado</h2>
            <p className="text-muted-foreground mb-6">
              Não há planos configurados no momento. Entre em contato com o administrador.
            </p>
            <Button variant="outline" onClick={() => router.push('/')}>
              Voltar ao Início
            </Button>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="mt-12 text-center">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Precisa de Ajuda?</h3>
              <p className="text-sm text-muted-foreground">
                Entre em contato conosco se tiver dúvidas sobre os planos ou pagamentos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}