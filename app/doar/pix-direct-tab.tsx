'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode, 
  Copy, 
  Check, 
  Upload, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Clock,
  Banknote,
  ScanLine
} from 'lucide-react'
import { toast } from 'sonner'

interface PixSettings {
  pix_key: string
  pix_key_type: string
  beneficiary_name: string
  enabled: boolean
  instructions: string
}

interface PixDirectTabProps {
  amount: number
  userEmail: string
  userName: string
}

export function PixDirectTab({ amount, userEmail, userName }: PixDirectTabProps) {
  const [settings, setSettings] = useState<PixSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [uploadedReceipt, setUploadedReceipt] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'analyzing' | 'approved' | 'rejected'>('pending')
  const [donationId, setDonationId] = useState<string | null>(null)

  useEffect(() => {
    loadPixSettings()
  }, [])

  const loadPixSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pix_settings')
        .select('*')
        .eq('enabled', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      setSettings(data)
    } catch (error) {
      console.error('Error loading PIX settings:', error)
      toast.error('Erro ao carregar configurações PIX')
    } finally {
      setLoading(false)
    }
  }

  const copyPixKey = () => {
    if (settings?.pix_key) {
      navigator.clipboard.writeText(settings.pix_key)
      setCopied(true)
      toast.success('Chave PIX copiada!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const generatePixCode = () => {
    if (!settings) return ''
    
    // Formato simplificado do PIX Copia e Cola
    // Em produção, use uma biblioteca como @pix-qrcode/core
    const pixData = {
      key: settings.pix_key,
      amount: amount,
      beneficiary: settings.beneficiary_name,
      description: `Doacao FlandoComoProfeta - ${userEmail}`
    }
    
    return `00020126360014BR.GOV.PIX0114${pixData.key}5204000053039865404${pixData.amount.toFixed(2).replace('.', '')}5802BR5902${pixData.beneficiary}6008BRASILIA62070503***6304`
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use: JPG, PNG ou PDF')
      return
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 10MB')
      return
    }

    setReceiptFile(file)
  }

  const submitReceipt = async () => {
    if (!receiptFile || !settings) return

    setUploading(true)
    try {
      const supabase = createClient()
      
      // 1. Criar registro da doação
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: donation, error: donationError } = await supabase
        .from('user_donations')
        .insert({
          user_id: user.id,
          amount: amount,
          status: 'pending_analysis',
          payment_method: 'pix',
          payment_system: 'pix_direct',
          payer_email: userEmail,
          payer_name: userName,
          metadata: {
            pix_key_used: settings.pix_key,
            pix_key_type: settings.pix_key_type,
            beneficiary_name: settings.beneficiary_name,
            submitted_at: new Date().toISOString()
          }
        })
        .select()
        .single()

      if (donationError) throw donationError
      setDonationId(donation.id)

      // 2. Fazer upload do comprovante
      const fileExt = receiptFile.name.split('.').pop()
      const fileName = `receipts/${donation.id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('donations')
        .upload(fileName, receiptFile)

      if (uploadError) throw uploadError

      // 3. Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('donations')
        .getPublicUrl(fileName)

      setUploadedReceipt(publicUrl)

      // 4. Atualizar doação com URL do comprovante
      await supabase
        .from('user_donations')
        .update({ 
          receipt_url: publicUrl,
          status: 'analyzing'
        })
        .eq('id', donation.id)

      setVerificationStatus('analyzing')
      
      // 5. Iniciar análise por IA
      await analyzeReceipt(donation.id, publicUrl, receiptFile.type)

      toast.success('Comprovante enviado! Analisando...')
    } catch (error) {
      console.error('Error submitting receipt:', error)
      toast.error('Erro ao enviar comprovante')
    } finally {
      setUploading(false)
    }
  }

  const analyzeReceipt = async (donationId: string, receiptUrl: string, fileType: string) => {
    try {
      const response = await fetch('/api/donations/analyze-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donationId,
          receiptUrl,
          fileType,
          expectedAmount: amount,
          expectedPayerName: userName,
          expectedPixKey: settings?.pix_key
        })
      })

      if (!response.ok) throw new Error('Analysis failed')

      const result = await response.json()
      
      if (result.approved) {
        setVerificationStatus('approved')
        toast.success('Pagamento validado com sucesso! Acesso liberado.')
      } else {
        setVerificationStatus('rejected')
        toast.error('Comprovante não validado. ' + result.reason)
      }
    } catch (error) {
      console.error('Error analyzing receipt:', error)
      setVerificationStatus('rejected')
      toast.error('Erro na análise. Tente novamente ou contate o suporte.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando configurações PIX...</p>
      </div>
    )
  }

  if (!settings || !settings.enabled) {
    return (
      <Alert variant="destructive" className="border-destructive/20">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Serviço indisponível</AlertTitle>
        <AlertDescription>
          PIX direto não está disponível no momento. Por favor, use o PIX via Mercado Pago ou cartão de crédito.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header com valor */}
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="text-lg px-4 py-1.5">
          <Banknote className="h-4 w-4 mr-2" />
          Valor: R$ {amount.toFixed(2)}
        </Badge>
        <p className="text-sm text-muted-foreground">
          Sua doação será processada após confirmação do comprovante
        </p>
      </div>

      {/* QR Code e Chave PIX */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ScanLine className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Pague com PIX</CardTitle>
              <CardDescription className="text-xs">
                Escaneie o QR Code ou use a chave PIX
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Placeholder melhorado */}
          <div className="flex justify-center">
            <div className="relative bg-background p-5 rounded-xl border border-border/80 shadow-sm">
              {/* Borda decorativa */}
              <div className="absolute inset-0 rounded-xl border-2 border-dashed border-primary/20 m-1" />
              
              <div className="relative w-44 h-44 bg-muted rounded-lg flex flex-col items-center justify-center gap-3">
                <div className="p-4 rounded-full bg-primary/10">
                  <QrCode className="h-12 w-12 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground font-medium text-center px-4">
                  QR Code será gerado aqui
                </p>
              </div>
              
              {/* Badge de valor */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <Badge variant="outline" className="bg-background shadow-sm">
                  R$ {amount.toFixed(2)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Chave PIX */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <span>Chave PIX</span>
              <Badge variant="secondary" className="text-[10px] font-normal">
                {settings.pix_key_type}
              </Badge>
            </Label>
            <div className="flex gap-2">
              <Input
                value={settings.pix_key}
                readOnly
                className="font-mono text-sm bg-muted/50 border-border/60"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyPixKey}
                className={copied ? 'bg-primary/10 border-primary/30 text-primary' : 'hover:bg-muted'}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Beneficiário: <span className="font-medium text-foreground">{settings.beneficiary_name}</span>
            </p>
          </div>

          <Separator />

          {/* Código PIX Copia e Cola */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">PIX Copia e Cola</Label>
            <div className="relative">
              <textarea
                value={generatePixCode()}
                readOnly
                className="w-full h-28 p-3 pr-20 text-xs font-mono bg-muted/50 border border-border/60 rounded-md resize-none focus:outline-none"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatePixCode())
                  toast.success('Código PIX copiado!')
                }}
                className="absolute top-2 right-2 h-7"
              >
                <Copy className="h-3 w-3 mr-1.5" />
                Copiar
              </Button>
            </div>
          </div>

          {/* Instruções */}
          <Alert className="bg-muted/50 border-border/60">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="text-sm text-muted-foreground">
              {settings.instructions}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload de Comprovante */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Validação por IA</CardTitle>
              <CardDescription className="text-xs">
                Envie o comprovante para liberação automática
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {verificationStatus === 'pending' && (
            <>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  receiptFile 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer block">
                  <div className="flex flex-col items-center gap-3">
                    {receiptFile ? (
                      <>
                        <div className="p-3 rounded-full bg-primary/10">
                          {receiptFile.type.includes('pdf') ? (
                            <FileText className="h-8 w-8 text-primary" />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-primary" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{receiptFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-muted">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Clique para anexar comprovante</p>
                          <p className="text-xs text-muted-foreground">
                            Formatos: JPG, PNG ou PDF • Máx. 10MB
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {receiptFile && (
                <Button
                  onClick={submitReceipt}
                  disabled={uploading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analisando comprovante...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirmar e Enviar
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {verificationStatus === 'analyzing' && (
            <Alert className="border-amber-500/20 bg-amber-500/10">
              <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
              <AlertTitle className="text-amber-700 dark:text-amber-400">Analisando comprovante</AlertTitle>
              <AlertDescription className="text-amber-600 dark:text-amber-500 text-sm">
                Nossa IA está verificando os dados do pagamento. 
                <span className="block mt-1 flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  Isso pode levar até 2 minutos
                </span>
              </AlertDescription>
            </Alert>
          )}

          {verificationStatus === 'approved' && (
            <Alert className="border-emerald-500/20 bg-emerald-500/10">
              <Check className="h-5 w-5 text-emerald-600" />
              <AlertTitle className="text-emerald-700 dark:text-emerald-400">Pagamento confirmado!</AlertTitle>
              <AlertDescription className="text-emerald-600 dark:text-emerald-500 text-sm">
                Seu acesso foi liberado. Obrigado por apoiar o Falando Como Profeta!
              </AlertDescription>
            </Alert>
          )}

          {verificationStatus === 'rejected' && (
            <Alert variant="destructive" className="border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Comprovante não validado</AlertTitle>
              <AlertDescription className="text-sm">
                Não foi possível confirmar o pagamento. Verifique se o valor e dados estão corretos.
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVerificationStatus('pending')
                    setReceiptFile(null)
                  }}
                  className="mt-3 w-full"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Tentar Novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
