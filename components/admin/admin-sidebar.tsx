"use client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Crown,
  LayoutDashboard,
  Users,
  MessageSquare,
  FileText,
  AlertTriangle,
  Bot,
  Radio,
  Palette,
  User,
  MessageCircle,
  Brush,
  Shield,
  Database,
  Mail,
  Zap,
  Smartphone,
  BarChart3,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"

interface AdminSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  appConfig: {
    appName: string
    logo: string
    prophetName: string
  }
  isOpen: boolean
  onToggle: () => void
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Visão geral do sistema",
    icon: LayoutDashboard,
    category: "main",
  },
  {
    id: "users",
    label: "Usuários",
    description: "Gerenciar usuários",
    icon: Users,
    category: "main",
  },
  {
    id: "conversations",
    label: "Conversas",
    description: "Monitorar conversas",
    icon: MessageSquare,
    category: "main",
  },
  {
    id: "content",
    label: "Conteúdo",
    description: "Gerenciar conteúdo",
    icon: FileText,
    category: "main",
  },
  {
    id: "heresy",
    label: "Heresias",
    description: "Detectar heresias",
    icon: AlertTriangle,
    category: "main",
  },
  {
    id: "ai-settings",
    label: "IA",
    description: "Configurar IA",
    icon: Bot,
    category: "main",
  },
  {
    id: "radio",
    label: "Rádio Web",
    description: "Player de rádio",
    icon: Radio,
    category: "config",
  },
  {
    id: "app-identity",
    label: "Identidade",
    description: "Logo e identidade",
    icon: Palette,
    category: "config",
  },
  {
    id: "prophet-profile",
    label: "Perfil do Profeta",
    description: "Avatar e informações",
    icon: User,
    category: "config",
  },
  {
    id: "chat-behavior",
    label: "Comportamento",
    description: "Configurar chat",
    icon: MessageCircle,
    category: "config",
  },
  {
    id: "interface-theme",
    label: "Tema",
    description: "Cores e aparência",
    icon: Brush,
    category: "config",
  },
  {
    id: "security",
    label: "Segurança",
    description: "Configurações de segurança",
    icon: Shield,
    category: "config",
  },
  {
    id: "database",
    label: "Banco de Dados",
    description: "Configurações do BD",
    icon: Database,
    category: "config",
  },
  {
    id: "email-notifications",
    label: "E-mail",
    description: "Notificações por e-mail",
    icon: Mail,
    category: "config",
  },
  {
    id: "performance",
    label: "Performance",
    description: "Otimizações",
    icon: Zap,
    category: "config",
  },
  {
    id: "mobile-settings",
    label: "Mobile",
    description: "Configurações mobile",
    icon: Smartphone,
    category: "config",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Métricas e análises",
    icon: BarChart3,
    category: "config",
  },
  {
    id: "advanced",
    label: "Avançado",
    description: "Configurações avançadas",
    icon: Settings,
    category: "config",
  },
]

export function AdminSidebar({ activeTab, onTabChange, appConfig, isOpen, onToggle }: AdminSidebarProps) {
  const { profile } = useSupabaseAuth()

  const mainMenuItems = menuItems.filter((item) => item.category === "main")
  const configMenuItems = menuItems.filter((item) => item.category === "config")

  const handleMainSiteClick = () => {
    window.open("/", "_blank")
  }

  return (
    <div
      className={`${
        isOpen ? "w-80" : "w-16"
      } transition-all duration-300 bg-background border-r border-border flex flex-col h-full relative`}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted"
      >
        {isOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </Button>

      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Crown className="h-8 w-8" style={{ color: "#ff8100" }} />
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate" style={{ color: "#ff8100" }}>
                Painel Admin
              </h1>
              <p className="text-xs text-muted-foreground truncate">{appConfig.appName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Ver Site Principal Button */}
      {isOpen && (
        <div className="p-4">
          <Button
            onClick={handleMainSiteClick}
            className="w-full justify-start gap-2 text-white hover:opacity-90"
            style={{ backgroundColor: "#ff8100" }}
          >
            <ExternalLink className="h-4 w-4" />
            Ver Site Principal
          </Button>
        </div>
      )}

      {/* Menu Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Menu Principal */}
          <div>
            {isOpen && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#ff8100" }}></div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#ff8100" }}>
                  Menu Principal
                </span>
              </div>
            )}
            <div className="space-y-1">
              {mainMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 h-auto p-3 ${
                      isActive ? "bg-muted border-l-2" : "hover:bg-muted/50"
                    }`}
                    style={isActive ? { borderLeftColor: "#ff8100" } : {}}
                    onClick={() => onTabChange(item.id)}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" style={isActive ? { color: "#ff8100" } : {}} />
                    {isOpen && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                      </div>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Configurações */}
          <div>
            {isOpen && (
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-3 h-3" style={{ color: "#ff8100" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#ff8100" }}>
                  Configurações
                </span>
              </div>
            )}
            <div className="space-y-1">
              {configMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 h-auto p-3 ${
                      isActive ? "bg-muted border-l-2" : "hover:bg-muted/50"
                    }`}
                    style={isActive ? { borderLeftColor: "#ff8100" } : {}}
                    onClick={() => onTabChange(item.id)}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" style={isActive ? { color: "#ff8100" } : {}} />
                    {isOpen && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                      </div>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer - User Info */}
      {isOpen && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback style={{ backgroundColor: "#ff8100", color: "white" }}>
                {profile?.name?.charAt(0) || profile?.email?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">
                  {profile?.name || profile?.email?.split("@")[0] || "Admin"}
                </p>
                <Badge variant="secondary" className="text-xs" style={{ backgroundColor: "#ff8100", color: "white" }}>
                  Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-center" style={{ color: "#ff8100" }}>
              Painel Administrativo
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
