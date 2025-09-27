"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Key, Globe, Shield, Webhook } from "lucide-react"

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
  currency: string
  country: string
  notificationUrl: string
  backUrl: string
  autoReturn: string
  binaryMode: boolean
}

interface ConfigSectionProps {
  config: MercadoPagoConfig
  setConfig: (config: MercadoPagoConfig | ((prev: MercadoPagoConfig) => MercadoPagoConfig)) => void
  loading: boolean
  testConnection: () => Promise<void>
  saveConfig: () => Promise<void>
}

export function ConfigSection({ 
  config, 
  setConfig, 
  loading, 
  testConnection, 
  saveConfig 
}: ConfigSectionProps) {
  return (
    <div className="space-y-6">
      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configuração da API
          </CardTitle>
          <CardDescription>
            Configure suas credenciais do Mercado Pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="APP_USR-..."
                value={config.accessToken}
                onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key</Label>
              <Input
                id="publicKey"
                placeholder="APP_USR-..."
                value={config.publicKey}
                onChange={(e) => setConfig(prev => ({ ...prev, publicKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="1234567890123456"
                value={config.clientId}
                onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="abcdef..."
                value={config.clientSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="enabled">Sistema Ativo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="testMode"
                checked={config.testMode}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, testMode: checked }))}
              />
              <Label htmlFor="testMode">Modo de Teste</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configuração Regional
          </CardTitle>
          <CardDescription>
            Configure moeda e país para o Mercado Pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select
                value={config.currency}
                onValueChange={(value) => setConfig(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a moeda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                  <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                  <SelectItem value="MXN">Peso Mexicano (MXN)</SelectItem>
                  <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                  <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                  <SelectItem value="PEN">Sol Peruano (PEN)</SelectItem>
                  <SelectItem value="UYU">Peso Uruguaio (UYU)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Select
                value={config.country}
                onValueChange={(value) => setConfig(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BR">Brasil</SelectItem>
                  <SelectItem value="AR">Argentina</SelectItem>
                  <SelectItem value="MX">México</SelectItem>
                  <SelectItem value="CL">Chile</SelectItem>
                  <SelectItem value="CO">Colômbia</SelectItem>
                  <SelectItem value="PE">Peru</SelectItem>
                  <SelectItem value="UY">Uruguai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Configuração de Webhooks
          </CardTitle>
          <CardDescription>
            Configure URLs para receber notificações do Mercado Pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">URL do Webhook</Label>
            <Input
              id="webhookUrl"
              placeholder="https://seusite.com/api/mercado-pago/webhook"
              value={config.webhookUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Webhook Secret</Label>
            <Input
              id="webhookSecret"
              type="password"
              placeholder="seu-webhook-secret"
              value={config.webhookSecret}
              onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notificationUrl">URL de Notificação</Label>
            <Input
              id="notificationUrl"
              placeholder="https://seusite.com/api/mercado-pago/notification"
              value={config.notificationUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, notificationUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backUrl">URL de Retorno</Label>
            <Input
              id="backUrl"
              placeholder="https://seusite.com/success"
              value={config.backUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, backUrl: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações Avançadas
          </CardTitle>
          <CardDescription>
            Configurações técnicas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30000 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retryAttempts">Tentativas de Retry</Label>
              <Input
                id="retryAttempts"
                type="number"
                value={config.retryAttempts}
                onChange={(e) => setConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) || 3 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoReturn">Auto Return</Label>
              <Select
                value={config.autoReturn}
                onValueChange={(value) => setConfig(prev => ({ ...prev, autoReturn: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="binaryMode"
              checked={config.binaryMode}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, binaryMode: checked }))}
            />
            <Label htmlFor="binaryMode">Modo Binário</Label>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={testConnection} variant="outline" disabled={loading}>
          <Shield className="w-4 h-4 mr-2" />
          Testar Conexão
        </Button>
        <Button onClick={saveConfig} disabled={loading}>
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}