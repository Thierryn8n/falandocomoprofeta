'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Database,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PaymentSystemConfig {
  id?: string
  active_system: 'mercado_pago'
  mercado_pago_enabled: boolean
}

export default function PaymentSystemSelector() {
  const { toast } = useToast()
  const [config, setConfig] = useState<PaymentSystemConfig>({
    active_system: 'mercado_pago',
    mercado_pago_enabled: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingTables, setCreatingTables] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payment-system/config')
      if (response.ok) {
        const data = await response.json()
        // Transform API response to match component state structure
        setConfig({
          active_system: data.activeSystem || 'mercado_pago',
          mercado_pago_enabled: data.mercadoPagoEnabled ?? true
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar configuração do sistema de pagamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      
      // Transform the config to match API expectations
      const apiConfig = {
        activeSystem: 'mercado_pago',
        abacatePayEnabled: false,
        mercadoPagoEnabled: config.mercado_pago_enabled,
        allowSystemSwitch: false
      }
      
      const response = await fetch('/api/payment-system/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig)
      })

      if (response.ok) {
        const result = await response.json()
        // Update local config with the saved data
        setConfig({
          active_system: result.activeSystem,
          mercado_pago_enabled: result.mercadoPagoEnabled
        })
        toast({
          title: "Sucesso",
          description: "Configuração salva com sucesso"
        })
      } else {
        let errorMessage = 'Erro ao salvar configuração'
        try {
          const errorData = await response.json()
          console.error('API Error Response:', errorData)
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          console.error('Response status:', response.status, 'Response statusText:', response.statusText)
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
      
      let errorMessage = 'Erro desconhecido ao salvar configuração'
      let errorDetails = null
      
      if (error instanceof Error) {
        errorMessage = error.message
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      
      // Log additional context
      console.error('Config being saved:', JSON.stringify(config, null, 2))
      const apiConfigStr = JSON.stringify({
        activeSystem: 'mercado_pago',
        mercadoPagoEnabled: config.mercado_pago_enabled,
        allowSystemSwitch: false
      }, null, 2)
      console.error('API config sent:', apiConfigStr)
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const createMercadoPagoTables = async () => {
    try {
      setCreatingTables(true)
      const response = await fetch('/api/mercado-pago/setup', {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Tabelas do Mercado Pago criadas com sucesso"
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao criar tabelas')
      }
    } catch (error) {
      console.error('Erro ao criar tabelas:', error)
      toast({
        title: "Erro",
        description: "Erro ao criar tabelas do Mercado Pago",
        variant: "destructive"
      })
    } finally {
      setCreatingTables(false)
    }
  }

  const updateSystemEnabled = (enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      mercado_pago_enabled: enabled
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Sistemas de Pagamento</h2>
        <p className="text-muted-foreground">
          Configure e gerencie os sistemas de pagamento disponíveis
        </p>
      </div>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Status Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sistema Ativo:</p>
              <Badge variant="default" className="mt-1">
                Mercado Pago
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status:</p>
              <div className="flex gap-2 mt-1">
                {config.mercado_pago_enabled && (
                  <Badge variant="outline">Mercado Pago</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="mercado-pago">Mercado Pago</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Geral</CardTitle>
              <CardDescription>
                Configure qual sistema de pagamento será usado como padrão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mercado Pago</p>
                    <p className="text-sm text-muted-foreground">
                      Gateway de pagamento do Mercado Pago
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.mercado_pago_enabled}
                      onCheckedChange={(checked) => updateSystemEnabled(checked)}
                    />
                    {config.mercado_pago_enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={saveConfig} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configurações'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mercado-pago" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração do Mercado Pago
              </CardTitle>
              <CardDescription>
                Configure o gateway de pagamento do Mercado Pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Configuração do Mercado Pago</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Configure suas credenciais de produção para aceitar pagamentos via Mercado Pago.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={createMercadoPagoTables}
                  disabled={creatingTables}
                  variant="outline"
                >
                  {creatingTables ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando Tabelas...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Criar Tabelas do Mercado Pago
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => window.open('/admin?tab=mercado-pago-config', '_blank')}
                  variant="default"
                  disabled={!config.mercado_pago_enabled}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Credenciais
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Funcionalidades disponíveis:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Configurar credenciais de produção do Mercado Pago</li>
                  <li>Testar conexão com a API</li>
                  <li>Configurar webhooks para notificações</li>
                  <li>Suporte a PIX, cartão de crédito e débito</li>
                  <li>Gerenciar transações e pagamentos</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}