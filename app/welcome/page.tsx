"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, BookOpen, BookMarked, ChevronRight, Sparkles, Lock, Sun, Moon, Palette } from "lucide-react"
import { useAppConfig } from "@/hooks/use-app-config"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"

// Estilos de tema (mesmo da Bíblia)
const themeStyles = {
  light: {
    name: "Claro",
    bg: "bg-[#FFFFFF]",
    text: "text-[#1A1A1A]",
    verseNum: "text-[#A89080]",
    border: "border-[#E0E0E0]",
    header: "bg-[#FFFFFF]/95 border-[#E0E0E0]",
    card: "bg-[#F5F5F5] border-[#E0E0E0]",
    button: "bg-[#D4D4D4] hover:bg-[#C4C4C4] text-[#1A1A1A]",
    primary: "bg-[#A89080] text-white",
    muted: "text-[#4A4A4A]",
    previewBg: "#FFFFFF",
    previewText: "#1A1A1A",
    previewAccent: "#A89080",
    selectionBg: "#A89080",
    selectionText: "#FFFFFF"
  },
  dark: {
    name: "Escuro",
    bg: "bg-[#1A1A1A]",
    text: "text-[#E8E0D5]",
    verseNum: "text-[#A89080]",
    border: "border-[#333333]",
    header: "bg-[#1A1A1A]/95 border-[#333333]",
    card: "bg-[#242424] border-[#333333]",
    button: "bg-[#3D3D3D] hover:bg-[#4D4D4D] text-[#E8E0D5]",
    primary: "bg-[#A89080] text-[#1A1A1A]",
    muted: "text-[#B8A898]",
    previewBg: "#1A1A1A",
    previewText: "#E8E0D5",
    previewAccent: "#A89080",
    selectionBg: "#A89080",
    selectionText: "#1A1A1A"
  },
  sepia: {
    name: "Sépia",
    bg: "bg-[#F4ECD8]",
    text: "text-[#5C4D3C]",
    verseNum: "text-[#8B7355]",
    border: "border-[#D4C4A8]",
    header: "bg-[#F4ECD8]/95 border-[#D4C4A8]",
    card: "bg-[#FAF3E8] border-[#D4C4A8]",
    button: "bg-[#D4C4A8] hover:bg-[#C4B498] text-[#5C4D3C]",
    primary: "bg-[#8B7355] text-white",
    muted: "text-[#6B5D4C]",
    previewBg: "#F4ECD8",
    previewText: "#5C4D3C",
    previewAccent: "#8B7355",
    selectionBg: "#8B7355",
    selectionText: "#F4ECD8"
  },
  night: {
    name: "Noite",
    bg: "bg-[#0D1117]",
    text: "text-[#C9D1D9]",
    verseNum: "text-[#58A6FF]",
    border: "border-[#21262D]",
    header: "bg-[#0D1117]/95 border-[#21262D]",
    card: "bg-[#161B22] border-[#21262D]",
    button: "bg-[#30363D] hover:bg-[#3D444D] text-[#C9D1D9]",
    primary: "bg-[#58A6FF] text-[#0A0A0A]",
    muted: "text-[#9BA1A6]",
    previewBg: "#0D1117",
    previewText: "#C9D1D9",
    previewAccent: "#58A6FF",
    selectionBg: "#58A6FF",
    selectionText: "#0D1117"
  }
}

