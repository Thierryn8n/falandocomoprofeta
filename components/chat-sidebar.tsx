"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  Loader2,
  Shield,
  User,
  Clock,
  Settings,
  LogOut,
  Menu,
} from "lucide-react"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface UserType {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count?: number
}

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversation: Conversation | null
  onSelectConversation: (conversation: Conversation | null) => void
  onNewConversation: () => void
  onDeleteConversation?: (conversationId: string) => void
  user: UserType | null
  appConfig: {
    appName: string
    logo: string
    prophetName: string
    prophetAvatar?: string
  }
  onClose: () => void
  onToggle: () => void
  isOpen: boolean
  loadingConversations: boolean
  isAdmin: boolean
}

export function ChatSidebar({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  user,
  appConfig,
  onToggle,
  isOpen,
  loadingConversations,
  isAdmin,
}: ChatSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDeleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation()

      if (!confirm("Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.")) {
        return
      }

      setDeletingId(id)

      try {
        const { error } = await supabase.from("conversations").delete().eq("id", id)

        if (error) throw error

        // Se a conversa deletada é a atual, limpar seleção
        if (currentConversation?.id === id) {
          onSelectConversation(null)
        }

        // Chamar callback se fornecido
        onDeleteConversation?.(id)

        toast.success("Conversa excluída com sucesso")
      } catch (error) {
        console.error("Erro ao excluir conversa:", error)
        toast.error("Erro ao excluir conversa")
      } finally {
        setDeletingId(null)
      }
    },
    [currentConversation?.id, onSelectConversation, onDeleteConversation],
  )

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return ""

    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 1) return "Agora"
    if (diffMinutes < 60) return `${diffMinutes}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays === 0) return "Hoje"
    if (diffDays === 1) return "Ontem"
    if (diffDays <= 7) return `${diffDays}d atrás`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}sem atrás`

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: diffDays > 365 ? "numeric" : undefined,
    })
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
      toast.success("Logout realizado com sucesso")
    } catch (error) {
      console.error("Erro no logout:", error)
      toast.error("Erro ao fazer logout")
    }
  }, [router])

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r border-border/40 transition-all duration-300 ease-in-out shadow-sm",
        isOpen ? "w-80" : "w-16",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border/40 bg-card/50">
        {isOpen ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative">
                <img
                  src={appConfig.logo || "/placeholder.svg"}
                  alt="Logo"
                  className="h-8 w-8 rounded-lg flex-shrink-0 ring-2 ring-primary/10"
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold text-sm truncate">{appConfig.appName}</span>
                <span className="text-xs text-muted-foreground truncate">Chat com IA</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 flex-shrink-0 hover:bg-accent"
              title="Recolher sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 mx-auto hover:bg-accent"
            title="Expandir sidebar"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* New Conversation Button */}
      <div className="p-3">
        <Button
          onClick={onNewConversation}
          className={cn(
            "w-full justify-start gap-3 h-11 font-medium transition-all",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "shadow-sm hover:shadow-md",
          )}
          title={isOpen ? "Iniciar nova conversa" : "Nova Conversa"}
        >
          <div className={cn("flex items-center", !isOpen && "w-full justify-center")}>
            <Plus className={cn("h-4 w-4", isOpen && "mr-2")} />
            {isOpen && "Nova Conversa"}
          </div>
        </Button>
      </div>

      {/* User Info */}
      {user && isOpen && (
        <div className="px-3 pb-3">
          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name || user.email.split("@")[0]}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                {isAdmin && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 pb-4">
          {loadingConversations ? (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : user ? (
            conversations.length > 0 ? (
              conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-sm group",
                    "border-border/40 hover:border-border/60",
                    currentConversation?.id === conversation.id
                      ? "bg-accent/50 border-primary/50 shadow-sm"
                      : "bg-card/30 hover:bg-accent/30",
                    !isOpen && "p-0 h-12 flex items-center justify-center mx-1",
                  )}
                  onClick={() => onSelectConversation(conversation)}
                  onMouseEnter={() => setHoveredId(conversation.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  title={isOpen ? "" : conversation.title}
                >
                  <CardContent className={cn("p-3", !isOpen && "p-0 flex items-center justify-center")}>
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className={cn(
                          "flex-shrink-0 p-2 rounded-lg transition-colors",
                          currentConversation?.id === conversation.id
                            ? "bg-primary/10 text-primary"
                            : "bg-muted/50 text-muted-foreground group-hover:bg-muted",
                          !isOpen && "p-0 bg-transparent",
                        )}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </div>

                      {isOpen && (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate leading-tight mb-1">{conversation.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(conversation.updated_at || conversation.created_at)}</span>
                              {conversation.message_count && conversation.message_count > 0 && (
                                <>
                                  <Separator orientation="vertical" className="h-3" />
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    {conversation.message_count}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>

                          {(hoveredId === conversation.id || currentConversation?.id === conversation.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7 flex-shrink-0 opacity-60 hover:opacity-100 transition-all",
                                "hover:bg-destructive/10 hover:text-destructive",
                                deletingId === conversation.id && "opacity-50 cursor-not-allowed",
                              )}
                              onClick={(e) => handleDeleteConversation(conversation.id, e)}
                              disabled={deletingId === conversation.id}
                              title="Excluir conversa"
                            >
                              {deletingId === conversation.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 px-4">
                <div className="bg-muted/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                {isOpen && (
                  <>
                    <h3 className="text-sm font-medium mb-1">Nenhuma conversa</h3>
                    <p className="text-xs text-muted-foreground">
                      Inicie uma nova conversa para começar a falar com o {appConfig.prophetName}
                    </p>
                  </>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-12 px-4">
              <div className="bg-muted/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              {isOpen && (
                <>
                  <h3 className="text-sm font-medium mb-1">Faça login</h3>
                  <p className="text-xs text-muted-foreground">Entre na sua conta para ver suas conversas</p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="p-3 space-y-2 border-t border-border/40 bg-card/30">
        {/* Admin Panel Button */}
        {isAdmin && (
          <Button
            onClick={() => router.push("/admin")}
            variant="outline"
            className={cn(
              "w-full justify-start gap-3 h-10 font-medium transition-all",
              "border-border/40 hover:border-border/60 hover:bg-accent/50",
              !isOpen && "px-0 justify-center",
            )}
            title={isOpen ? "Acessar painel administrativo" : "Painel Admin"}
          >
            <Shield className={cn("h-4 w-4 text-primary", isOpen && "mr-0")} />
            {isOpen && "Painel Admin"}
          </Button>
        )}

        {/* Settings Button */}
        {user && (
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-10 font-medium transition-all",
              "hover:bg-accent/50",
              !isOpen && "px-0 justify-center",
            )}
            title={isOpen ? "Configurações" : "Configurações"}
          >
            <Settings className={cn("h-4 w-4", isOpen && "mr-0")} />
            {isOpen && "Configurações"}
          </Button>
        )}

        {/* Logout Button */}
        {user && (
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-10 font-medium transition-all",
              "hover:bg-destructive/10 hover:text-destructive",
              !isOpen && "px-0 justify-center",
            )}
            title={isOpen ? "Sair da conta" : "Sair"}
          >
            <LogOut className={cn("h-4 w-4", isOpen && "mr-0")} />
            {isOpen && "Sair"}
          </Button>
        )}
      </div>

      {/* Footer */}
      {isOpen && (
        <div className="p-4 border-t border-border/40 bg-card/20">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              {appConfig.prophetAvatar ? (
                <img
                  src={appConfig.prophetAvatar}
                  alt={appConfig.prophetName}
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs text-primary font-bold">
                    {appConfig.prophetName?.charAt(0) || "P"}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Baseado nas mensagens de</p>
            </div>
            <p className="text-sm font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {appConfig.prophetName}
            </p>
            <p className="text-xs text-muted-foreground/70">Inteligência Artificial Cristã</p>
          </div>
        </div>
      )}
    </div>
  )
}
