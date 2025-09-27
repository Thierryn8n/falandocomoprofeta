"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
  Server
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Import dos novos componentes
import {
  DashboardSection,
  ConfigSection,
  PixSection,
  BillingSection,
  TransactionsSection,
  AnalyticsSection,
  ExternalPlanDialog,
  ExternalLinksSection
} from "./abacate-pay"

interface AbacatePayConfig {
  apiKey: string
  apiUrl: string
  enabled: boolean
  testMode: boolean
  webhookUrl: string
  webhookSecret: string
  timeout: number
  retryAttempts: number
  purchaseLinkTemplate: string
  enablePurchaseLinks: boolean
  enablePix: boolean
  pixExpirationMinutes: number
  useExternalSystem: boolean
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

interface ExternalPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly' | 'one_time'
  features: string[]
  status: 'active' | 'inactive'
  external_id: string
  provider: string
  created_at: string
  updated_at: string
  ui_config?: {
    customTitle?: string
    customDescription?: string
    backgroundColor?: string
    textColor?: string
    buttonColor?: string
    icon?: string
    highlight?: boolean
  }
}

interface ExternalLink {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly' | 'one_time'
  features: string[]
  external_link: string
  external_id: string
  provider: string
  status: 'active' | 'inactive' | 'draft'
  sort_order: number
  metadata: {
    color?: string
    icon?: string
    highlight?: boolean
  }
  created_at: string
  updated_at: string
}

interface Transaction {
  id: string
  product_id: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  payment_method: string
  customer_email: string
  created_at: string
  updated_at: string
}

interface DashboardStats {
  totalRevenue: number
  totalTransactions: number
  activeProducts: number
  conversionRate: number
  todayRevenue: number
  monthlyGrowth: number
}

