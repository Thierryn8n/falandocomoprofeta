'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Gift, 
  Heart, 
  MessageCircle, 
  Sparkles, 
  Crown, 
  ArrowLeft, 
  CreditCard, 
  QrCode,
  Check,
  Loader2,
  Upload
} from 'lucide-react'
import { useDonationPackages } from '@/hooks/use-donation-packages'
import { useQuestionLimits } from '@/hooks/use-question-limits'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { PixDirectTab } from './pix-direct-tab'
import { toast } from 'sonner'

const iconMap: Record<string, React.ReactNode> = {
  'message-circle': <MessageCircle className="h-6 w-6" />,
  'message-square': <MessageCircle className="h-6 w-6" />,
  'sparkles': <Sparkles className="h-6 w-6" />,
  'crown': <Crown className="h-6 w-6" />,
  'gift': <Gift className="h-6 w-6" />,
  'heart': <Heart className="h-6 w-6" />
}

const colorMap: Record<string, string> = {
  'amber': 'from-amber-500 to-orange-500',
  'slate': 'from-slate-500 to-gray-500',
  'yellow': 'from-yellow-400 to-yellow-600',
  'emerald': 'from-emerald-500 to-teal-500',
  'blue': 'from-blue-500 to-cyan-500',
  'purple': 'from-purple-500 to-pink-500'
}

export default function DonatePageClient() {
  const router = useRouter()
  const { packages, loading, createDonation, processingPackage } = useDonationPackages()
  const { limits, refresh } = useQuestionLimits()
  const { user } = useSupabaseAuth()
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'pix_direct'>('pix')
  const [selectedAmount, setSelectedAmount] = useState<number>(10)

  const handleDonate = async (pkg: any) => {
    setSelectedPackage(pkg.id)
    
    const result = await createDonation(pkg.id, paymentMethod)
    
    if (result) {
      toast.success('Redirecionando para o pagamento...')
      // Abrir checkout do Mercado Pago
      window.open(result.initPoint, '_blank')
      
      // Atualizar limites após um tempo
      setTimeout(() => {
        refresh()
      }, 5000)
    } else {
      toast.error('Erro ao criar doação. Tente novamente.')
    }
    
    setSelectedPackage(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose-500" />
              Faça uma Doação
            </h1>
            <p className="text-muted-foreground">
              Adicione mais perguntas ao seu limite diário
            </p>
          </div>
        </div>

        {/* Status atual */}
        {limits && !limits.is_admin && (
          <Card className="mb-8 border-border/60 bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Perguntas restantes hoje</p>
                  <p className="text-2xl font-bold">
                    {limits.remaining} <span className="text-sm font-normal text-muted-foreground">de {limits.max_allowed}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Reset em</p>
                  <p className="text-lg font-medium">
                    {new Date(limits.reset_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Método de pagamento */}
        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'pix' | 'credit_card' | 'pix_direct')} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="pix_direct" className="gap-2">
              <Upload className="h-4 w-4" />
              PIX Direto
            </TabsTrigger>
            <TabsTrigger value="pix" className="gap-2">
              <QrCode className="h-4 w-4" />
              PIX MP
            </TabsTrigger>
            <TabsTrigger value="credit_card" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Cartão
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pix_direct" className="mt-6">
            <Card className="border-border/60 bg-muted/20 mb-6">
              <CardContent className="p-4">
                <Label htmlFor="pix-amount" className="text-sm font-medium">Valor da Doação (R$)</Label>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg text-muted-foreground">R$</span>
                  <Input
                    id="pix-amount"
                    type="number"
                    min="5"
                    step="1"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    placeholder="Digite o valor"
                    className="text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Mínimo: R$ 5,00 • Valor livre para doação
                </p>
              </CardContent>
            </Card>
            {paymentMethod === 'pix_direct' && user && (
              <PixDirectTab 
                amount={selectedAmount} 
                userEmail={user.email || ''} 
                userName={user.user_metadata?.full_name || user.email?.split('@')[0] || ''} 
              />
            )}
          </TabsContent>
          <TabsContent value="pix" className="mt-6">
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-6 text-center">
                <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Pagamento instantâneo via PIX. QR Code válido por 30 minutos.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="credit_card" className="mt-6">
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-6 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Pague com cartão de crédito ou débito. Processamento seguro via Mercado Pago.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pacotes */}
        <div className="grid gap-6 md:grid-cols-2">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[pkg.cardColor] || colorMap.emerald} opacity-[0.03] group-hover:opacity-[0.06] dark:opacity-[0.05] dark:group-hover:opacity-[0.1] transition-opacity`} />
              
              <CardHeader className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[pkg.cardColor] || colorMap.emerald} text-white`}>
                      {iconMap[pkg.icon] || <Gift className="h-6 w-6" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    R$ {pkg.price.toFixed(2)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <span className="font-medium">+{pkg.questionsAdded} perguntas</span>
                  </div>
                  <div className="text-muted-foreground">
                    ({pkg.costPerQuestion}/pergunta)
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Adicionadas instantaneamente
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Nunca expiram
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Usadas após o limite diário
                  </li>
                </ul>

                <Button 
                  className={`w-full gap-2 bg-gradient-to-r ${colorMap[pkg.cardColor] || colorMap.emerald} hover:opacity-90`}
                  onClick={() => handleDonate(pkg)}
                  disabled={processingPackage === pkg.id}
                >
                  {processingPackage === pkg.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Doar R$ {pkg.price.toFixed(2)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Sua doação ajuda a manter o app funcionando e a melhorar nossos serviços.
          </p>
          <p className="text-xs text-muted-foreground">
            Pagamentos processados de forma segura via Mercado Pago.
            As perguntas adicionadas são creditadas automaticamente após a confirmação do pagamento.
          </p>
        </div>
      </div>
    </div>
  )
}
