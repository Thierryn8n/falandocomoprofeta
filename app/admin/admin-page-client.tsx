"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { DashboardOverview } from "@/components/admin/dashboard-overview"
import { UserManager } from "@/components/admin/user-manager"
import { ContentManager } from "@/components/admin/content-manager"
import { HeresyManagement } from "@/components/admin/heresy-management"
import { HeresyLogs } from "@/components/admin/heresy-logs"
import { APIKeysConfig } from "@/components/admin/api-keys-config"
import { AISettings } from "@/components/admin/ai-settings"
import { ConversationsManager } from "@/components/admin/conversations-manager"
import { GeolocationChart } from "@/components/admin/geolocation-chart"
import { AppIdentityConfig } from '@/components/admin/config/app-identity-config'
import { ProphetProfileConfig } from "@/components/admin/config/prophet-profile-config"
import { ChatBehaviorConfig } from "@/components/admin/config/chat-behavior-config"
import { InterfaceThemeConfig } from "@/components/admin/config/interface-theme-config"
import { SecurityConfig } from "@/components/admin/config/security-config"
import MercadoPagoUnified from "@/components/admin/mercado-pago-unified"
import PaymentSystemSelector from "@/components/admin/payment-system-selector"
import { DatabaseConfig } from "@/components/admin/config/database-config"
import { EmailNotificationsConfig } from "@/components/admin/config/email-notifications-config"
import { PerformanceConfig } from "@/components/admin/config/performance-config"
import { MobileSettingsConfig } from "@/components/admin/config/mobile-settings-config"
import { AnalyticsConfig } from "@/components/admin/config/analytics-config"
import { AdvancedConfig } from "@/components/admin/config/advanced-config"
import PixSettingsPage from "./pix-settings/page"
import { useSupabaseAuth } from "@/hooks/use-supabase-auth"
import { useAppConfig } from "@/hooks/use-app-config"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Estilos de tema
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
    input: "bg-[#0D1117] border-[#21262D]",
    userMessage: "bg-[#58A6FF] text-[#0A0A0A]",
    assistantMessage: "bg-[#161B22] text-[#C9D1D9] border-[#21262D]",
  }
}

export default function AdminPageClient() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [currentTheme, setCurrentTheme] = useState(themeStyles.sepia)
  const { user, profile, loading: authLoading, isAdmin } = useSupabaseAuth()
  const { getConfigValue, updateConfig, loading: configLoading } = useAppConfig()
  const { toast } = useToast()

  useEffect(() => {
    const savedTheme = localStorage.getItem("adminTheme") as keyof typeof themeStyles
    if (savedTheme && themeStyles[savedTheme]) {
      setCurrentTheme(themeStyles[savedTheme])
    }
  }, [])

  useEffect(() => {
    console.log("Admin Page Debug:", {
      user: user?.email,
      profile: profile,
      isAdmin: isAdmin,
      authLoading: authLoading,
    })
  }, [user, profile, isAdmin, authLoading])

  useEffect(() => {
    // Esperar o carregamento de autenticação terminar antes de redirecionar
    if (authLoading) {
      return // Ainda carregando, não faz nada
    }

    if (!user) {
      console.log("No user found, redirecting to home")
      window.location.href = "/"
      return
    }

    if (!isAdmin) {
      console.log("User is not admin, current role:", profile?.role)
      // Dar um tempo adicional para o profile carregar
      const timer = setTimeout(() => {
        if (!isAdmin) {
          window.location.href = "/"
        }
      }, 1000)
      return () => clearTimeout(timer)
    }

    console.log("User is admin, allowing access")
  }, [user, isAdmin, authLoading, profile?.role])

  const handleConfigUpdate = async (category: string, newValues: Record<string, any>) => {
    try {
      await updateConfig(category, newValues)
      toast({
        title: "Configurações atualizadas",
        description: "As alterações foram salvas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    }
  }



  if (authLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4ECD8]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#8B7355] mx-auto mb-4" />
          <p className="text-[#6B5D4C]">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4ECD8]">
        <div className="text-center">
          <p className="text-[#6B5D4C]">Usuário não encontrado. Redirecionando...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4ECD8]">
        <div className="text-center">
          <p className="text-[#6B5D4C]">Acesso negado. Você não tem permissões de administrador.</p>
          <p className="text-sm text-[#8B7355] mt-2">Role atual: {profile?.role || "não definido"}</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />
      case "users":
        return <UserManager />
      case "conversations":
        return <ConversationsManager />
      case "geolocation":
        return <GeolocationChart />
      case "content":
        return <ContentManager />
      case "heresy":
        return <HeresyManagement />
      case "heresy-logs":
        return <HeresyLogs />
      case "abacate-pay-unified":
        return null
      case "pix-settings":
        return <PixSettingsPage />
      case "mercado-pago-unified":
        return <MercadoPagoUnified />
      case "payment-systems":
        return <PaymentSystemSelector />
      case "ai-settings":
        return <AISettings />
      case "app-identity":
        return (
          <AppIdentityConfig
            appConfig={getConfigValue("app_identity", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("app_identity", newValues)}
          />
        )
      case "prophet-profile":
        return (
          <ProphetProfileConfig
            appConfig={getConfigValue("prophet_profile", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("prophet_profile", newValues)}
          />
        )
      case "chat-behavior":
        return (
          <ChatBehaviorConfig
            appConfig={getConfigValue("chat_behavior", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("chat_behavior", newValues)}
          />
        )
      case "interface-theme":
        return (
          <InterfaceThemeConfig
            appConfig={getConfigValue("interface_theme", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("interface_theme", newValues)}
          />
        )
      case "security":
        return (
          <SecurityConfig
            appConfig={getConfigValue("security", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("security", newValues)}
          />
        )
      case "database":
        return (
          <DatabaseConfig
            appConfig={getConfigValue("database", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("database", newValues)}
          />
        )
      case "email-notifications":
        return (
          <EmailNotificationsConfig
            appConfig={getConfigValue("email_notifications", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("email_notifications", newValues)}
          />
        )
      case "performance":
        return (
          <PerformanceConfig
            appConfig={getConfigValue("performance", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("performance", newValues)}
          />
        )
      case "mobile-settings":
        return (
          <MobileSettingsConfig
            appConfig={getConfigValue("mobile_settings", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("mobile_settings", newValues)}
          />
        )
      case "analytics":
        return (
          <AnalyticsConfig
            appConfig={getConfigValue("analytics", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("analytics", newValues)}
          />
        )
      case "advanced":
        return (
          <AdvancedConfig
            appConfig={getConfigValue("advanced", {})}
            onConfigUpdate={(newValues) => handleConfigUpdate("advanced", newValues)}
          />
        )
      default:
        return <DashboardOverview />
    }
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      appConfig={{
        appName: getConfigValue("app_identity", {})?.appName || "Falando com o Profeta",
        logo: getConfigValue("app_identity", {})?.logo || "/placeholder.svg?height=32&width=32&text=Logo",
        favicon: getConfigValue("app_identity", {})?.favicon || "/placeholder.svg?height=16&width=16&text=F",
        prophetAvatar:
          getConfigValue("prophet_profile", {})?.prophetAvatar || "/placeholder.svg?height=40&width=40&text=WB",
        prophetName: getConfigValue("prophet_profile", {})?.prophetName || "Profeta William Branham",
      }}
      theme={currentTheme}
    >
      {renderContent()}
    </AdminLayout>
  )
}
