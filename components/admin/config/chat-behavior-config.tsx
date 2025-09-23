"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAppConfig } from "@/hooks/use-app-config"
import { toast } from "sonner"
import { Save, RefreshCw, MessageSquare, Brain, Shield, Zap, Info, Bot } from "lucide-react"

interface AISettings {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  enableMemory: boolean
  memoryLimit: number
  responseStyle: "formal" | "casual" | "biblical" | "prophetic"
  enableEmotions: boolean
  enableContextAwareness: boolean
  maxConversationLength: number
  enableAutoSummary: boolean
  summaryThreshold: number
  enablePersonalization: boolean
  learningRate: number
  enableSafetyFilter: boolean
  safetyLevel: "low" | "medium" | "high" | "strict"
  enableRateLimiting: boolean
  rateLimitPerMinute: number
  enableLogging: boolean
  logLevel: "basic" | "detailed" | "debug"
}

const defaultAISettings: AISettings = {
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "Você é um assistente espiritual sábio e compassivo, inspirado nos ensinamentos bíblicos.",
  enableMemory: true,
  memoryLimit: 10,
  responseStyle: "biblical",
  enableEmotions: true,
  enableContextAwareness: true,
  maxConversationLength: 50,
  enableAutoSummary: true,
  summaryThreshold: 20,
  enablePersonalization: true,
  learningRate: 0.1,
  enableSafetyFilter: true,
  safetyLevel: "medium",
  enableRateLimiting: true,
  rateLimitPerMinute: 30,
  enableLogging: true,
  logLevel: "basic",
}

