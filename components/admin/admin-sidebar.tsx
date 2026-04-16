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
  Globe,
  CreditCard,
} from "lucide-react"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { usePaymentSystemConfig } from "@/hooks/use-payment-system-config"

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
    id: "heresy-logs",
    label: "Logs de Heresias",
    description: "Histórico de detecções de heresias",
    icon: AlertTriangle,
    category: "main",
  },
  {
    id: "mercado-pago-unified",
    label: "Mercado Pago",
    description: "Sistema completo Mercado Pago",
    icon: CreditCard,
    category: "main",
  },
  {
    id: "pix-settings",
    label: "Configuração PIX",
    description: "Configurar chave PIX",
    icon: CreditCard,
    category: "main",
  },
  {
    id: "payment-systems",
    label: "Sistemas de Pagamento",
    description: "Gerenciar sistema de pagamentos",
    icon: CreditCard,
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
    id: "geolocation",
    label: "Geolocalização",
    description: "Localização dos usuários",
    icon: BarChart3,
    category: "main",
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
  const { isMercadoPagoActive } = usePaymentSystemConfig()

  // Filtrar itens do menu baseado no sistema de pagamento ativo
  const filteredMenuItems = menuItems.filter(item => {
    // Se for um item de Mercado Pago, mostrar apenas se ativo
    if (item.id === "mercado-pago-unified") {
      return isMercadoPagoActive()
    }
    // Outros itens são sempre mostrados
    return true
  })

  const mainMenuItems = filteredMenuItems.filter(item => item.category === "main")
  const configMenuItems = filteredMenuItems.filter(item => item.category === "config")

  const handleMainSiteClick = () => {
    window.open("/", "_blank")
  }

  const handleUpgradePageClick = () => {
    window.open("/upgrade", "_blank")
  }

  return (
    <div
      className={`${
        isOpen ? "w-64 sm:w-72 md:w-80" : "w-14 sm:w-16"
      } transition-all duration-300 bg-background border-r border-border flex flex-col h-full relative`}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute -right-3 top-6 z-10 h-5 w-5 sm:h-6 sm:w-6 rounded-full border bg-background shadow-md hover:bg-muted"
      >
        {isOpen ? <ChevronLeft className="h-2 w-2 sm:h-3 sm:w-3" /> : <ChevronRight className="h-2 w-2 sm:h-3 sm:w-3" />}
      </Button>

      {/* Header */}
      <div className="p-2 sm:p-3 md:p-4 border-b border-border">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <Crown className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" style={{ color: "#ff8100" }} />
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate" style={{ color: "#ff8100" }}>
                Painel Admin
              </h1>
              <p className="text-xs text-muted-foreground truncate">{appConfig.appName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Ver Site Principal Button */}
      {isOpen && (
        <div className="p-2 sm:p-3 md:p-4 space-y-2">
          <Button
            onClick={handleMainSiteClick}
            className="w-full justify-start gap-2 text-white hover:opacity-90 text-xs sm:text-sm"
            style={{ backgroundColor: "#ff8100" }}
          >
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
            Ver Site Principal
          </Button>
          <Button
            onClick={handleUpgradePageClick}
            className="w-full justify-start gap-2 text-white hover:opacity-90 text-xs sm:text-sm"
            style={{ backgroundColor: "#9333ea" }}
          >
            <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
            Ver Página Upgrade
          </Button>
        </div>
      )}

      {/* Menu Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 sm:p-3 md:p-4 space-y-4 sm:space-y-6">
          {/* Menu Principal */}
          <div>
            {isOpen && (
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: "#ff8100" }}></div>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: "#ff8100" }}>
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
                    className={`w-full justify-start gap-2 sm:gap-3 h-auto p-2 sm:p-3 ${
                      isActive ? "bg-muted border-l-2" : "hover:bg-muted/50"
                    }`}
                    style={isActive ? { borderLeftColor: "#ff8100" } : {}}
                    onClick={() => onTabChange(item.id)}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={isActive ? { color: "#ff8100" } : {}} />
                    {isOpen && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs sm:text-sm font-medium truncate">{item.label}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.description}</div>
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
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Settings className="w-2 h-2 sm:w-3 sm:h-3" style={{ color: "#ff8100" }} />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: "#ff8100" }}>
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
                    className={`w-full justify-start gap-2 sm:gap-3 h-auto p-2 sm:p-3 ${
                      isActive ? "bg-muted border-l-2" : "hover:bg-muted/50"
                    }`}
                    style={isActive ? { borderLeftColor: "#ff8100" } : {}}
                    onClick={() => onTabChange(item.id)}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={isActive ? { color: "#ff8100" } : {}} />
                    {isOpen && (
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs sm:text-sm font-medium truncate">{item.label}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.description}</div>
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
        <div className="p-2 sm:p-3 md:p-4 border-t border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback style={{ backgroundColor: "#ff8100", color: "white" }}>
                {profile?.name?.charAt(0) || profile?.email?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <p className="text-xs sm:text-sm font-medium truncate">
                  {profile?.name || profile?.email?.split("@")[0] || "Admin"}
                </p>
                <Badge variant="secondary" className="text-[10px] sm:text-xs" style={{ backgroundColor: "#ff8100", color: "white" }}>
                  Admin
                </Badge>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          </div>
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
            <p className="text-[10px] sm:text-xs text-center" style={{ color: "#ff8100" }}>
              Painel Administrativo
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
