"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Save, Smartphone, Tablet, Monitor } from "lucide-react"

export function MobileSettingsConfig() {
  const [config, setConfig] = useState({
    mobileLayout: "responsive",
    touchGestures: true,
    swipeNavigation: true,
    pullToRefresh: true,
    vibration: false,
    fullscreen: false,
    orientation: "auto",
    fontSize: "medium",
    buttonSize: "medium",
    spacing: "normal",
  })

  const { toast } = useToast()

  const handleInputChange = (field: string, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações mobile foram atualizadas com sucesso.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Configurações Mobile</h1>
        <p className="text-muted-foreground">Otimize a experiência para dispositivos móveis</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Layout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Layout Mobile
            </CardTitle>
            <CardDescription>Configure o layout para smartphones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile-layout">Tipo de Layout</Label>
              <Select value={config.mobileLayout} onValueChange={(value) => handleInputChange("mobileLayout", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsive">Responsivo (Padrão)</SelectItem>
                  <SelectItem value="mobile-first">Mobile First</SelectItem>
                  <SelectItem value="adaptive">Adaptativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orientation">Orientação</Label>
              <Select value={config.orientation} onValueChange={(value) => handleInputChange("orientation", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automática</SelectItem>
                  <SelectItem value="portrait">Retrato</SelectItem>
                  <SelectItem value="landscape">Paisagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tela Cheia</Label>
                  <p className="text-xs text-muted-foreground">Ocultar barra de status</p>
                </div>
                <Switch
                  checked={config.fullscreen}
                  onCheckedChange={(checked) => handleInputChange("fullscreen", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Touch & Gestures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tablet className="h-5 w-5" />
              Gestos e Toque
            </CardTitle>
            <CardDescription>Configure interações por toque</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gestos de Toque</Label>
                  <p className="text-xs text-muted-foreground">Ativar gestos personalizados</p>
                </div>
                <Switch
                  checked={config.touchGestures}
                  onCheckedChange={(checked) => handleInputChange("touchGestures", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Navegação por Deslize</Label>
                  <p className="text-xs text-muted-foreground">Deslizar para navegar</p>
                </div>
                <Switch
                  checked={config.swipeNavigation}
                  onCheckedChange={(checked) => handleInputChange("swipeNavigation", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Puxar para Atualizar</Label>
                  <p className="text-xs text-muted-foreground">Atualizar puxando para baixo</p>
                </div>
                <Switch
                  checked={config.pullToRefresh}
                  onCheckedChange={(checked) => handleInputChange("pullToRefresh", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Vibração</Label>
                  <p className="text-xs text-muted-foreground">Feedback tátil</p>
                </div>
                <Switch
                  checked={config.vibration}
                  onCheckedChange={(checked) => handleInputChange("vibration", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* UI Scaling */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Escala da Interface
            </CardTitle>
            <CardDescription>Ajuste tamanhos para melhor usabilidade mobile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="font-size">Tamanho da Fonte</Label>
                <Select value={config.fontSize} onValueChange={(value) => handleInputChange("fontSize", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequena</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                    <SelectItem value="extra-large">Extra Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="button-size">Tamanho dos Botões</Label>
                <Select value={config.buttonSize} onValueChange={(value) => handleInputChange("buttonSize", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spacing">Espaçamento</Label>
                <Select value={config.spacing} onValueChange={(value) => handleInputChange("spacing", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compacto</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="comfortable">Confortável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
