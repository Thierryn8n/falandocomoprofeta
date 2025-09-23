"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Upload, Save, Loader2, ImageIcon, FileImage } from "lucide-react"
import { useAppConfig } from "@/hooks/use-app-config"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export function AppIdentityConfig() {
  const { getConfigValue, updateConfig, loading } = useAppConfig()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  // Valores atuais da configuração
  const currentConfig = getConfigValue("app_identity", {})
  const [formData, setFormData] = useState({
    appName: currentConfig.appName || "Falando com o Profeta",
    appDescription: currentConfig.appDescription || "Converse com o Profeta William Branham através de IA",
    logo: currentConfig.logo || "/placeholder.svg?height=32&width=32&text=Logo",
    favicon: currentConfig.favicon || "/placeholder.svg?height=16&width=16&text=F",
  })

  const uploadFile = async (file: File, type: "logo" | "favicon") => {
    try {
      setUploading(type)

      const fileExt = file.name.split(".").pop()
      const fileName = `${type}-${Date.now()}.${fileExt}`
      const filePath = `identity/${fileName}`

      console.log(`📤 Fazendo upload: ${filePath}`)

      // Fazer upload diretamente sem verificar bucket
      const { data, error } = await supabase.storage.from("attachments").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("❌ Erro no upload:", error)

        // Se for erro de bucket, tentar criar via função
        if (error.message.includes("Bucket") || error.message.includes("bucket")) {
          console.log("🪣 Tentando criar bucket...")

          const { error: rpcError } = await supabase.rpc("ensure_attachments_bucket")

          if (rpcError) {
            console.error("❌ Erro ao criar bucket:", rpcError)
            throw new Error("Erro ao configurar armazenamento. Contate o administrador.")
          }

          // Tentar upload novamente
          const { data: retryData, error: retryError } = await supabase.storage
            .from("attachments")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            })

          if (retryError) {
            throw retryError
          }

          console.log("✅ Upload realizado após criar bucket")
        } else {
          throw error
        }
      }

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("attachments").getPublicUrl(filePath)

      console.log(`🔗 URL pública: ${publicUrl}`)
      return publicUrl
    } catch (error) {
      console.error(`❌ Erro no upload do ${type}:`, error)
      throw error
    } finally {
      setUploading(null)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas arquivos de imagem")
      return
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 2MB")
      return
    }

    try {
      const url = await uploadFile(file, type)
      setFormData((prev) => ({ ...prev, [type]: url }))
      toast.success(`${type === "logo" ? "Logo" : "Favicon"} enviado com sucesso!`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      toast.error(`Erro ao enviar ${type === "logo" ? "logo" : "favicon"}: ${errorMessage}`)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateConfig("app_identity", formData, "Configurações de identidade da aplicação")
      toast.success("Configurações de identidade salvas com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      toast.error("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
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
      <div>
        <h3 className="text-lg font-medium" style={{ color: "#ff8100" }}>
          Identidade da Aplicação
        </h3>
        <p className="text-sm text-muted-foreground">Configure o nome, descrição e elementos visuais da aplicação.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Configure o nome e descrição da aplicação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName">Nome da Aplicação</Label>
            <Input
              id="appName"
              value={formData.appName}
              onChange={(e) => setFormData((prev) => ({ ...prev, appName: e.target.value }))}
              placeholder="Nome da aplicação"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appDescription">Descrição</Label>
            <Input
              id="appDescription"
              value={formData.appDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, appDescription: e.target.value }))}
              placeholder="Descrição da aplicação"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Elementos Visuais</CardTitle>
          <CardDescription>Configure o logo e favicon da aplicação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" style={{ color: "#ff8100" }} />
              <Label>Logo da Aplicação</Label>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img
                  src={formData.logo || "/placeholder.svg"}
                  alt="Logo atual"
                  className="h-12 w-12 object-contain border rounded"
                />
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "logo")}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading === "logo"}
                  className="w-full"
                >
                  {uploading === "logo" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar Logo
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">Recomendado: PNG ou SVG, máximo 2MB</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Favicon */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileImage className="h-4 w-4" style={{ color: "#ff8100" }} />
              <Label>Favicon</Label>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img
                  src={formData.favicon || "/placeholder.svg"}
                  alt="Favicon atual"
                  className="h-8 w-8 object-contain border rounded"
                />
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "favicon")}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => faviconInputRef.current?.click()}
                  disabled={uploading === "favicon"}
                  className="w-full"
                >
                  {uploading === "favicon" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar Favicon
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">Recomendado: ICO ou PNG 16x16 ou 32x32, máximo 2MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: "#ff8100", borderColor: "#ff8100" }}
          className="hover:bg-orange-600"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