export function ChatBehaviorConfig() {
  const { appConfig, loading, updateConfig } = useAppConfig()
  const [settings, setSettings] = useState<AISettings>(defaultAISettings)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"basic" | "advanced" | "safety" | "performance">("basic")

  useEffect(() => {
    if (!loading && appConfig?.ai_settings) {
      console.log("🤖 Carregando configurações de IA:", appConfig.ai_settings)
      setSettings((prev) => ({ ...prev, ...appConfig.ai_settings }))
    }
  }, [loading, appConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateConfig("ai_settings", settings)
      toast.success("Configurações de comportamento do chat salvas!")
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast.error("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const resetToDefaults = () => {
    setSettings(defaultAISettings)
    toast.info("Configurações restauradas para os valores padrão")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comportamento do Chat</h1>
        <p className="text-muted-foreground">Configure como a IA se comporta nas conversas</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: "basic", label: "Básico", icon: MessageSquare },
          { id: "advanced", label: "Avançado", icon: Brain },
          { id: "safety", label: "Segurança", icon: Shield },
          { id: "performance", label: "Performance", icon: Zap },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Basic Settings */}
      {activeTab === "basic" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Configurações Básicas da IA
              </CardTitle>
              <CardDescription>Configure o comportamento fundamental do assistente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Modelo */}
              <div className="space-y-2">
                <Label htmlFor="model">Modelo de IA</Label>
                <Select value={settings.model} onValueChange={(value) => updateSetting("model", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4 (Recomendado)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Modelo de linguagem usado para gerar respostas</p>
              </div>

              {/* Temperatura */}
              <div className="space-y-2">
                <Label>Criatividade: {settings.temperature}</Label>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={(value) => updateSetting("temperature", value[0])}
                  max={2}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  0 = Mais preciso e consistente | 2 = Mais criativo e variado
                </p>
              </div>

              {/* Tokens Máximos */}
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Tamanho Máximo da Resposta</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => updateSetting("maxTokens", Number.parseInt(e.target.value))}
                  min={100}
                  max={4000}
                />
                <p className="text-sm text-muted-foreground">
                  Número máximo de tokens por resposta (aprox. 4 chars = 1 token)
                </p>
              </div>

              {/* Estilo de Resposta */}
              <div className="space-y-2">
                <Label htmlFor="responseStyle">Estilo de Resposta</Label>
                <Select
                  value={settings.responseStyle}
                  onValueChange={(value: AISettings["responseStyle"]) => updateSetting("responseStyle", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="biblical">Bíblico</SelectItem>
                    <SelectItem value="prophetic">Profético</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Tom e estilo das respostas da IA</p>
              </div>

              {/* Prompt do Sistema */}
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                <Textarea
                  id="systemPrompt"
                  value={settings.systemPrompt}
                  onChange={(e) => updateSetting("systemPrompt", e.target.value)}
                  rows={4}
                  placeholder="Instruções fundamentais para a IA..."
                />
                <p className="text-sm text-muted-foreground">
                  Instruções que definem a personalidade e comportamento da IA
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Settings */}
      {activeTab === "advanced" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configurações Avançadas
              </CardTitle>
              <CardDescription>Recursos avançados de IA e personalização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Memória */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableMemory">Memória de Conversas</Label>
                    <p className="text-sm text-muted-foreground">Lembrar contexto de conversas anteriores</p>
                  </div>
                  <Switch
                    id="enableMemory"
                    checked={settings.enableMemory}
                    onCheckedChange={(checked) => updateSetting("enableMemory", checked)}
                  />
                </div>

                {settings.enableMemory && (
                  <div className="space-y-2">
                    <Label>Limite de Memória: {settings.memoryLimit} conversas</Label>
                    <Slider
                      value={[settings.memoryLimit]}
                      onValueChange={(value) => updateSetting("memoryLimit", value[0])}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Consciência Contextual */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableContextAwareness">Consciência Contextual</Label>
                  <p className="text-sm text-muted-foreground">Entender melhor o contexto da conversa</p>
                </div>
                <Switch
                  id="enableContextAwareness"
                  checked={settings.enableContextAwareness}
                  onCheckedChange={(checked) => updateSetting("enableContextAwareness", checked)}
                />
              </div>

              {/* Emoções */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableEmotions">Respostas Emocionais</Label>
                  <p className="text-sm text-muted-foreground">Incluir elementos emocionais nas respostas</p>
                </div>
                <Switch
                  id="enableEmotions"
                  checked={settings.enableEmotions}
                  onCheckedChange={(checked) => updateSetting("enableEmotions", checked)}
                />
              </div>

              {/* Personalização */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enablePersonalization">Personalização</Label>
                    <p className="text-sm text-muted-foreground">Adaptar respostas ao usuário específico</p>
                  </div>
                  <Switch
                    id="enablePersonalization"
                    checked={settings.enablePersonalization}
                    onCheckedChange={(checked) => updateSetting("enablePersonalization", checked)}
                  />
                </div>

                {settings.enablePersonalization && (
                  <div className="space-y-2">
                    <Label>Taxa de Aprendizado: {settings.learningRate}</Label>
                    <Slider
                      value={[settings.learningRate]}
                      onValueChange={(value) => updateSetting("learningRate", value[0])}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">Velocidade de adaptação às preferências do usuário</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Auto Resumo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableAutoSummary">Resumo Automático</Label>
                    <p className="text-sm text-muted-foreground">Resumir conversas longas automaticamente</p>
                  </div>
                  <Switch
                    id="enableAutoSummary"
                    checked={settings.enableAutoSummary}
                    onCheckedChange={(checked) => updateSetting("enableAutoSummary", checked)}
                  />
                </div>

                {settings.enableAutoSummary && (
                  <div className="space-y-2">
                    <Label>Limite para Resumo: {settings.summaryThreshold} mensagens</Label>
                    <Slider
                      value={[settings.summaryThreshold]}
                      onValueChange={(value) => updateSetting("summaryThreshold", value[0])}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Safety Settings */}
      {activeTab === "safety" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>Controles de segurança e moderação de conteúdo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filtro de Segurança */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableSafetyFilter">Filtro de Segurança</Label>
                    <p className="text-sm text-muted-foreground">Filtrar conteúdo inadequado ou perigoso</p>
                  </div>
                  <Switch
                    id="enableSafetyFilter"
                    checked={settings.enableSafetyFilter}
                    onCheckedChange={(checked) => updateSetting("enableSafetyFilter", checked)}
                  />
                </div>

                {settings.enableSafetyFilter && (
                  <div className="space-y-2">
                    <Label htmlFor="safetyLevel">Nível de Segurança</Label>
                    <Select
                      value={settings.safetyLevel}
                      onValueChange={(value: AISettings["safetyLevel"]) => updateSetting("safetyLevel", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Baixo</Badge>
                            <span>Filtros básicos</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">Médio</Badge>
                            <span>Filtros moderados</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Alto</Badge>
                            <span>Filtros rigorosos</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="strict">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Estrito</Badge>
                            <span>Máxima segurança</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Rate Limiting */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableRateLimiting">Limite de Taxa</Label>
                    <p className="text-sm text-muted-foreground">Limitar número de mensagens por usuário</p>
                  </div>
                  <Switch
                    id="enableRateLimiting"
                    checked={settings.enableRateLimiting}
                    onCheckedChange={(checked) => updateSetting("enableRateLimiting", checked)}
                  />
                </div>

                {settings.enableRateLimiting && (
                  <div className="space-y-2">
                    <Label htmlFor="rateLimitPerMinute">Mensagens por Minuto</Label>
                    <Input
                      id="rateLimitPerMinute"
                      type="number"
                      value={settings.rateLimitPerMinute}
                      onChange={(e) => updateSetting("rateLimitPerMinute", Number.parseInt(e.target.value))}
                      min={1}
                      max={100}
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Logging */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableLogging">Registro de Atividades</Label>
                    <p className="text-sm text-muted-foreground">Registrar conversas para auditoria</p>
                  </div>
                  <Switch
                    id="enableLogging"
                    checked={settings.enableLogging}
                    onCheckedChange={(checked) => updateSetting("enableLogging", checked)}
                  />
                </div>

                {settings.enableLogging && (
                  <div className="space-y-2">
                    <Label htmlFor="logLevel">Nível de Registro</Label>
                    <Select
                      value={settings.logLevel}
                      onValueChange={(value: AISettings["logLevel"]) => updateSetting("logLevel", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Básico</SelectItem>
                        <SelectItem value="detailed">Detalhado</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Settings */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configurações de Performance
              </CardTitle>
              <CardDescription>Otimizações de velocidade e eficiência</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comprimento da Conversa */}
              <div className="space-y-2">
                <Label>Comprimento Máximo da Conversa: {settings.maxConversationLength} mensagens</Label>
                <Slider
                  value={[settings.maxConversationLength]}
                  onValueChange={(value) => updateSetting("maxConversationLength", value[0])}
                  max={200}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">Conversas mais longas são automaticamente resumidas</p>
              </div>

              <Separator />

              {/* Status da Performance */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Status da Performance:
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <p>⚡ Modelo: {settings.model}</p>
                  <p>🧠 Memória: {settings.enableMemory ? `${settings.memoryLimit} conversas` : "Desabilitada"}</p>
                  <p>🔒 Segurança: {settings.enableSafetyFilter ? settings.safetyLevel : "Desabilitada"}</p>
                  <p>📊 Logging: {settings.enableLogging ? settings.logLevel : "Desabilitado"}</p>
                  <p>
                    ⏱️ Rate Limit: {settings.enableRateLimiting ? `${settings.rateLimitPerMinute}/min` : "Ilimitado"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>

        <Button type="button" variant="outline" onClick={resetToDefaults}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </Button>
      </div>
    </div>
  )
}
