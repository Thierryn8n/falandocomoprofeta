"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { generateAvatarUrl, getInitials, getAvatarColor } from "@/lib/utils"
import { Loader2, Upload, ArrowLeft, User, Mail, Key } from "lucide-react"

interface Profile {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  role: string
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error loading profile:", error)
        return
      }

      setProfile(profile)
      setName(profile.name || "")
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", profile.id)

      if (error) {
        toast.error("Erro ao atualizar perfil")
        return
      }

      toast.success("Perfil atualizado com sucesso!")
    } catch (err) {
      toast.error("Erro ao atualizar perfil")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploadingAvatar(true)
    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop()
      const fileName = `avatars/${profile.id}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        toast.error("Erro ao fazer upload da imagem")
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName)

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", profile.id)

      if (updateError) {
        toast.error("Erro ao atualizar avatar")
        return
      }

      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success("Avatar atualizado!")
    } catch (err) {
      toast.error("Erro ao fazer upload")
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const avatarUrl = profile.avatar_url || generateAvatarUrl(profile.name || "", profile.email)
  const initials = getInitials(profile.name || profile.email || "?")
  const bgColor = getAvatarColor(profile.name || profile.email || "?")

  return (
    <div className="min-h-screen bg-[#F4ECD8]">
      {/* Header */}
      <header className="border-b border-[#D4C4A8] bg-[#FAF3E8]/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-[#8B7355] hover:bg-[#E8DCC8]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-[#5C4D3C]">Configurações</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <Card className="border-[#D4C4A8] bg-[#FAF3E8]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#5C4D3C]">
              <User className="w-5 h-5" />
              Perfil
            </CardTitle>
            <CardDescription className="text-[#6B5D4C]">
              Gerencie suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  {profile.avatar_url ? (
                    <AvatarImage src={avatarUrl} />
                  ) : (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: bgColor }}
                    >
                      {initials}
                    </div>
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div>
                <p className="font-medium text-[#5C4D3C]">{profile.name || "Sem nome"}</p>
                <p className="text-sm text-[#6B5D4C]">{profile.email}</p>
                <p className="text-xs text-[#8B7355] mt-1 capitalize">{profile.role}</p>
              </div>
            </div>

            <Separator />

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-[#5C4D3C]">
                <User className="w-4 h-4" />
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="border-[#D4C4A8] bg-[#F4ECD8] text-[#5C4D3C] focus-visible:border-[#8B7355]"
              />
            </div>

            {/* Email Field (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-[#5C4D3C]">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-[#D4C4A8] text-[#6B5D4C] border-[#D4C4A8]"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#8B7355] to-[#A89080] hover:from-[#7A6545] hover:to-[#978070] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="border-[#D4C4A8] bg-[#FAF3E8]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#5C4D3C]">
              <Key className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription className="text-[#6B5D4C]">
              Gerencie sua senha e segurança da conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => toast.info("Funcionalidade em desenvolvimento")}
              className="w-full border-[#D4C4A8] text-[#8B7355] hover:bg-[#E8DCC8]"
            >
              Alterar senha
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
