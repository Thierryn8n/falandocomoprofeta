"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Save, Palette, Type, Monitor } from "lucide-react"

export function InterfaceThemeConfig() {
  const [config, setConfig] = useState({
    primaryColor: "#f97316",
    secondaryColor: "#0ea5e9",
    accentColor: "#8b5cf6",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    fontFamily: "Inter",
    fontSize: "16",
    borderRadius: "8",
    darkMode: true,
    highContrast: false,
    animations: true,
  })

  const { toast } = useToast()

  const handleInputChange = (field: string, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "O tema da interface foi atualizado com sucesso.",
    })
  }

  const colorPresets = [
    { name: "Laranja (Padrão)", primary: "#f97316", secondary: "#0ea5e9" },
    { name: "Azul", primary: "#3b82f6", secondary: "#10b981" },
    { name: "Verde", primary: "#10b981", secondary: "#f59e0b" },
    { name: "Roxo", primary: "#8b5cf6", secondary: "#ec4899" },
    { name: "Vermelho", primary: "#ef4444", secondary: "#06b6d4" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Tema da Interface</h1>
        <p className="text-muted-foreground">Personalize as cores, tipografia e aparência do aplicativo</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Color Scheme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Esquema de Cores
            </CardTitle>
            <CardDescription>Defina as cores principais da interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Presets de Cores</Label>
                <div className="grid gap-2">
                  {colorPresets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start gap-3 h-auto p-3 bg-transparent"
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          primaryColor: preset.primary,
                          secondaryColor: preset.secondary,
                        }))
                      }}
                    >
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: preset.primary }} />
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: preset.secondary }} />
                      </div>
                      <span className="text-sm">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                      placeholder="#f97316"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={config.secondaryColor}
                      onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Tipografia
            </CardTitle>
            <CardDescription>Configure fontes e tamanhos de texto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font-family">Família da Fonte</Label>
              <Select value={config.fontFamily} onValueChange={(value) => handleInputChange("fontFamily", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Padrão)</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Tamanho Base da Fonte (px)</Label>
              <Input
                id="font-size"
                type="number"
                value={config.fontSize}
                onChange={(e) => handleInputChange("fontSize", e.target.value)}
                min="12"
                max="24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="border-radius">Raio da Borda (px)</Label>
              <Input
                id="border-radius"
                type="number"
                value={config.borderRadius}
                onChange={(e) => handleInputChange("borderRadius", e.target.value)}
                min="0"
                max="20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Options */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Opções de Exibição
            </CardTitle>
            <CardDescription>Configure preferências de exibição e acessibilidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Escuro</Label>
                  <p className="text-xs text-muted-foreground">Ativar tema escuro por padrão</p>
                </div>
                <Switch
                  checked={config.darkMode}
                  onCheckedChange={(checked) => handleInputChange("darkMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alto Contraste</Label>
                  <p className="text-xs text-muted-foreground">Melhorar contraste para acessibilidade</p>
                </div>
                <Switch
                  checked={config.highContrast}
                  onCheckedChange={(checked) => handleInputChange("highContrast", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Animações</Label>
                  <p className="text-xs text-muted-foreground">Ativar transições e animações</p>
                </div>
                <Switch
                  checked={config.animations}
                  onCheckedChange={(checked) => handleInputChange("animations", checked)}
                />
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
