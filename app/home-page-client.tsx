"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat-interface"
import { ChatSidebar } from "@/components/chat-sidebar"
import { AuthModal } from "@/components/auth-modal"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, UserIcon, BookOpen, Shield, Sun, Moon, Palette } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useSessionTracking } from "@/hooks/use-session-tracking"
import { useQuestionCounter } from "@/hooks/use-question-counter"
import { Loader2, MessageCircle, MessageSquare } from "lucide-react"
import { useQuestionLimits } from "@/hooks/use-question-limits"
import { ChatGPTLandingPage } from "@/components/chatgpt-landing-page"
import { useAppConfig } from "@/hooks/use-app-config"
import { supabase } from "@/lib/supabase"
import { ModernLoader } from "@/components/modern-loader"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

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
    input: "bg-[#FFFFFF] border-[#E0E0E0]",
    userMessage: "bg-[#A89080] text-white",
    assistantMessage: "bg-[#F5F5F5] text-[#1A1A1A] border-[#E0E0E0]",
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
    input: "bg-[#1A1A1A] border-[#333333]",
    userMessage: "bg-[#A89080] text-[#1A1A1A]",
    assistantMessage: "bg-[#242424] text-[#E8E0D5] border-[#333333]",
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
    input: "bg-[#FFFFFF] border-[#D4C4A8]",
    userMessage: "bg-[#8B7355] text-white",
    assistantMessage: "bg-[#FAF3E8] text-[#5C4D3C] border-[#D4C4A8]",
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
    button: "bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9]",
    primary: "bg-[#58A6FF] text-[#0A0A0A]",
    muted: "text-[#8B949E]",
    input: "bg-[#0D1117] border-[#21262D]",
    userMessage: "bg-[#58A6FF] text-[#0A0A0A]",
    assistantMessage: "bg-[#161B22] text-[#C9D1D9] border-[#21262D]",
    previewBg: "#0D1117",
    previewText: "#C9D1D9",
    previewAccent: "#58A6FF",
    selectionBg: "#58A6FF",
    selectionText: "#0D1117"
  }
}

// Componente para acessibilidade
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
)

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count?: number
  messages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: string
  }>
}

