"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Zap } from "lucide-react"

interface Config {
  apiKey: string
  apiUrl: string
  webhookUrl: string
  webhookSecret: string
  timeout: number
  retryAttempts: number
  pixExpirationMinutes: number
  enabled: boolean
  testMode: boolean
  enablePurchaseLinks: boolean
  enablePix: boolean
}

interface ConfigSectionProps {
  config: Config
  setConfig: React.Dispatch<React.SetStateAction<Config>>
  loading: boolean
  saveConfig: () => void
  testWebhook: () => void
}

export function ConfigSection({ 
  config, 
  setConfig, 
  loading, 
  saveConfig, 
  testWebhook 
}: ConfigSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração da API</CardTitle>
          <CardDescription>
            Configure as credenciais e parâmetros da API do Abacate Pay
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Chave da API</Label>
              <Input
                id="apiKey"
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Sua chave da API"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiUrl">URL da API</Label>
              <Input
                id="apiUrl"
                value={config.apiUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                placeholder="https://api.abacatepay.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL do Webhook</Label>
              <Input
                id="webhookUrl"
                value={config.webhookUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://seusite.com/webhook"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Segredo do Webhook</Label>
              <Input
                id="webhookSecret"
                type="password"
                value={config.webhookSecret}
                onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                placeholder="Segredo para validação"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retryAttempts">Tentativas de Retry</Label>
              <Input
                id="retryAttempts"
                type="number"
                value={config.retryAttempts}
                onChange={(e) => setConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pixExpiration">Expiração PIX (min)</Label>
              <Input
                id="pixExpiration"
                type="number"
                value={config.pixExpirationMinutes}
                onChange={(e) => setConfig(prev => ({ ...prev, pixExpirationMinutes: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sistema Habilitado</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar/desativar o sistema de pagamentos
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo de Teste</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar ambiente de teste
                  </p>
                </div>
                <Switch
                  checked={config.testMode}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, testMode: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Links de Compra</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar geração de links
                  </p>
                </div>
                <Switch
                  checked={config.enablePurchaseLinks}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enablePurchaseLinks: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>PIX Habilitado</Label>
                  <p className="text-sm text-muted-foreground">
                    Aceitar pagamentos via PIX
                  </p>
                </div>
                <Switch
                  checked={config.enablePix}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enablePix: checked }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button onClick={saveConfig} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Configurações
            </Button>
            <Button variant="outline" onClick={testWebhook} disabled={loading}>
              <Zap className="w-4 h-4 mr-2" />
              Testar Webhook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}