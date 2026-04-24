"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, BookOpen, BookMarked, ChevronRight, Sparkles, Lock } from "lucide-react"
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

  const appName = getConfigValue("app_identity", {})?.appName || "Falando com o Profeta"
  const prophetName = getConfigValue("prophet_profile", {})?.prophetName || "Profeta William Branham"
  const prophetAvatar = getConfigValue("prophet_profile", {})?.prophetAvatar || "/placeholder.svg"

  useEffect(() => {
    // Verificar se veio do onboarding
    const fromOnboarding = sessionStorage.getItem("from_onboarding")
    if (fromOnboarding === "true") {
      setIsNewUser(true)
      sessionStorage.removeItem("from_onboarding")
    }
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={prophetAvatar} alt={prophetName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {prophetName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-lg leading-tight">{appName}</h1>
            <p className="text-xs text-muted-foreground">Ministério de Fé</p>
          </div>
        </div>

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
      </header>

      {/* Main content */}
      <main className="px-4 md:px-6 pb-12">
        {/* Welcome message */}
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
          {isNewUser && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <Sparkles className="w-4 h-4" />
              Bem-vindo! Escolha uma opção abaixo
            </motion.div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
            {user ? `Olá, ${profile?.full_name?.split(" ")[0] || user.email?.split("@")[0]}!` : "Bem-vindo!"}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
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
                      ? "border-border/50 bg-card/80 opacity-70 cursor-not-allowed" 
                      : "cursor-pointer border-border hover:border-primary/50 bg-card hover:shadow-lg"
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
                    isComingSoon ? "bg-muted" : "bg-primary group-hover:scale-110"
                  )}>
                    <Icon className={cn(
                      "w-7 h-7",
                      isComingSoon ? "text-muted-foreground" : "text-white"
                    )} />
                  </div>

                  {/* Title */}
                  <h3 className={cn(
                    "text-lg font-bold mb-2 transition-colors",
                    isComingSoon ? "text-muted-foreground" : "group-hover:text-foreground"
                  )}>
                    {option.id === "chat" ? option.title.replace("Profeta William Branham", prophetName) : option.title}
                  </h3>

                  {/* Description */}
                  <p className={cn(
                    "text-sm leading-relaxed mb-4",
                    isComingSoon ? "text-muted-foreground/70" : "text-muted-foreground"
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
          <p className="text-xs text-muted-foreground">
            Ao usar este aplicativo, você aceita nossas{" "}
            <a href="/politica-privacidade" className="underline hover:text-foreground">
              Política de Privacidade
            </a>{" "}
            e{" "}
            <a href="/termos-de-uso" className="underline hover:text-foreground">
              Termos de Uso
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
