"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useRadioConfig } from "@/hooks/use-radio-config"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { RadioPlayer } from "@/components/radio-player"
import { Loader2, Radio, ExternalLink, Volume2, Settings, Users, Globe } from "lucide-react"
import { toast } from "sonner"

export function RadioConfig() {
  const { user } = useSupabaseAuth()
  const { radioConfig, loading, updateRadioConfig } = useRadioConfig(user)
  const [saving, setSaving] = useState(false)
  const [localConfig, setLocalConfig] = useState(radioConfig)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateRadioConfig(localConfig)
      toast.success("Configurações da rádio salvas com sucesso!")
    } catch (error) {
      console.error("Error saving radio config:", error)
      toast.error("Erro ao salvar configurações da rádio")
    } finally {
      setSaving(false)
    }
  }

  const handleConfigChange = (key: string, value: any) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }))
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>Configure as opções básicas da rádio web</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="radio-enabled">Rádio Habilitada</Label>
              <Switch
                id="radio-enabled"
                checked={localConfig.enabled}
                onCheckedChange={(checked) => handleConfigChange("enabled", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radio-name">Nome da Rádio</Label>
              <Input
                id="radio-name"
                placeholder="Nome da rádio"
                value={localConfig.radioName}
                onChange={(e) => handleConfigChange("radioName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radio-url">URL da Rádio</Label>
              <div className="flex gap-2">
                <Input
                  id="radio-url"
                  placeholder="https://exemplo.com/radio"
                  value={localConfig.radioUrl}
                  onChange={(e) => handleConfigChange("radioUrl", e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(localConfig.radioUrl, "_blank")}
                  disabled={!localConfig.radioUrl}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Volume Padrão: {Math.round(localConfig.volume * 100)}%</Label>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[localConfig.volume]}
                  onValueChange={(value) => handleConfigChange("volume", value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Exibição */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Exibição
            </CardTitle>
            <CardDescription>Configure quando e onde a rádio será exibida</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-guests" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Mostrar para Visitantes
              </Label>
              <Switch
                id="show-guests"
                checked={localConfig.showForGuests}
                onCheckedChange={(checked) => handleConfigChange("showForGuests", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Mostrar para Usuários
              </Label>
              <Switch
                id="show-users"
                checked={localConfig.showForUsers}
                onCheckedChange={(checked) => handleConfigChange("showForUsers", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radio-position">Posição na Tela</Label>
              <Select value={localConfig.position} onValueChange={(value) => handleConfigChange("position", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a posição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                  <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                  <SelectItem value="top-right">Superior Direito</SelectItem>
                  <SelectItem value="top-left">Superior Esquerdo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Auto-start:</strong> A rádio inicia automaticamente para primeira visita (visitantes) e primeiro
                login (usuários)
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Estado persistente:</strong> Visitantes usam localStorage, usuários sincronizam via banco de
                dados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {localConfig.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Visualize como a rádio será exibida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative border rounded-lg p-4 bg-muted/50 min-h-[200px]">
              <p className="text-sm text-muted-foreground mb-4">Preview do player (posição: {localConfig.position})</p>
              <div className="absolute" style={{ ...getPositionStyle(localConfig.position) }}>
                <RadioPlayer className="relative" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}

function getPositionStyle(position: string) {
  switch (position) {
    case "top-left":
      return { top: "16px", left: "16px" }
    case "top-right":
      return { top: "16px", right: "16px" }
    case "bottom-left":
      return { bottom: "16px", left: "16px" }
    case "bottom-right":
    default:
      return { bottom: "16px", right: "16px" }
  }
}