export default function HomePageClient() {
  const { user, profile, loading: authLoading, isAdmin, signOut } = useSupabaseAuth()
  const { getConfigValue, loading: configLoading } = useAppConfig()
  const { questionCount, loading: questionCountLoading } = useQuestionCounter()
  const { limits, loading: limitsLoading } = useQuestionLimits()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const { sessionId } = useSessionTracking()
  const supabaseClient = createClientComponentClient()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark" | "sepia" | "night">("sepia")
  const [showThemeSettings, setShowThemeSettings] = useState(false)

  const currentTheme = themeStyles[theme]

  // Configurações da aplicação
  const appName = getConfigValue("app_identity", {})?.appName || "Falando com o Profeta"
  const prophetName = getConfigValue("prophet_profile", {})?.prophetName || "Profeta William Branham"
  const prophetAvatar = getConfigValue("prophet_profile", {})?.prophetAvatar || "/placeholder.svg?height=96&width=96"
  const logo = getConfigValue("app_identity", {})?.logo || "/placeholder.svg?height=32&width=32&text=Logo"
  const favicon = getConfigValue("app_identity", {})?.favicon || "/placeholder.svg?height=16&width=16&text=F"

  // Carregar tema do localStorage para usuários não autenticados
  useEffect(() => {
    if (!user) {
      const savedTheme = localStorage.getItem("landing_theme") as "light" | "dark" | "sepia" | "night"
      if (savedTheme) {
        setTheme(savedTheme)
      }
    }
  }, [user])

  // Carregar tema do Supabase para usuários autenticados
  const loadTheme = async () => {
    if (!user) return

    try {
      const { data, error } = await supabaseClient
        .from("user_tts_preferences")
        .select("theme")
        .eq("user_id", user.id)
        .single()

      if (data && data.theme) {
        setTheme(data.theme as any)
      }
    } catch (error) {
      console.error("Erro ao carregar tema:", error)
    }
  }

  // Salvar tema
  const saveTheme = async () => {
    if (user) {
      try {
        await supabaseClient
          .from("user_tts_preferences")
          .upsert({
            user_id: user.id,
            theme: theme,
          }, {
            onConflict: "user_id"
          })
      } catch (error) {
        console.error("Erro ao salvar tema:", error)
      }
    } else {
      localStorage.setItem("landing_theme", theme)
    }
  }

  useEffect(() => {
    if (user) {
      loadTheme()
    }
  }, [user])

  useEffect(() => {
    saveTheme()
  }, [theme, user])

  // Debug: Log config values
  useEffect(() => {
    console.log("[HomePage] App Config Values:", {
      appName,
      prophetName,
      prophetAvatar,
      logo,
      favicon,
      rawProphetProfile: getConfigValue("prophet_profile", {}),
      rawAppIdentity: getConfigValue("app_identity", {})
    })
  }, [appName, prophetName, prophetAvatar, logo, favicon])

  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      return
    }

    setLoadingConversations(true)
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, created_at, updated_at, messages")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error loading conversations:", error)
        setConversations([])
      } else {
        const formattedConversations = (data || []).map((conv: any) => ({
          ...conv,
          message_count: Array.isArray(conv.messages) ? conv.messages.length : 0,
          messages: Array.isArray(conv.messages) ? conv.messages : [],
        }))
        setConversations(formattedConversations)
      }
    } catch (error) {
      console.error("Error loading conversations:", error)
      setConversations([])
    } finally {
      setLoadingConversations(false)
    }
  }, [user])

  const handleLogin = () => {
    setShowAuthModal(true)
  }

  const handleRegister = () => {
    setShowAuthModal(true)
  }

  const handleCloseAuthModal = () => {
    setShowAuthModal(false)
  }

  const handleLoginSuccess = () => {
    setShowAuthModal(false)
  }

  const handleLogout = async () => {
    await signOut()
    setConversations([])
    setCurrentConversationId(null)
  }

  const handleNewConversation = () => {
    setCurrentConversationId(null)
    if (sidebarOpen) setSidebarOpen(false)
  }

  const handleSelectConversation = (conversation: Conversation | null) => {
    setCurrentConversationId(conversation?.id || null)
    if (sidebarOpen) setSidebarOpen(false)
  }

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, loadConversations])

  useEffect(() => {
    // Log page view for analytics
    if (sessionId) {
      console.log("Session tracking active:", sessionId)
    }
  }, [sessionId])

  // Redirect logged in users to welcome/onboarding via Supabase
  useEffect(() => {
    if (user && !authLoading && !configLoading && profile) {
      // Check if user has completed onboarding in Supabase
      const hasCompletedOnboarding = profile.onboarding_completed === true
      
      if (hasCompletedOnboarding) {
        router.replace("/welcome")
      } else {
        router.replace("/onboarding")
      }
    }
  }, [user, profile, authLoading, configLoading, router])

  // Show modern loader while checking auth/config OR while redirecting logged user
  if (authLoading || configLoading || user) {
    return <ModernLoader message={user ? "Redirecionando" : "Carregando"} theme={currentTheme} />
  }

  if (!user) {
    return (
      <>
        <div
          className={cn("fixed inset-0 z-10 cursor-pointer", currentTheme.bg)}
          onClick={handleRegister}
        />
        <div className="relative z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <ChatGPTLandingPage 
              onLogin={handleLogin} 
              appConfig={{ 
                appName, 
                prophetName, 
                prophetAvatar 
              }}
              theme={currentTheme}
            />
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} theme={currentTheme} />
      </>
    )
  }

  return (
    <>
      <div className={cn("flex h-screen", currentTheme.bg)}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ChatSidebar
            conversations={conversations}
            currentConversation={conversations.find((c) => c.id === currentConversationId) || null}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            user={user}
            appConfig={{ appName, logo, prophetName }}
            onClose={() => {}}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            isOpen={!sidebarCollapsed}
            loadingConversations={loadingConversations}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className={cn("p-0 w-80", currentTheme.card)}>
            <SheetTitle asChild>
              <VisuallyHidden>Conversas</VisuallyHidden>
            </SheetTitle>
            <ChatSidebar
              conversations={conversations}
              currentConversation={conversations.find((c) => c.id === currentConversationId) || null}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              user={user}
              appConfig={{ appName, logo, prophetName }}
              onClose={() => setSidebarOpen(false)}
              onToggle={() => {}}
              isOpen={true}
              loadingConversations={loadingConversations}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className={cn("flex items-center justify-between p-4 border-b", currentTheme.header, currentTheme.border)}>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className={cn("h-9 w-9", currentTheme.button)}
                title="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:flex items-center gap-2 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={prophetAvatar || "/placeholder.svg"} alt={prophetName} />
                  <AvatarFallback className="text-xs">{prophetName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h1 className={cn("text-xl font-bold truncate", currentTheme.text)}>{appName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Question Limit Indicator - só aparece para não-admins */}
              {user && !limits?.is_admin && limits && (
                <button 
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border
                    ${limits.remaining <= 5 && limits.remaining > 0 
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700' 
                      : limits.remaining === 0 
                        ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                    }
                  `}
                  onClick={() => router.push('/doar')}
                  title="Clique para doar e ganhar mais perguntas"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {limitsLoading ? '...' : `${limits.remaining} restantes`}
                  </span>
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden ml-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        limits.remaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (limits.remaining / limits.max_allowed) * 100))}%` }}
                    />
                  </div>
                </button>
              )}

              {/* Botão Estudos Bíblicos */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/bible-study-miro')}
                className="gap-2 border-[#8B7355]/20 hover:bg-[#8B7355]/10 hover:border-[#8B7355]/40 text-[#8B7355]"
              >
                <BookOpen className="h-4 w-4 text-[#8B7355]" />
                <span className="hidden sm:inline">Estudos Bíblicos</span>
              </Button>
              
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
                              ? "ring-2 ring-offset-2 ring-[#8B7355] border-[#8B7355]" 
                              : "border-border hover:border-[#8B7355]/50"
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={cn("h-9 px-2 gap-2", currentTheme.button)}>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.name || user.email} />
                      <AvatarFallback className="text-xs">
                        {(profile?.name || user.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline-block max-w-32 truncate">
                      {profile?.name || user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.name || user.email} />
                      <AvatarFallback>{(profile?.name || user.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.name || user.email?.split("@")[0]}</p>
                      <p className="text-xs leading-none text-[#8B7355]">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              conversationId={currentConversationId}
              onConversationUpdate={loadConversations}
              user={user}
              appConfig={{ appName, prophetName, prophetAvatar }}
              theme={currentTheme}
            />
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} theme={currentTheme} />
    </>
  )
}
