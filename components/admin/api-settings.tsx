"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Save, TestTube, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Zap, Brain, Volume2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

interface APIConfig {
  openai: {
    apiKey: string
    model: string
    enabled: boolean
    status: "connected" | "error" | "testing"
  }
  gemini: {
    apiKey: string
    model: string
    enabled: boolean
    status: "connected" | "error" | "testing"
  }
  psyche: {
    apiKey: string
    model: string
    enabled: boolean
    status: "connected" | "error" | "testing"
  }
  tts: {
    apiKey: string
    provider: string
    voice: string
    enabled: boolean
    status: "connected" | "error" | "testing"
  }
}

export function APISettings() {
  const { profile } = useSupabaseAuth()
  const [config, setConfig] = useState<APIConfig>({
    openai: {
      apiKey: "",
      model: "gpt-4o",
      enabled: true,
      status: "error",
    },
    gemini: {
      apiKey: "AIzaSyB90mse8rY7Tf36awk3-vGQopOL_s4i03g",
      model: "gemini-2.0-flash",
      enabled: true,
      status: "connected",
    },
    psyche: {
      apiKey: "",
      model: "psyche-1",
      enabled: false,
      status: "error",
    },
    tts: {
      apiKey: "",
      provider: "elevenlabs",
      voice: "william-branham",
      enabled: true,
      status: "error",
    },
  })

  const [showKeys, setShowKeys] = useState({
    openai: false,
    gemini: false,
    psyche: false,
    tts: false,
  })

  const [testingAPI, setTestingAPI] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (profile?.role === "admin") {
      loadAPISettings()
    }
  }, [profile])

  const loadAPISettings = async () => {
    try {
      setLoading(true)

      // Load API keys from database
      const { data: apiKeys, error } = await supabase.from("api_keys").select("*")

      if (error) throw error

      // Update config with loaded data
      const updatedConfig = { ...config }

      apiKeys?.forEach((key) => {
        if (key.provider in updatedConfig) {
          const provider = key.provider as keyof APIConfig
          updatedConfig[provider] = {
            ...updatedConfig[provider],
            apiKey: key.encrypted_key, // In real app, decrypt this
            status: key.status === "active" ? "connected" : "error",
          }
        }
      })

      setConfig(updatedConfig)
    } catch (error) {
      console.error("Error loading API settings:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações das APIs.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = (provider: keyof APIConfig, field: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }))
  }

  const toggleKeyVisibility = (provider: keyof typeof showKeys) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }))
  }

  const testAPIConnection = async (provider: keyof APIConfig) => {
    setTestingAPI(provider)

    try {
      // Update status to testing
      setConfig((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: "testing",
        },
      }))

      // Test the API connection
      const response = await fetch("/api/test-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          apiKey: config[provider].apiKey,
          model: config[provider].model,
        }),
      })

      const result = await response.json()
      const isValid = result.success

      // Update status based on test result
      setConfig((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: isValid ? "connected" : "error",
        },
      }))

      // Update database
      await supabase.from("api_keys").upsert({
        provider,
        key_name: `${provider}_key`,
        encrypted_key: config[provider].apiKey, // In real app, encrypt this
        status: isValid ? "active" : "error",
        last_tested: new Date().toISOString(),
      })

      toast({
        title: isValid ? "Conexão bem-sucedida" : "Erro na conexão",
        description: isValid ? `API ${provider} conectada com sucesso.` : `Verifique a chave da API ${provider}.`,
        variant: isValid ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error testing API:", error)
      setConfig((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: "error",
        },
      }))

      toast({
        title: "Erro no teste",
        description: `Não foi possível testar a API ${provider}.`,
        variant: "destructive",
      })
    } finally {
      setTestingAPI(null)
    }
  }

  const saveAllConfigurations = async () => {
    if (!profile || profile.role !== "admin") return

    try {
      setSaving(true)

      // Save all API configurations
      const promises = Object.entries(config).map(([provider, settings]) => {
        return supabase.from("api_keys").upsert({
          provider,
          key_name: `${provider}_key`,
          encrypted_key: settings.apiKey, // In real app, encrypt this
          status: settings.enabled && settings.apiKey ? "active" : "inactive",
        })
      })

      await Promise.all(promises)

      // Log the configuration change
      await supabase.from("system_logs").insert({
        level: "info",
        message: "Configurações de API atualizadas",
        metadata: { updated_by: profile.id },
        user_id: profile.id,
      })

      toast({
        title: "Configurações salvas",
        description: "Todas as configurações de API foram salvas com sucesso.",
      })
    } catch (error) {
      console.error("Error saving API settings:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "testing":
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado"
      case "error":
        return "Erro"
      case "testing":
        return "Testando"
      default:
        return "Desconhecido"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Configurações de APIs</h1>
        <p className="text-muted-foreground">Configure as chaves e parâmetros das APIs externas</p>
      </div>

      <Tabs defaultValue="openai" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="openai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            OpenAI
          </TabsTrigger>
          <TabsTrigger value="gemini" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Gemini
          </TabsTrigger>
          <TabsTrigger value="psyche" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Psyche AI
          </TabsTrigger>
          <TabsTrigger value="tts" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Text-to-Speech
          </TabsTrigger>
        </TabsList>

        <TabsContent value="openai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  OpenAI Configuration
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(config.openai.status)}
                  <Badge variant={config.openai.status === "connected" ? "default" : "destructive"}>
                    {getStatusText(config.openai.status)}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>Configure a API da OpenAI para geração de respostas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar OpenAI</Label>
                  <p className="text-xs text-muted-foreground">Usar OpenAI como provedor principal</p>
                </div>
                <Switch
                  checked={config.openai.enabled}
                  onCheckedChange={(checked) => handleConfigChange("openai", "enabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key">Chave da API</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="openai-key"
                      type={showKeys.openai ? "text" : "password"}
                      placeholder="sk-..."
                      value={config.openai.apiKey}
                      onChange={(e) => handleConfigChange("openai", "apiKey", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => toggleKeyVisibility("openai")}
                    >
                      {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => testAPIConnection("openai")}
                    disabled={!config.openai.apiKey || testingAPI === "openai"}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingAPI === "openai" ? "Testando..." : "Testar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-model">Modelo</Label>
                <Input
                  id="openai-model"
                  value={config.openai.model}
                  onChange={(e) => handleConfigChange("openai", "model", e.target.value)}
                  placeholder="gpt-4o"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Recomendado:</strong> Use gpt-4o para melhor qualidade nas respostas do Profeta.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gemini" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Google Gemini Configuration
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(config.gemini.status)}
                  <Badge variant={config.gemini.status === "connected" ? "default" : "destructive"}>
                    {getStatusText(config.gemini.status)}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>Configure a API do Google Gemini para geração de respostas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar Gemini</Label>
                  <p className="text-xs text-muted-foreground">Usar Gemini como provedor alternativo</p>
                </div>
                <Switch
                  checked={config.gemini.enabled}
                  onCheckedChange={(checked) => handleConfigChange("gemini", "enabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini-key">Chave da API</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="gemini-key"
                      type={showKeys.gemini ? "text" : "password"}
                      placeholder="AIzaSy..."
                      value={config.gemini.apiKey}
                      onChange={(e) => handleConfigChange("gemini", "apiKey", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => toggleKeyVisibility("gemini")}
                    >
                      {showKeys.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => testAPIConnection("gemini")}
                    disabled={!config.gemini.apiKey || testingAPI === "gemini"}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingAPI === "gemini" ? "Testando..." : "Testar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini-model">Modelo</Label>
                <Input
                  id="gemini-model"
                  value={config.gemini.model}
                  onChange={(e) => handleConfigChange("gemini", "model", e.target.value)}
                  placeholder="gemini-2.0-flash"
                />
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Configurado:</strong> Use gemini-2.0-flash para respostas rápidas e eficientes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="psyche" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Psyche AI Configuration
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(config.psyche.status)}
                  <Badge variant={config.psyche.status === "connected" ? "default" : "destructive"}>
                    {getStatusText(config.psyche.status)}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>Configure a API do Psyche AI para análise psicológica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar Psyche AI</Label>
                  <p className="text-xs text-muted-foreground">Usar Psyche AI para análise comportamental</p>
                </div>
                <Switch
                  checked={config.psyche.enabled}
                  onCheckedChange={(checked) => handleConfigChange("psyche", "enabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="psyche-key">Chave da API</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="psyche-key"
                      type={showKeys.psyche ? "text" : "password"}
                      placeholder="psyche_..."
                      value={config.psyche.apiKey}
                      onChange={(e) => handleConfigChange("psyche", "apiKey", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => toggleKeyVisibility("psyche")}
                    >
                      {showKeys.psyche ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => testAPIConnection("psyche")}
                    disabled={!config.psyche.apiKey || testingAPI === "psyche"}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingAPI === "psyche" ? "Testando..." : "Testar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="psyche-model">Modelo</Label>
                <Input
                  id="psyche-model"
                  value={config.psyche.model}
                  onChange={(e) => handleConfigChange("psyche", "model", e.target.value)}
                  placeholder="psyche-1"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <strong>Experimental:</strong> Psyche AI oferece análise psicológica avançada das conversas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Text-to-Speech Configuration
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(config.tts.status)}
                  <Badge variant={config.tts.status === "connected" ? "default" : "destructive"}>
                    {getStatusText(config.tts.status)}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>Configure serviços de síntese de voz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar TTS</Label>
                  <p className="text-xs text-muted-foreground">Ativar síntese de voz para as respostas</p>
                </div>
                <Switch
                  checked={config.tts.enabled}
                  onCheckedChange={(checked) => handleConfigChange("tts", "enabled", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tts-key">Chave da API</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="tts-key"
                      type={showKeys.tts ? "text" : "password"}
                      placeholder="sk_..."
                      value={config.tts.apiKey}
                      onChange={(e) => handleConfigChange("tts", "apiKey", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => toggleKeyVisibility("tts")}
                    >
                      {showKeys.tts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => testAPIConnection("tts")}
                    disabled={!config.tts.apiKey || testingAPI === "tts"}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {testingAPI === "tts" ? "Testando..." : "Testar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tts-provider">Provedor</Label>
                <Input
                  id="tts-provider"
                  value={config.tts.provider}
                  onChange={(e) => handleConfigChange("tts", "provider", e.target.value)}
                  placeholder="elevenlabs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tts-voice">Voz</Label>
                <Input
                  id="tts-voice"
                  value={config.tts.voice}
                  onChange={(e) => handleConfigChange("tts", "voice", e.target.value)}
                  placeholder="william-branham"
                />
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Personalizado:</strong> Configure uma voz que se assemelhe ao Profeta William Branham.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end">
        <Button onClick={saveAllConfigurations} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Todas as Configurações"}
        </Button>
      </div>
    </div>
  )
}