const options = [
  {
    id: "chat",
    title: "Falar com o Profeta",
    description: "Converse com o Profeta William Branham através de IA. Tire suas dúvidas sobre a Palavra de Deus.",
    icon: MessageCircle,
    color: "bg-primary",
    bgColor: "bg-card",
    borderColor: "border-border hover:border-primary/50",
    href: "/chat",
  },
  {
    id: "bible-study",
    title: "Estudos Bíblicos",
    description: "Explore mapas mentais interativos e estudos organizados para aprofundar seu conhecimento bíblico.",
    icon: BookOpen,
    color: "bg-primary",
    bgColor: "bg-card",
    borderColor: "border-border hover:border-primary/50",
    href: "/bible-study-miro",
    comingSoon: true,
  },
  {
    id: "bible",
    title: "Bíblia Almeida Revelada",
    description: "Leia a Bíblia Almeida Revelada, versão King James 1611, em português.",
    icon: BookMarked,
    color: "bg-primary",
    bgColor: "bg-card",
    borderColor: "border-border hover:border-primary/50",
    href: "/biblia",
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const { user, profile, signOut, loading } = useSupabaseAuth()
  const { getConfigValue } = useAppConfig()
  const [isNewUser, setIsNewUser] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark" | "sepia" | "night">("sepia")
  const [showThemeSettings, setShowThemeSettings] = useState(false)

  const appName = getConfigValue("app_identity", {})?.appName || "Falando com o Profeta"
  const prophetName = getConfigValue("prophet_profile", {})?.prophetName || "Profeta William Branham"
  const prophetAvatar = getConfigValue("prophet_profile", {})?.prophetAvatar || "/placeholder.svg"
  const currentTheme = themeStyles[theme]

  useEffect(() => {
    // Carregar tema do localStorage
    const savedTheme = localStorage.getItem("welcome_theme") as "light" | "dark" | "sepia" | "night"
    if (savedTheme) {
      setTheme(savedTheme)
    }
    // Verificar se veio do onboarding
    const fromOnboarding = sessionStorage.getItem("from_onboarding")
    if (fromOnboarding === "true") {
      setIsNewUser(true)
      sessionStorage.removeItem("from_onboarding")
    }
  }, [])

  useEffect(() => {
    // Salvar tema no localStorage
    localStorage.setItem("welcome_theme", theme)
  }, [theme])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", currentTheme.bg)}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-transparent" style={{ borderTopColor: "transparent", borderColor: currentTheme.primary }} />
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen", currentTheme.bg)}>
      {/* Header */}
      <header className={cn("p-4 md:p-6 flex items-center justify-between border-b", currentTheme.header, currentTheme.border)}>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={prophetAvatar} alt={prophetName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {prophetName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className={cn("font-bold text-lg leading-tight", currentTheme.text)}>{appName}</h1>
            <p className={cn("text-xs", currentTheme.muted)}>Ministério de Fé</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Tema */}
          <Sheet open={showThemeSettings} onOpenChange={setShowThemeSettings}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("hover:!bg-transparent", currentTheme.button)}>
                <Palette className={cn("h-5 w-5", currentTheme.text)} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className={cn(currentTheme.card, currentTheme.border, currentTheme.text)}>
              <SheetTitle className={cn("mb-4", currentTheme.text)}>Configurações de Tema</SheetTitle>
              <div className="space-y-4">
                <h3 className={cn("font-bold", currentTheme.text)}>Tema</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(themeStyles).map(([key, style]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key as any)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all",
                        theme === key 
                          ? "ring-2 ring-offset-2 ring-primary border-primary" 
                          : "border-border hover:border-primary/50"
                      )}
                      style={{ 
                        backgroundColor: style.previewBg,
                        borderColor: theme === key ? style.previewAccent : style.border.replace("border-", "")
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {key === "light" && <Sun className="h-4 w-4" />}
                        {key === "dark" && <Moon className="h-4 w-4" />}
                        {key === "sepia" && <Palette className="h-4 w-4" />}
                        {key === "night" && <Moon className="h-4 w-4" />}
                        <span className="text-sm font-medium" style={{ color: style.previewText }}>{style.name}</span>
                      </div>
                      {theme === key && (
                        <div className="text-xs font-medium px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: style.previewAccent, color: style.selectionText }}>
                          ✓ Ativo
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.full_name || user.email} />
                    <AvatarFallback>{(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-24 truncate">
                    {profile?.full_name || user.email?.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{profile?.full_name || user.email?.split("@")[0]}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/configuracoes")}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => router.push("/")} variant="outline" size="sm">
              Entrar
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 md:px-6 pb-12">
        {/* Welcome message */}
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
          {isNewUser && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
              style={{ backgroundColor: currentTheme.primaryBg || currentTheme.primary + "20", color: currentTheme.primary }}
            >
              <Sparkles className="w-4 h-4" />
              Bem-vindo! Escolha uma opção abaixo
            </motion.div>
          )}
          <h2 className={cn("text-3xl md:text-4xl font-bold mb-3", currentTheme.text)}>
            {user ? `Olá, ${profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}!` : "Bem-vindo!"}
          </h2>
          <p className={cn("max-w-lg mx-auto", currentTheme.muted)}>
            {user 
              ? "Escolha uma das opções abaixo para continuar sua jornada espiritual."
              : "Entre na sua conta para acessar todos os recursos do aplicativo."}
          </p>
        </div>

        {/* Options grid */}
        <div className="max-w-4xl mx-auto grid gap-4 md:gap-6 md:grid-cols-3">
          {options.map((option, index) => {
            const Icon = option.icon
            const isComingSoon = option.comingSoon
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  onClick={() => !isComingSoon && router.push(option.href)}
                  className={cn(
                    "group p-6 h-full border-2 transition-all duration-300 relative",
                    isComingSoon 
                      ? cn("opacity-70 cursor-not-allowed", currentTheme.card)
                      : cn("cursor-pointer hover:shadow-lg", currentTheme.card)
                  )}
                >
                  {/* Badge "Em Breve" */}
                  {isComingSoon && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600 text-xs font-medium">
                      <Lock className="w-3 h-3" />
                      <span>Em breve</span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-md transition-transform duration-300",
                    isComingSoon ? "bg-muted" : cn("group-hover:scale-110", currentTheme.primary)
                  )}>
                    <Icon className={cn(
                      "w-7 h-7",
                      isComingSoon ? "text-muted-foreground" : "text-white"
                    )} />
                  </div>

                  {/* Title */}
                  <h3 className={cn(
                    "text-lg font-bold mb-2 transition-colors",
                    isComingSoon ? "text-muted-foreground" : currentTheme.text
                  )}>
                    {option.id === "chat" ? option.title.replace("Profeta William Branham", prophetName) : option.title}
                  </h3>

                  {/* Description */}
                  <p className={cn(
                    "text-sm leading-relaxed mb-4",
                    isComingSoon ? "text-muted-foreground/70" : currentTheme.muted
                  )}>
                    {isComingSoon ? "🚧 Em desenvolvimento..." : option.description}
                  </p>

                  {/* CTA */}
                  <div className={cn(
                    "flex items-center text-sm font-medium",
                    isComingSoon ? "text-muted-foreground" : "text-primary"
                  )}>
                    <span>{isComingSoon ? "Aguarde" : "Acessar"}</span>
                    {!isComingSoon && <ChevronRight className="w-4 h-4 ml-1" />}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Cookie consent reminder */}
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <p className={cn("text-xs", currentTheme.muted)}>
            Ao usar este aplicativo, você aceita nossas{" "}
            <a href="/politica-privacidade" className={cn("underline hover:text-foreground", currentTheme.text)}>
              Política de Privacidade
            </a>{" "}
            e{" "}
            <a href="/termos-de-uso" className={cn("underline hover:text-foreground", currentTheme.text)}>
              Termos de Uso
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
