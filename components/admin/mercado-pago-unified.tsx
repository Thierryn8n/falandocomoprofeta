"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Settings, 
  CreditCard, 
  BarChart3, 
  Package, 
  QrCode,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Server,
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  DashboardSection,
  ConfigSection,
  ProductsSection,
  TransactionsSection,
  AnalyticsSection,
  PixTestSection
} from "@/components/admin/mercado-pago"

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

interface MercadoPagoPreference {
  id: string
  title: string
  description: string
  price: number
  currency: string
  payment_methods: {
    excluded_payment_methods: string[]
    excluded_payment_types: string[]
    installments: number
  }
  external_reference: string
  notification_url: string
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

interface MercadoPagoTransaction {
  id: string
  preference_id: string
  payment_id: string
  status: 'approved' | 'pending' | 'rejected' | 'cancelled'
  status_detail: string
  payment_method: string
  payment_type: string
  amount: number
  currency: string
  payer_email: string
  external_reference: string
  created_at: string
  updated_at: string
}

interface MercadoPagoStats {
  totalRevenue: number
  totalTransactions: number
  approvedTransactions: number
  pendingTransactions: number
  rejectedTransactions: number
  conversionRate: number
  averageTicket: number
  recentTransactions: MercadoPagoTransaction[]
  topPaymentMethods: { method: string; count: number; percentage: number }[]
}

interface PixPayment {
  amount: number
  description: string
  external_reference: string
  expiration_minutes: number
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
}

export default function MercadoPagoUnified() {
  const [config, setConfig] = useState<MercadoPagoConfig>({
    accessToken: '',
    publicKey: '',
    clientId: '',
    clientSecret: '',
    enabled: false,
    testMode: true,
    webhookUrl: '',
    webhookSecret: '',
    timeout: 30000,
    retryAttempts: 3,
    enableCreditCard: true,
    enableDebitCard: true,
    enablePix: true,
    enableBoleto: false,
    pixExpirationMinutes: 30,
    boletoExpirationDays: 3,
    useExternalSystem: false
  })

  const [products, setProducts] = useState<MercadoPagoProduct[]>([])
  const [preferences, setPreferences] = useState<MercadoPagoPreference[]>([])
  const [transactions, setTransactions] = useState<MercadoPagoTransaction[]>([])
  const [stats, setStats] = useState<MercadoPagoStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isPreferenceDialogOpen, setIsPreferenceDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MercadoPagoProduct | null>(null)
  const [editingPreference, setEditingPreference] = useState<MercadoPagoPreference | null>(null)
  const [productForm, setProductForm] = useState<Partial<MercadoPagoProduct>>({
    title: '',
    description: '',
    price: 0,
    category_id: '',
    picture_url: '',
    status: 'active'
  })

  // Estados para PIX QR Code
  const [pixPayment, setPixPayment] = useState<PixPayment>({
    amount: 0,
    description: '',
    external_reference: '',
    expiration_minutes: 30
  })
  const [qrCodeData, setQrCodeData] = useState<PixQRCodeData | null>(null)
  const [recentPixPayments, setRecentPixPayments] = useState<PixQRCodeData[]>([])

  const { toast } = useToast()

  // Sidebar items
  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      requiresInternal: false,
      requiresExternal: false
    },
    {
      id: "config",
      label: "Configurações",
      icon: Settings,
      requiresInternal: false,
      requiresExternal: false
    },
    {
      id: "products",
      label: "Produtos",
      icon: Package,
      requiresInternal: true,
      requiresExternal: false
    },
    {
      id: "transactions",
      label: "Transações",
      icon: CreditCard,
      requiresInternal: true,
      requiresExternal: false
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      requiresInternal: true,
      requiresExternal: false
    },
    {
      id: "pix-test",
      label: "Teste PIX",
      icon: QrCode,
      requiresInternal: true,
      requiresExternal: false
    }
  ]

  // Filter sidebar items based on configuration
  const filteredSidebarItems = sidebarItems.filter(item => {
    // Sempre mostrar Dashboard e Configurações
    if (item.id === "dashboard" || item.id === "config") {
      return true
    }
    
    // Mostrar todas as outras seções sempre, independente da configuração
    // Isso permite que o usuário acesse e configure o sistema mesmo quando desabilitado
    return true
  })

  // Carregar configurações e dados iniciais
  useEffect(() => {
    loadConfig()
  }, [])

  // Carregar dados quando a configuração for habilitada
  useEffect(() => {
    if (config.enabled) {
      loadStats()
      loadProducts()
      loadPreferences()
      loadTransactions()
      loadRecentPixPayments()
    }
  }, [config.enabled])

  const loadConfig = async () => {
    try {
      setLoading(true)
      
      // Simular configuração padrão se a API falhar
      const defaultConfig = {
        accessToken: '',
        publicKey: '',
        clientId: '',
        clientSecret: '',
        enabled: false,
        testMode: true,
        webhookUrl: '',
        webhookSecret: '',
        timeout: 30000,
        retryAttempts: 3,
        enableCreditCard: true,
        enableDebitCard: true,
        enablePix: true,
        enableBoleto: false,
        pixExpirationMinutes: 30,
        boletoExpirationDays: 3,
        useExternalSystem: false
      }
      
      try {
        const response = await fetch('/api/mercado-pago/config')
        if (response.ok) {
          const data = await response.json()
          // Mapear os campos da API para o formato esperado pelo componente
          setConfig({
            accessToken: data.access_token || '',
            publicKey: data.public_key || '',
            clientId: data.client_id || '',
            clientSecret: data.client_secret || '',
            enabled: data.active || false,
            testMode: data.sandbox_mode || true,
            webhookUrl: data.webhook_url || '',
            webhookSecret: '',
            timeout: 30000,
            retryAttempts: 3,
            enableCreditCard: true,
            enableDebitCard: true,
            enablePix: true,
            enableBoleto: false,
            pixExpirationMinutes: 30,
            boletoExpirationDays: 3,
            useExternalSystem: false
          })
        } else {
          // Se a API falhar, usar configuração padrão
          setConfig(defaultConfig)
        }
      } catch (fetchError) {
        console.log('API não disponível, usando configuração padrão')
        setConfig(defaultConfig)
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
      toast({
        title: "Aviso",
        description: "Usando configuração padrão. Configure o Mercado Pago na seção Configurações.",
        variant: "default"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setLoading(true)
      // Mapear os campos do componente para o formato da API
      const apiData = {
        access_token: config.accessToken,
        public_key: config.publicKey,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        webhook_url: config.webhookUrl,
        sandbox_mode: config.testMode,
        active: config.enabled
      }
      
      const response = await fetch('/api/mercado-pago/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações do Mercado Pago salvas com sucesso!"
        })
      } else {
        throw new Error('Falha ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações do Mercado Pago",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/mercado-pago/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/mercado-pago/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const saveProduct = async () => {
    try {
      setLoading(true)
      const method = editingProduct ? 'PUT' : 'POST'
      const url = editingProduct 
        ? `/api/mercado-pago/products/${editingProduct.id}`
        : '/api/mercado-pago/products'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso!`
        })
        setIsProductDialogOpen(false)
        setEditingProduct(null)
        setProductForm({
          title: '',
          description: '',
          price: 0,
          category_id: '',
          picture_url: '',
          status: 'active'
        })
        await loadProducts()
      } else {
        throw new Error('Falha ao salvar produto')
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      toast({
        title: "Erro",
        description: "Falha ao salvar produto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/mercado-pago/products/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Produto deletado com sucesso!"
        })
        await loadProducts()
      } else {
        throw new Error('Falha ao deletar produto')
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
      toast({
        title: "Erro",
        description: "Falha ao deletar produto",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/mercado-pago/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/mercado-pago/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    }
  }

  const loadRecentPixPayments = async () => {
    try {
      const response = await fetch('/api/mercado-pago/pix/recent')
      if (response.ok) {
        const data = await response.json()
        setRecentPixPayments(data)
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos PIX recentes:', error)
    }
  }

  // Helper functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  // Analytics data structure
  const analyticsData = {
    revenue: {
      total: stats?.totalRevenue || 0,
      thisMonth: stats?.totalRevenue || 0,
      lastMonth: 0,
      growth: 0
    },
    transactions: {
      total: stats?.totalTransactions || 0,
      thisMonth: stats?.totalTransactions || 0,
      approved: stats?.approvedTransactions || 0,
      rejected: stats?.rejectedTransactions || 0,
      pending: stats?.pendingTransactions || 0,
      approvalRate: stats?.conversionRate || 0
    },
    products: {
      total: products.length,
      active: products.filter(p => p.status === 'active').length,
      topSelling: []
    },
    paymentMethods: stats?.topPaymentMethods || [],
    customers: {
      total: 0,
      new: 0,
      returning: 0
    },
    timeline: []
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Mercado Pago</h2>
              <p className="text-xs text-muted-foreground">
                Sistema de Pagamentos
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {filteredSidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                config.enabled ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-xs font-medium">
                {config.enabled ? "Sistema Ativo" : "Sistema Inativo"}
              </span>
            </div>
            {config.testMode && (
              <Badge variant="outline" className="text-xs">
                Modo Teste
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {activeSection === "dashboard" && (
            <DashboardSection
              stats={stats}
              loading={loading}
              formatPrice={formatPrice}
              formatDate={formatDate}
            />
          )}

          {activeSection === "config" && (
            <ConfigSection
              config={config}
              setConfig={setConfig}
              loading={loading}
              onSave={saveConfig}
            />
          )}

          {activeSection === "products" && (
            <ProductsSection
              products={products}
              isProductDialogOpen={isProductDialogOpen}
              setIsProductDialogOpen={setIsProductDialogOpen}
              editingProduct={editingProduct}
              setEditingProduct={setEditingProduct}
              productForm={productForm}
              setProductForm={setProductForm}
              loading={loading}
              formatPrice={formatPrice}
              formatDate={formatDate}
              saveProduct={saveProduct}
              deleteProduct={deleteProduct}
              loadProducts={loadProducts}
            />
          )}

          {activeSection === "transactions" && (
            <TransactionsSection
              transactions={transactions}
              loading={loading}
              formatPrice={formatPrice}
              formatDate={formatDate}
              loadTransactions={loadTransactions}
              exportTransactions={async () => {}}
            />
          )}

          {activeSection === "analytics" && (
            <AnalyticsSection
              analytics={analyticsData}
              loading={loading}
              formatPrice={formatPrice}
              formatDate={formatDate}
            />
          )}

          {activeSection === "pix-test" && (
            <PixTestSection
              config={config}
              products={products}
              formatPrice={formatPrice}
              formatDate={formatDate}
              loadProducts={loadProducts}
            />
          )}
        </div>
      </div>
    </div>
  )
}