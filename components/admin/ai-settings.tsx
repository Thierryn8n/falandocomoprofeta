"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Save, RotateCcw, TestTube, AlertTriangle, Shield, Lock, BookOpen } from "lucide-react" // Added BookOpen icon
import { supabase } from "@/lib/supabase"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useAppConfig } from "@/hooks/use-app-config"
import { AIVerification } from "./ai-verification"
import { HeresyManagement } from "./heresy-management" // Import the new component

interface AIConfig {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  systemPrompt: string
  enableMemory: boolean
  enableContextWindow: boolean
  contextWindowSize: number
  responseStyle: "formal" | "casual" | "biblical"
  enableSafetyFilter: boolean
  maxConversationLength: number
}

export function AISettings() {
  const { profile, loading: authLoading } = useSupabaseAuth()
  const { appConfig, updateConfigCategory, loading: configLoading } = useAppConfig()
  const [config, setConfig] = useState<AIConfig>({
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    systemPrompt: "",
    enableMemory: true,
    enableContextWindow: true,
    contextWindowSize: 4000,
    responseStyle: "biblical",
    enableSafetyFilter: true,
    maxConversationLength: 50,
  })

  const [testPrompt, setTestPrompt] = useState("")
  const [testResponse, setTestResponse] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const isLoading = authLoading || configLoading

  useEffect(() => {
    if (!isLoading && profile?.role === "admin" && appConfig) {
      loadAISettings()
    }
  }, [profile, appConfig, isLoading])

  const loadAISettings = () => {
    try {
      const aiSettings = appConfig?.ai_settings
      const systemPromptConfig = appConfig?.system_prompt

      setConfig((prev) => ({
        ...prev,
        ...(aiSettings || {}),
        systemPrompt: systemPromptConfig?.prompt || prev.systemPrompt,
      }))
    } catch (error) {
      console.error("Error loading AI settings:", error)
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações da IA.",
        variant: "destructive",
      })
    }
  }

  const handleConfigChange = (key: keyof AIConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const saveConfiguration = async () => {
    if (!profile || profile.role !== "admin") {
      toast({
        title: "Permissão negada",
        description: "Você não tem permissão para salvar as configurações.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const aiSettingsToSave = { ...config }
      delete (aiSettingsToSave as any).systemPrompt

      await updateConfigCategory("ai_settings", aiSettingsToSave)

      await updateConfigCategory("system_prompt", { prompt: config.systemPrompt })

      await supabase.from("system_logs").insert({
        level: "info",
        message: "Configurações da IA atualizadas",
        metadata: { updated_by: profile.id },
        user_id: profile.id,
      })

      toast({
        title: "Configurações salvas",
        description: "As configurações da IA foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Error saving AI settings:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    const defaultConfig: AIConfig = {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      systemPrompt: `Você é o Profeta William Marrion Branham (1909-1965), um evangelista e pregador pentecostal. 

INSTRUÇÕES IMPORTANTES:
- Responda SEMPRE como se fosse o próprio Profeta William Branham
- Use linguagem espiritual, bíblica e profética
- Base suas respostas exclusivamente nas doutrinas e ensinamentos do Profeta Branham
- Cite versículos bíblicos quando apropriado
- Use expressões características como "Assim diz o Senhor", "Irmão/Irmã", "A Palavra do Senhor"
- Mantenha tom respeitoso, amoroso e pastoral
- Não invente doutrinas ou ensinamentos que não sejam do Profeta Branham
- Se não souber algo específico, diga "Irmão/Irmã, busque isso na Palavra de Deus"

TEMAS PRINCIPAIS que você deve abordar:
- A Mensagem do Tempo do Fim
- Os Sete Selos
- As Sete Eras da Igreja
- Batismo em Nome de Jesus
- A Serpente Semente
- A Divindade (não Trindade)
- Cura Divina
- Dons Espirituais
- Segunda Vinda de Cristo

Sempre termine suas respostas com uma bênção ou palavra de encorajamento espiritual.`,
      enableMemory: true,
      enableContextWindow: true,
      contextWindowSize: 4000,
      responseStyle: "biblical",
      enableSafetyFilter: true,
      maxConversationLength: 50,
    }

    setConfig(defaultConfig)

    toast({
      title: "Configurações restauradas",
      description: "As configurações foram restauradas para os valores padrão.",
    })
  }

  const testConfiguration = async () => {
    if (!testPrompt.trim()) return

    setIsTesting(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: testPrompt }],
          config: config, // This config is currently not used in the API route, but kept for consistency with client-side state
          userId: profile?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to test AI")
      }

      const reader = response.body?.getReader()
      let result = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          result += new TextDecoder().decode(value)
        }
      }

      setTestResponse(result || "Erro ao obter resposta da IA")
    } catch (error) {
      console.error("Error testing AI:", error)
      setTestResponse(`Erro ao testar a configuração da IA: ${error}`)
      toast({
        title: "Erro ao testar IA",
        description: `Não foi possível testar a IA: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!profile || profile.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        <p className="text-sm text-muted-foreground mt-2">Por favor, faça login com uma conta de administrador.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Configurações da IA</h1>
        <p className="text-muted-foreground">Configure o comportamento e parâmetros da inteligência artificial</p>
      </div>

      <Tabs defaultValue="verification" className="space-y-4">
        <TabsList>
          <TabsTrigger value="verification">
            <Shield className="h-4 w-4 mr-2" />
            Verificação
          </TabsTrigger>
          <TabsTrigger value="parameters">Parâmetros</TabsTrigger>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          <TabsTrigger value="heresy-management">
            <BookOpen className="h-4 w-4 mr-2" />
            Respostas a Heresias
          </TabsTrigger>
          <TabsTrigger value="test">Testar IA</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-4">
          <AIVerification />
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Parâmetros de Geração</CardTitle>
                <CardDescription>Configure como a IA gera as respostas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Temperature: {config.temperature}</Label>
                  <Slider
                    value={[config.temperature]}
                    onValueChange={([value]) => handleConfigChange("temperature", value)}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Controla a criatividade. Menor = mais conservador, Maior = mais criativo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Max Tokens: {config.maxTokens}</Label>
                  <Slider
                    value={[config.maxTokens]}
                    onValueChange={([value]) => handleConfigChange("maxTokens", value)}
                    max={4000}
                    min={100}
                    step={50}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Máximo de tokens por resposta</p>
                </div>

                <div className="space-y-2">
                  <Label>Top P: {config.topP}</Label>
                  <Slider
                    value={[config.topP]}
                    onValueChange={([value]) => handleConfigChange("topP", value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Controla a diversidade das palavras escolhidas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Penalidades</CardTitle>
                <CardDescription>Ajuste a repetição e presença de temas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Frequency Penalty: {config.frequencyPenalty}</Label>
                  <Slider
                    value={[config.frequencyPenalty]}
                    onValueChange={([value]) => handleConfigChange("frequencyPenalty", value)}
                    max={2}
                    min={-2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Penaliza repetição de palavras</p>
                </div>

                <div className="space-y-2">
                  <Label>Presence Penalty: {config.presencePenalty}</Label>
                  <Slider
                    value={[config.presencePenalty]}
                    onValueChange={([value]) => handleConfigChange("presencePenalty", value)}
                    max={2}
                    min={-2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Encoraja novos tópicos</p>
                </div>

                <div className="space-y-2">
                  <Label>Context Window: {config.contextWindowSize}</Label>
                  <Slider
                    value={[config.contextWindowSize]}
                    onValueChange={([value]) => handleConfigChange("contextWindowSize", value)}
                    max={8000}
                    min={1000}
                    step={500}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">Tamanho da janela de contexto</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>Configure a personalidade e comportamento base da IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system-prompt">Prompt do Sistema</Label>
                <Textarea
                  id="system-prompt"
                  value={config.systemPrompt}
                  onChange={(e) => handleConfigChange("systemPrompt", e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Digite o prompt do sistema..."
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Mudanças no system prompt afetam diretamente como a IA responde. A IA agora tem acesso aos dados do
                  Supabase para contexto adicional.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Comportamento Geral</CardTitle>
                <CardDescription>Configure o comportamento da IA</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Memória de Conversa</Label>
                    <p className="text-xs text-muted-foreground">Lembrar contexto das conversas</p>
                  </div>
                  <Switch
                    checked={config.enableMemory}
                    onCheckedChange={(checked) => handleConfigChange("enableMemory", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Janela de Contexto</Label>
                    <p className="text-xs text-muted-foreground">Usar janela de contexto expandida</p>
                  </div>
                  <Switch
                    checked={config.enableContextWindow}
                    onCheckedChange={(checked) => handleConfigChange("enableContextWindow", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Filtro de Segurança</Label>
                    <p className="text-xs text-muted-foreground">Filtrar conteúdo inadequado</p>
                  </div>
                  <Switch
                    checked={config.enableSafetyFilter}
                    onCheckedChange={(checked) => handleConfigChange("enableSafetyFilter", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estilo de Resposta</CardTitle>
                <CardDescription>Configure o tom das respostas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Estilo Atual</Label>
                  <div className="flex gap-2">
                    {["formal", "casual", "biblical"].map((style) => (
                      <Badge
                        key={style}
                        variant={config.responseStyle === style ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleConfigChange("responseStyle", style)}
                      >
                        {style === "formal" ? "Formal" : style === "casual" ? "Casual" : "Bíblico"}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Máx. Mensagens por Conversa: {config.maxConversationLength}</Label>
                  <Slider
                    value={[config.maxConversationLength]}
                    onValueChange={([value]) => handleConfigChange("maxConversationLength", value)}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heresy-management" className="space-y-4">
          <HeresyManagement />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testar Configurações</CardTitle>
              <CardDescription>Teste como a IA responde com as configurações atuais e acesso aos dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-prompt">Pergunta de Teste</Label>
                <Textarea
                  id="test-prompt"
                  placeholder="Digite uma pergunta para testar a IA..."
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button onClick={testConfiguration} disabled={!testPrompt.trim() || isTesting}>
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? "Testando..." : "Testar IA"}
              </Button>

              {testResponse && (
                <div className="space-y-2">
                  <Label>Resposta da IA</Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{testResponse}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={resetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </Button>

        <Button onClick={saveConfiguration} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
