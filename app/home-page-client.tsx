"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat-interface"
import { ChatSidebar } from "@/components/chat-sidebar"
import { AuthModal } from "@/components/auth-modal"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, UserIcon, BookOpen } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useSessionTracking } from "@/hooks/use-session-tracking"
import { useQuestionCounter } from "@/hooks/use-question-counter"
import { Loader2, MessageCircle, MessageSquare } from "lucide-react"
import { useQuestionLimits } from "@/hooks/use-question-limits"
import { ChatGPTLandingPage } from "@/components/chatgpt-landing-page"
import { useAppConfig } from "@/hooks/use-app-config"
import { supabase } from "@/lib/supabase"

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

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [loadingConversations, setLoadingConversations] = useState(false)

  // Configurações da aplicação
  const appName = getConfigValue("app_identity", {})?.appName || "Falando com o Profeta"
  const prophetName = getConfigValue("prophet_profile", {})?.prophetName || "Profeta William Branham"
  const prophetAvatar = getConfigValue("prophet_profile", {})?.prophetAvatar || "/placeholder.svg?height=96&width=96"
  const logo = getConfigValue("app_identity", {})?.logo || "/placeholder.svg?height=32&width=32&text=Logo"
  const favicon = getConfigValue("app_identity", {})?.favicon || "/placeholder.svg?height=16&width=16&text=F"

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

  if (authLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div
          className="fixed inset-0 z-10 cursor-pointer"
          onClick={handleRegister}
          style={{ backgroundColor: "transparent" }}
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
            />
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} />
      </>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <ChatSidebar
            conversations={conversations}
            currentConversation={conversations.find((c) => c.id === currentConversationId) || null}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            user={user}
            appConfig={{ appName, logo, prophetName, prophetAvatar }}
            onClose={() => {}}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            isOpen={!sidebarCollapsed}
            loadingConversations={loadingConversations}
            isAdmin={isAdmin}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-80">
            <ChatSidebar
              conversations={conversations}
              currentConversation={conversations.find((c) => c.id === currentConversationId) || null}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              user={user}
              appConfig={{ appName, logo, prophetName, prophetAvatar }}
              onClose={() => setSidebarOpen(false)}
              onToggle={() => {}}
              isOpen={true}
              loadingConversations={loadingConversations}
              isAdmin={isAdmin}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-9 w-9 hover:bg-muted/50 lg:hidden"
                title="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:flex items-center gap-2 min-w-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={prophetAvatar || "/placeholder.svg"} alt={prophetName} />
                  <AvatarFallback className="text-xs">{prophetName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h1 className="text-xl font-bold text-foreground truncate">{appName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Question Limit Indicator */}
              {user && !isAdmin && limits && (
                <button 
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
                    ${limits.remaining <= 5 && limits.remaining > 0 
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700' 
                      : limits.remaining === 0 
                        ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                    } border
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
                className="gap-2 border-primary/20 hover:bg-primary/10 hover:border-primary/40"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Estudos Bíblicos</span>
              </Button>
              
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 px-2 gap-2 hover:bg-muted/50">
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
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
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
            />
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} />
    </>
  )
}
