'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Heart, ArrowLeft } from 'lucide-react'
import { useQuestionLimits } from '@/hooks/use-question-limits'
import { useSupabaseAuth } from '@/hooks/use-supabase-auth'
import { PixDirectTab } from './pix-direct-tab'

export default function DonatePageClient() {
  const router = useRouter()
  const { limits, refresh } = useQuestionLimits()
  const { user } = useSupabaseAuth()
  const [selectedAmount, setSelectedAmount] = useState<number>(10)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4ECD8] to-[#D4C4A8]/20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()}
            className="text-[#8B7355] hover:bg-[#E8DCC8]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose-500" />
              Faça uma Doação
            </h1>
            <p className="text-[#6B5D4C]">
              Adicione mais perguntas ao seu limite diário
            </p>
          </div>
        </div>

        {/* Status atual */}
        {limits && !limits.is_admin && (
          <Card className="mb-8 border-[#D4C4A8] bg-[#FAF3E8]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B5D4C] mb-1">Perguntas restantes hoje</p>
                  <p className="text-2xl font-bold text-[#5C4D3C]">
                    {limits.remaining} <span className="text-sm font-normal text-[#8B7355]">de {limits.max_allowed}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#6B5D4C] mb-1">Reset em</p>
                  <p className="text-lg font-medium text-[#5C4D3C]">
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

        {/* Valor da Doação - PIX Direto */}
        <Card className="border-[#D4C4A8] bg-[#FAF3E8] mb-6">
          <CardContent className="p-4">
            <Label htmlFor="pix-amount" className="text-sm font-medium text-[#5C4D3C]">Valor da Doação (R$)</Label>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg text-[#8B7355]">R$</span>
              <Input
                id="pix-amount"
                type="number"
                min="5"
                step="1"
                value={selectedAmount}
                onChange={(e) => setSelectedAmount(Number(e.target.value))}
                placeholder="Digite o valor"
                className="text-lg font-semibold border-[#D4C4A8] bg-[#F4ECD8] text-[#5C4D3C]"
              />
            </div>
            <p className="text-xs text-[#8B7355] mt-2">
              Mínimo: R$ 5,00 • Valor livre para doação via PIX
            </p>
          </CardContent>
        </Card>
        {user && (
          <PixDirectTab 
            amount={selectedAmount} 
            userEmail={user.email || ''} 
            userName={user.user_metadata?.full_name || user.email?.split('@')[0] || ''} 
          />
        )}

        {/* Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#6B5D4C] mb-4">
            Sua doação ajuda a manter o app funcionando e a melhorar nossos serviços.
          </p>
          <p className="text-xs text-[#8B7355]">
            Pagamentos processados via PIX direto. As perguntas adicionadas são creditadas automaticamente após a confirmação do pagamento.
          </p>
        </div>
      </div>
    </div>
  )
}
