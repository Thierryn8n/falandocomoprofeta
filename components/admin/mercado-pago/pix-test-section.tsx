"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  QrCode, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Plus,
  Package,
  DollarSign,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MercadoPagoProduct {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category_id: string
  picture_url?: string
  status: 'active' | 'paused' | 'closed'
  created_at: string
  updated_at: string
}

interface MercadoPagoConfig {
  accessToken: string
  publicKey: string
  clientId: string
  clientSecret: string
  enabled: boolean
  testMode: boolean
  webhookUrl: string
  webhookSecret: string
  timeout: number
  retryAttempts: number
  enableCreditCard: boolean
  enableDebitCard: boolean
  enablePix: boolean
  enableBoleto: boolean
  pixExpirationMinutes: number
  boletoExpirationDays: number
  useExternalSystem: boolean
}

interface PixQRCodeData {
  id: string
  status: string
  qr_code: string
  qr_code_base64: string
  transaction_amount: number
  date_created: string
  date_of_expiration: string
  description: string
  external_reference: string
}

interface PixTestSectionProps {
  config: MercadoPagoConfig
  products: MercadoPagoProduct[]
  formatPrice: (price: number) => string
  formatDate: (date: string) => string
  loadProducts: () => Promise<void>
}

export function PixTestSection({
  config,
  products,
  formatPrice,
  formatDate,
  loadProducts
}: PixTestSectionProps) {
  const [selectedProduct, setSelectedProduct] = useState<MercadoPagoProduct | null>(null)
  const [customAmount, setCustomAmount] = useState<number>(0)
  const [description, setDescription] = useState("")
  const [externalReference, setExternalReference] = useState("")
  const [qrCodeData, setQrCodeData] = useState<PixQRCodeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [recentTests, setRecentTests] = useState<PixQRCodeData[]>([])
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: 0,
    category_id: 'others'
  })

  const { toast } = useToast()

  useEffect(() => {
    loadProducts()
    loadRecentTests()
  }, [])

  const loadRecentTests = async () => {
    try {
      const response = await fetch('/api/mercado-pago/pix/recent')
      if (response.ok) {
        const data = await response.json()
        setRecentTests(data)
      }
    } catch (error) {
      console.error('Erro ao carregar testes recentes:', error)
    }
  }

  const validateConfiguration = () => {
    const errors = []
    
    if (!config.accessToken) {
      errors.push("Token de acesso não configurado")
    }
    
    if (!config.publicKey) {
      errors.push("Chave pública não configurada")
    }
    
    if (!config.webhookUrl) {
      errors.push("URL do webhook não configurada")
    }
    
    if (!config.enablePix) {
      errors.push("PIX não está habilitado nas configurações")
    }

    return errors
  }

  const createTestProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/mercado-pago/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          status: 'active',
          currency: 'BRL'
        })
      })

      if (response.ok) {
        const product = await response.json()
        setSelectedProduct(product)
        setShowCreateProduct(false)
        setNewProduct({ title: '', description: '', price: 0, category_id: 'others' })
        await loadProducts()
        toast({
          title: "Sucesso",
          description: "Produto de teste criado com sucesso!"
        })
      } else {
        throw new Error('Falha ao criar produto')
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      toast({
        title: "Erro",
        description: "Falha ao criar produto de teste",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePixQRCode = async () => {
    const configErrors = validateConfiguration()
    if (configErrors.length > 0) {
      toast({
        title: "Configuração Incompleta",
        description: configErrors.join(", "),
        variant: "destructive"
      })
      return
    }

    if (!selectedProduct && customAmount <= 0) {
      toast({
        title: "Erro",
        description: "Selecione um produto ou defina um valor personalizado",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const amount = selectedProduct ? selectedProduct.price : customAmount
      const desc = description || selectedProduct?.title || "Teste PIX"
      const reference = externalReference || `test-${Date.now()}`

      const response = await fetch('/api/mercado-pago/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: desc,
          external_reference: reference,
          expiration_minutes: config.pixExpirationMinutes || 30
        })
      })

      if (response.ok) {
        const data = await response.json()
        setQrCodeData(data)
        await loadRecentTests()
        toast({
          title: "Sucesso",
          description: "QR Code PIX gerado com sucesso!"
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Falha ao gerar QR Code PIX')
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao gerar QR Code PIX",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyPixCode = () => {
    if (qrCodeData?.qr_code) {
      navigator.clipboard.writeText(qrCodeData.qr_code)
      toast({
        title: "Copiado",
        description: "Código PIX copiado para a área de transferência"
      })
    }
  }

  const configErrors = validateConfiguration()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Teste do Sistema PIX</h2>
          <p className="text-muted-foreground">
            Teste a funcionalidade PIX do Mercado Pago com produtos existentes ou valores personalizados
          </p>
        </div>
      </div>

      {/* Validação de Configuração */}
      {configErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuração incompleta:</strong>
            <ul className="mt-2 list-disc list-inside">
              {configErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuração do Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Configurar Teste PIX
            </CardTitle>
            <CardDescription>
              Selecione um produto existente ou configure um valor personalizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seleção de Produto */}
            <div className="space-y-2">
              <Label>Produto para Teste</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedProduct?.id || ""}
                  onValueChange={(value) => {
                    const product = products.find(p => p.id === value)
                    setSelectedProduct(product || null)
                    if (product) {
                      setCustomAmount(0)
                      setDescription(product.description)
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.status === 'active').map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title} - {formatPrice(product.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCreateProduct(true)}
                  title="Criar novo produto"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {products.length === 0 && (
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  Nenhum produto encontrado. Crie um produto primeiro ou use o valor personalizado abaixo.
                </AlertDescription>
              </Alert>
            )}

            {/* Valor Personalizado */}
            <div className="space-y-2">
              <Label htmlFor="customAmount">Valor Personalizado (R$)</Label>
              <Input
                id="customAmount"
                type="number"
                step="0.01"
                min="0"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(parseFloat(e.target.value) || 0)
                  if (parseFloat(e.target.value) > 0) {
                    setSelectedProduct(null)
                  }
                }}
                placeholder="0,00"
                disabled={!!selectedProduct}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do pagamento"
              />
            </div>

            {/* Referência Externa */}
            <div className="space-y-2">
              <Label htmlFor="externalReference">Referência Externa</Label>
              <Input
                id="externalReference"
                value={externalReference}
                onChange={(e) => setExternalReference(e.target.value)}
                placeholder="Referência única (opcional)"
              />
            </div>

            <Button
              onClick={generatePixQRCode}
              disabled={loading || configErrors.length > 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar QR Code PIX
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* QR Code Gerado */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code PIX</CardTitle>
            <CardDescription>
              Use este QR Code para testar o pagamento PIX
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qrCodeData ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${qrCodeData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 border rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Valor:</span>
                    <span className="text-sm">{formatPrice(qrCodeData.transaction_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={qrCodeData.status === 'pending' ? 'secondary' : 'default'}>
                      {qrCodeData.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Expira em:</span>
                    <span className="text-sm">{formatDate(qrCodeData.date_of_expiration)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={copyPixCode}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código PIX
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <QrCode className="w-12 h-12 mb-4" />
                <p>Nenhum QR Code gerado ainda</p>
                <p className="text-sm">Configure os dados acima e clique em "Gerar QR Code PIX"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Testes Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Testes Recentes
          </CardTitle>
          <CardDescription>
            Histórico dos últimos QR Codes PIX gerados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTests.length > 0 ? (
            <div className="space-y-3">
              {recentTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{test.description}</span>
                      <Badge variant={test.status === 'pending' ? 'secondary' : 'default'}>
                        {test.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(test.transaction_amount)} • {formatDate(test.date_created)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatPrice(test.transaction_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <p>Nenhum teste realizado ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Criar Produto */}
      {showCreateProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Criar Produto de Teste</CardTitle>
              <CardDescription>
                Crie um produto rapidamente para testar o PIX
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newTitle">Título</Label>
                <Input
                  id="newTitle"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome do produto"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newDescription">Descrição</Label>
                <Input
                  id="newDescription"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do produto"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPrice">Preço (R$)</Label>
                <Input
                  id="newPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateProduct(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createTestProduct}
                  disabled={loading || !newProduct.title || newProduct.price <= 0}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Criar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}