"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Info } from "lucide-react"

interface Config {
  pixExpirationMinutes: number
  enablePix: boolean
}

interface PixSectionProps {
  config: Config
  setConfig: React.Dispatch<React.SetStateAction<Config>>
  loading: boolean
  saveConfig: () => void
}

export function PixSection({ 
  config, 
  setConfig, 
  loading, 
  saveConfig 
}: PixSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">PIX QRCode</h2>
        <p className="text-muted-foreground">Geração e gerenciamento de QR Codes PIX</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações PIX</CardTitle>
          <CardDescription>
            Configure os parâmetros para geração de QR Codes PIX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              O PIX está habilitado e configurado. Os QR Codes são gerados automaticamente para cada transação.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tempo de Expiração</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={config.pixExpirationMinutes}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    pixExpirationMinutes: parseInt(e.target.value) 
                  }))}
                />
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>
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

          <Button onClick={saveConfig} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}