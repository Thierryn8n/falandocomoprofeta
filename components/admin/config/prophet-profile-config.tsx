"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Save, User, ImageIcon, Loader2, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { StructuredAppConfig } from "@/hooks/use-app-config"

interface ProphetProfileConfigProps {
  appConfig: StructuredAppConfig["prophet_profile"] // Expect specific sub-config
  onConfigUpdate: (newValues: Partial<StructuredAppConfig["prophet_profile"]>) => void
}

export function ProphetProfileConfig({ appConfig, onConfigUpdate }: ProphetProfileConfigProps) {
  const [prophetName, setProphetName] = useState(appConfig?.prophetName || "Profeta William Branham")
  const [prophetAvatar, setProphetAvatar] = useState(appConfig?.prophetAvatar || "")
  const [prophetBio, setProphetBio] = useState(
    appConfig?.prophetBio ||
      "William Marrion Branham foi um ministro cristão americano e líder de avivamento que iniciou o movimento de cura pela fé pós-Segunda Guerra Mundial.",
  )
  const [prophetBirthDate, setProphetBirthDate] = useState(appConfig?.prophetBirthDate || "6 de abril de 1909")
  const [prophetDeathDate, setProphetDeathDate] = useState(appConfig?.prophetDeathDate || "24 de dezembro de 1965")
  const [prophetNationality, setProphetNationality] = useState(appConfig?.prophetNationality || "Americano")
  const [prophetMinistry, setProphetMinistry] = useState(appConfig?.prophetMinistry || "Ministério de Cura e Profecia")

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setProphetName(appConfig?.prophetName || "Profeta William Branham")
    setProphetAvatar(appConfig?.prophetAvatar || "")
    setProphetBio(
      appConfig?.prophetBio ||
        "William Marrion Branham foi um ministro cristão americano e líder de avivamento que iniciou o movimento de cura pela fé pós-Segunda Guerra Mundial.",
    )
    setProphetBirthDate(appConfig?.prophetBirthDate || "6 de abril de 1909")
    setProphetDeathDate(appConfig?.prophetDeathDate || "24 de dezembro de 1965")
    setProphetNationality(appConfig?.prophetNationality || "Americano")
    setProphetMinistry(appConfig?.prophetMinistry || "Ministério de Cura e Profecia")
  }, [appConfig])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo para upload.",
        variant: "destructive",
      })
      return
    }

    const file = event.target.files[0]
    const fileExt = file.name.split(".").pop()
    const fileName = `prophet-avatar-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    setIsUploading(true)
    try {
      const { error: uploadError } = await supabase.storage.from("profile-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        throw uploadError
      }

      const { data: publicUrlData } = supabase.storage.from("profile-images").getPublicUrl(filePath)

      if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error("Não foi possível obter a URL pública do avatar.")
      }

      setProphetAvatar(publicUrlData.publicUrl)
      onConfigUpdate({ prophetAvatar: publicUrlData.publicUrl }) // Update parent state
      toast({
        title: "Sucesso",
        description: "Avatar do profeta atualizado com sucesso!",
      })
    } catch (error: any) {
      console.error("Erro ao fazer upload do avatar:", error.message)
      toast({
        title: "Erro no Upload",
        description: error.message || "Ocorreu um erro ao fazer upload do avatar.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (prophetAvatar === "") return

    setIsUploading(true)
    try {
      const urlParts = prophetAvatar.split("/")
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `avatars/${fileName}`

      const { error: deleteError } = await supabase.storage.from("profile-images").remove([filePath])

      if (deleteError) {
        throw deleteError
      }

      setProphetAvatar("")
    onConfigUpdate({ prophetAvatar: "" }) // Update parent state
      toast({
        title: "Sucesso",
        description: "Avatar do profeta removido com sucesso!",
      })
    } catch (error: any) {
      console.error("Erro ao remover avatar:", error.message)
      toast({
        title: "Erro ao Remover",
        description: error.message || "Ocorreu um erro ao remover o avatar.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      onConfigUpdate({
        prophetName,
        prophetBio,
        prophetAvatar,
        prophetBirthDate,
        prophetDeathDate,
        prophetNationality,
        prophetMinistry,
      })
      toast({
        title: "Sucesso",
        description: "Configurações do perfil do profeta salvas!",
      })
    } catch (error) {
      console.error("Erro ao salvar configurações do profeta:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações do perfil do profeta.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [
    prophetName,
    prophetBio,
    prophetAvatar,
    prophetBirthDate,
    prophetDeathDate,
    prophetNationality,
    prophetMinistry,
    onConfigUpdate,
    toast,
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Perfil do Profeta</h1>
        <p className="text-muted-foreground">Configure as informações e avatar do profeta</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Avatar do Profeta
            </CardTitle>
            <CardDescription>Imagem que representa o profeta no chat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 border-2 border-dashed border-border rounded-full flex items-center justify-center overflow-hidden bg-muted">
                {prophetAvatar ? (
                  <img
                    src={prophetAvatar || "https://i.pravatar.cc/150?u=prophet_avatar"}
                    alt="Avatar do Profeta"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "https://i.pravatar.cc/150?u=prophet_fallback"
                    }}
                  />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="avatar-upload">Carregar Nova Imagem</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="cursor-pointer"
                    disabled={isUploading}
                  />
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                {isUploading && <p className="text-sm text-blue-600">Carregando...</p>}
                {prophetAvatar !== "" && !isUploading && (
                  <Button variant="outline" size="sm" onClick={handleRemoveAvatar} className="gap-2 bg-transparent">
                    <XCircle className="h-4 w-4" /> Remover Avatar
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>Dados pessoais do profeta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prophet-name">Nome Completo</Label>
              <Input
                id="prophet-name"
                value={prophetName}
                onChange={(e) => setProphetName(e.target.value)}
                placeholder="Profeta William Branham"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birth-date">Data de Nascimento</Label>
                <Input
                  id="birth-date"
                  value={prophetBirthDate}
                  onChange={(e) => setProphetBirthDate(e.target.value)}
                  placeholder="6 de abril de 1909"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="death-date">Data de Falecimento</Label>
                <Input
                  id="death-date"
                  value={prophetDeathDate}
                  onChange={(e) => setProphetDeathDate(e.target.value)}
                  placeholder="24 de dezembro de 1965"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Input
                  id="nationality"
                  value={prophetNationality}
                  onChange={(e) => setProphetNationality(e.target.value)}
                  placeholder="Americano"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ministry">Ministério</Label>
                <Input
                  id="ministry"
                  value={prophetMinistry}
                  onChange={(e) => setProphetMinistry(e.target.value)}
                  placeholder="Ministério de Cura e Profecia"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biography */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Biografia</CardTitle>
            <CardDescription>Descrição sobre a vida e ministério do profeta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="prophet-bio">Biografia Completa</Label>
              <Textarea
                id="prophet-bio"
                value={prophetBio}
                onChange={(e) => setProphetBio(e.target.value)}
                placeholder="Escreva sobre a vida e ministério do profeta..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Esta biografia será usada para contextualizar as respostas da IA
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2" disabled={isSaving || isUploading}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