export function AbacatePayUnified() {
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [loading, setLoading] = useState(false)
  
  // Configuration state
  const [config, setConfig] = useState<AbacatePayConfig>({
    apiKey: '',
    apiUrl: 'https://api.abacatepay.com',
    enabled: false,
    testMode: true,
    webhookUrl: '',
    webhookSecret: '',
    timeout: 30000,
    retryAttempts: 3,
    purchaseLinkTemplate: 'https://checkout.abacatepay.com/{product_id}',
    enablePurchaseLinks: true,
    enablePix: true,
    pixExpirationMinutes: 30,
    useExternalSystem: false
  })

  // Data states
  const [products, setProducts] = useState<Product[]>([])
  const [externalPlans, setExternalPlans] = useState<ExternalPlan[]>([])
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    activeProducts: 0,
    conversionRate: 0,
    todayRevenue: 0,
    monthlyGrowth: 0
  })

  // Dialog states
  const [showExternalPlanDialog, setShowExternalPlanDialog] = useState(false)
  const [selectedExternalPlan, setSelectedExternalPlan] = useState<ExternalPlan | null>(null)
  const [externalPlanForm, setExternalPlanForm] = useState({
    name: '',
    description: '',
    price: 0,
    interval: 'monthly' as 'monthly' | 'yearly' | 'one_time',
    features: [''],
    external_id: '',
    provider: 'stripe',
    ui_config: {
      customTitle: '',
      customDescription: '',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonColor: '#ff8100',
      icon: '',
      highlight: false
    }
  })

  // Load functions
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/abacate-pay/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/abacate-pay/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const loadExternalPlans = async () => {
    try {
      const response = await fetch('/api/abacate-pay/external-plans')
      if (response.ok) {
        const data = await response.json()
        setExternalPlans(data)
      }
    } catch (error) {
      console.error('Erro ao carregar planos externos:', error)
    }
  }

  const loadExternalLinks = async () => {
    try {
      const response = await fetch('/api/abacate-pay/external-links')
      if (response.ok) {
        const result = await response.json()
        setExternalLinks(result.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar links externos:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/abacate-pay/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/abacate-pay/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const testWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/abacate-pay/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: config.webhookUrl })
      })
      
      if (response.ok) {
        toast({
          title: "Webhook testado com sucesso",
          description: "O webhook está funcionando corretamente"
        })
      } else {
        throw new Error('Falha no teste do webhook')
      }
    } catch (error) {
      toast({
        title: "Erro no teste do webhook",
        description: "Verifique a URL e tente novamente",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const applyQuickCustomization = (template: 'standard' | 'premium' | 'highlight') => {
    const templates = {
      standard: {
        backgroundColor: '#ffffff',
        textColor: '#333333',
        buttonColor: '#007bff',
        highlight: false
      },
      premium: {
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        buttonColor: '#ffd700',
        highlight: false
      },
      highlight: {
        backgroundColor: '#ff8100',
        textColor: '#ffffff',
        buttonColor: '#ffffff',
        highlight: true
      }
    }

    const selectedTemplate = templates[template]
    setExternalPlanForm(prev => ({
      ...prev,
      ui_config: {
        ...prev.ui_config,
        ...selectedTemplate
      }
    }))

    toast({
      title: "Template aplicado",
      description: `Configuração ${template} aplicada com sucesso!`
    })
  }

  const saveConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/abacate-pay/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        toast({
          title: "Configuração salva",
          description: "As configurações foram salvas com sucesso"
        })
      } else {
        throw new Error('Falha ao salvar configuração')
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveExternalPlan = async () => {
    setLoading(true)
    try {
      const url = selectedExternalPlan 
        ? `/api/abacate-pay/external-plans/${selectedExternalPlan.id}`
        : '/api/abacate-pay/external-plans'
      
      const method = selectedExternalPlan ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(externalPlanForm)
      })
      
      if (response.ok) {
        toast({
          title: selectedExternalPlan ? "Plano atualizado" : "Plano criado",
          description: selectedExternalPlan 
            ? "O plano foi atualizado com sucesso" 
            : "O plano foi criado com sucesso"
        })
        setShowExternalPlanDialog(false)
        loadExternalPlans()
        resetExternalPlanForm()
      } else {
        throw new Error('Falha ao salvar plano')
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o plano",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetExternalPlanForm = () => {
    setExternalPlanForm({
      name: '',
      description: '',
      price: 0,
      interval: 'monthly',
      features: [''],
      external_id: '',
      provider: 'stripe',
      ui_config: {
        customTitle: '',
        customDescription: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        buttonColor: '#ff8100',
        icon: '',
        highlight: false
      }
    })
    setSelectedExternalPlan(null)
  }

  const editExternalPlan = (plan: ExternalPlan) => {
    setSelectedExternalPlan(plan)
    setExternalPlanForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      interval: plan.interval,
      features: plan.features,
      external_id: plan.external_id,
      provider: plan.provider,
      ui_config: plan.ui_config || {
        customTitle: '',
        customDescription: '',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        buttonColor: '#ff8100',
        icon: '',
        highlight: false
      }
    })
    setShowExternalPlanDialog(true)
  }

  const deleteExternalPlan = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return
    
    try {
      const response = await fetch(`/api/abacate-pay/external-plans/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Plano excluído",
          description: "O plano foi excluído com sucesso"
        })
        loadExternalPlans()
      } else {
        throw new Error('Falha ao excluir plano')
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o plano",
        variant: "destructive"
      })
    }
  }

  // External Links Management Functions
  const addExternalLink = async (linkData: Omit<ExternalLink, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/abacate-pay/external-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkData)
      })
      
      if (response.ok) {
        toast({
          title: "Link adicionado",
          description: "O link externo foi adicionado com sucesso"
        })
        loadExternalLinks()
      } else {
        throw new Error('Falha ao adicionar link')
      }
    } catch (error) {
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o link",
        variant: "destructive"
      })
    }
  }

  const updateExternalLink = async (id: string, linkData: Partial<ExternalLink>) => {
    try {
      const response = await fetch(`/api/abacate-pay/external-links/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(linkData)
      })
      
      if (response.ok) {
        toast({
          title: "Link atualizado",
          description: "O link externo foi atualizado com sucesso"
        })
        loadExternalLinks()
      } else {
        throw new Error('Falha ao atualizar link')
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o link",
        variant: "destructive"
      })
    }
  }

  const deleteExternalLink = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este link?')) return
    
    try {
      const response = await fetch(`/api/abacate-pay/external-links/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast({
          title: "Link excluído",
          description: "O link externo foi excluído com sucesso"
        })
        loadExternalLinks()
      } else {
        throw new Error('Falha ao excluir link')
      }
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o link",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadConfig()
    loadProducts()
    loadExternalPlans()
    loadExternalLinks()
    loadTransactions()
    loadStats()
  }, [])

  // Helper functions
  const formatPrice = (price: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      cancelled: "bg-muted text-muted-foreground",
      active: "bg-green-100 text-green-800",
      inactive: "bg-muted text-muted-foreground"
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status === 'pending' && 'Pendente'}
        {status === 'paid' && 'Pago'}
        {status === 'expired' && 'Expirado'}
        {status === 'cancelled' && 'Cancelado'}
        {status === 'active' && 'Ativo'}
        {status === 'inactive' && 'Inativo'}
      </Badge>
    )
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, requiresInternal: false },
    { id: "config", label: "Configuração API", icon: Settings, requiresInternal: false },
    { id: "pix", label: "PIX QRCode", icon: QrCode, requiresInternal: true },
    { id: "billing", label: "Sistema de Cobrança", icon: Package, requiresInternal: true },
    { id: "transactions", label: "Transações", icon: CreditCard, requiresInternal: true },
    { id: "analytics", label: "Análises", icon: TrendingUp, requiresInternal: false },
    { id: "external-links", label: "Links Externos", icon: ExternalLink, requiresInternal: false, requiresExternal: true }
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Modern Sidebar */}
      <div className="w-64 bg-card shadow-lg border-r border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ff8100" }}>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Abacate Pay</h2>
              <p className="text-sm text-muted-foreground">Sistema de Pagamentos</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems
            .filter(item => {
              // Se requer sistema interno e estamos usando externo, não mostrar
              if (item.requiresInternal && config.useExternalSystem) return false
              // Se requer sistema externo e estamos usando interno, não mostrar
              if (item.requiresExternal && !config.useExternalSystem) return false
              return true
            })
            .map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              } ${
                (item.requiresInternal && config.useExternalSystem) || 
                (item.requiresExternal && !config.useExternalSystem)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                (item.requiresInternal && config.useExternalSystem) || 
                (item.requiresExternal && !config.useExternalSystem)
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard de Pagamentos</h1>
            <p className="text-muted-foreground">Gerencie seu sistema de pagamentos Abacate Pay</p>
          </div>

          {/* Sistema Interno vs Externo Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuração do Sistema
              </CardTitle>
              <CardDescription>
                Escolha entre usar o sistema interno ou links externos do Abacate Pay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-blue-500" />
                  <div>
                    <Label htmlFor="system-toggle" className="text-sm font-medium">
                      {config.useExternalSystem ? 'Sistema Externo' : 'Sistema Interno'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {config.useExternalSystem 
                        ? 'Usando links diretos do Abacate Pay' 
                        : 'Usando sistema interno de produtos'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="system-toggle" className="text-sm">
                    Interno
                  </Label>
                  <Switch
                    id="system-toggle"
                    checked={config.useExternalSystem}
                    onCheckedChange={(checked) => {
                      setConfig(prev => ({ ...prev, useExternalSystem: checked }))
                      saveConfig({ ...config, useExternalSystem: checked })
                      
                      // Redirecionar para página apropriada baseado no sistema
                      const currentItem = sidebarItems.find(item => item.id === activeSection)
                      if (currentItem) {
                        // Se a página atual não é compatível com o novo sistema, redirecionar
                        if ((currentItem.requiresInternal && checked) || 
                            (currentItem.requiresExternal && !checked)) {
                          // Redirecionar para dashboard como página segura
                          setActiveSection("dashboard")
                        }
                      }
                      
                      // Se mudou para sistema externo e não está em external-links, redirecionar
                      if (checked && activeSection !== "external-links" && activeSection !== "dashboard" && activeSection !== "config" && activeSection !== "analytics") {
                        setActiveSection("external-links")
                      }
                    }}
                  />
                  <Label htmlFor="system-toggle" className="text-sm">
                    Externo
                  </Label>
                  <ExternalLink className="w-4 h-4 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {activeSection === "dashboard" && (
            <DashboardSection 
              stats={stats}
              transactions={transactions}
              formatPrice={formatPrice}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          )}

          {activeSection === "config" && (
            <ConfigSection 
              config={config}
              setConfig={setConfig}
              loading={loading}
              testWebhook={testWebhook}
              saveConfig={saveConfig}
            />
          )}

          {activeSection === "pix" && (
            <PixSection 
              config={config}
              setConfig={setConfig}
              loading={loading}
              saveConfig={saveConfig}
            />
          )}

          {activeSection === "billing" && (
            <BillingSection 
              externalPlans={externalPlans}
              formatPrice={formatPrice}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
              onAddPlan={() => {
                setSelectedExternalPlan(null)
                setExternalPlanForm({
                  name: '',
                  description: '',
                  price: 0,
                  interval: 'monthly',
                  features: [''],
                  external_id: '',
                  provider: 'stripe',
                  ui_config: {
                    customTitle: '',
                    customDescription: '',
                    backgroundColor: '#ffffff',
                    textColor: '#000000',
                    buttonColor: '#ff8100',
                    icon: '',
                    highlight: false
                  }
                })
                setShowExternalPlanDialog(true)
              }}
              onEditPlan={(plan) => {
                setSelectedExternalPlan(plan)
                setExternalPlanForm({
                  name: plan.name,
                  description: plan.description,
                  price: plan.price,
                  interval: plan.interval,
                  features: plan.features,
                  external_id: plan.external_id,
                  provider: plan.provider,
                  ui_config: plan.ui_config || {
                    customTitle: '',
                    customDescription: '',
                    backgroundColor: '#ffffff',
                    textColor: '#000000',
                    buttonColor: '#ff8100',
                    icon: '',
                    highlight: false
                  }
                })
                setShowExternalPlanDialog(true)
              }}
              onDeletePlan={deleteExternalPlan}
            />
          )}

          {activeSection === "transactions" && (
            <TransactionsSection 
              transactions={transactions}
              formatPrice={formatPrice}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          )}

          {activeSection === "analytics" && (
            <AnalyticsSection 
              stats={stats}
              formatPrice={formatPrice}
            />
          )}

          {activeSection === "external-links" && config.useExternalSystem && (
            <ExternalLinksSection 
              externalLinks={externalLinks}
              onAddLink={addExternalLink}
              onEditLink={updateExternalLink}
              onDeleteLink={deleteExternalLink}
              formatPrice={formatPrice}
              formatDate={formatDate}
              getStatusBadge={getStatusBadge}
            />
          )}
        </div>
      </div>

      {/* External Plan Dialog */}
      <ExternalPlanDialog 
        open={showExternalPlanDialog}
        onOpenChange={setShowExternalPlanDialog}
        selectedPlan={selectedExternalPlan}
        form={externalPlanForm}
        setForm={setExternalPlanForm}
        onSave={saveExternalPlan}
        formatPrice={formatPrice}
      />
    </div>
  )
}